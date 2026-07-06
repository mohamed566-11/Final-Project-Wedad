<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GoogleFitService
{
    protected string $clientId;
    protected string $clientSecret;
    protected string $redirectUri;
    protected string $authUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    protected string $tokenUrl = "https://oauth2.googleapis.com/token";
    protected string $baseUrl = "https://www.googleapis.com/fitness/v1/users/me/dataSources";

    public function __construct()
    {
        $this->clientId = config('services.google_fit.client_id');
        $this->clientSecret = config('services.google_fit.client_secret');
        $this->redirectUri = config('services.google_fit.redirect_uri');
    }

    /**
     * Get the OAuth Authorization URL
     */
    public function getAuthorizationUrl(): string
    {
        $scopes = [
            "https://www.googleapis.com/auth/fitness.heart_rate.read",
            "https://www.googleapis.com/auth/fitness.sleep.read",
            "https://www.googleapis.com/auth/fitness.activity.read",
            "https://www.googleapis.com/auth/fitness.oxygen_saturation.read",
        ];

        $params = http_build_query([
            'client_id' => $this->clientId,
            'redirect_uri' => $this->redirectUri,
            'response_type' => 'code',
            'scope' => implode(' ', $scopes),
            'access_type' => 'offline',
            'prompt' => 'consent select_account',
        ]);

        return $this->authUrl . '?' . $params;
    }

    /**
     * Exchange Auth Code for Tokens
     */
    public function fetchTokens(string $code): array
    {
        $response = Http::asForm()->post($this->tokenUrl, [
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret,
            'code' => $code,
            'redirect_uri' => $this->redirectUri,
            'grant_type' => 'authorization_code',
        ]);

        if ($response->failed()) {
            Log::error('Google Fit Token Error', ['response' => $response->json()]);
            throw new \Exception("Failed to fetch Google Fit tokens");
        }

        return $response->json();
    }

    /**
     * Refresh an expired Access Token
     */
    public function refreshAccessToken(string $refreshToken): array
    {
        $response = Http::asForm()->post($this->tokenUrl, [
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret,
            'refresh_token' => $refreshToken,
            'grant_type' => 'refresh_token',
        ]);

        if ($response->failed()) {
            Log::error('Google Fit Refresh Error', ['response' => $response->json()]);
            throw new \Exception("Failed to refresh Google Fit token");
        }

        return $response->json();
    }

    /**
     * Fetch all available Data Sources for the user
     */
    public function fetchDataSources(string $accessToken): array
    {
        $response = Http::withToken($accessToken)
            ->get($this->baseUrl);

        if ($response->failed()) {
            throw new \Exception("Failed to fetch data sources: " . $response->body());
        }

        return $response->json('dataSource', []);
    }

    /**
     * Determine best data source matching Huawei/Honor bands
     */
    protected function getDataSourceCandidates(array $sources, string $dataTypeName, array $preferredSubstrings): array
    {
        $matches = [];
        foreach ($sources as $source) {
            if (($source['dataType']['name'] ?? '') === $dataTypeName) {
                $matches[] = $source['dataStreamId'];
            }
        }

        if (empty($matches)) {
            return [];
        }

        usort($matches, function ($a, $b) use ($preferredSubstrings) {
            $rankA = count($preferredSubstrings);
            $rankB = count($preferredSubstrings);

            foreach ($preferredSubstrings as $index => $token) {
                if (str_contains($a, $token) && $index < $rankA) $rankA = $index;
                if (str_contains($b, $token) && $index < $rankB) $rankB = $index;
            }

            return $rankA <=> $rankB;
        });

        return $matches;
    }

    /**
     * Fetch points for a specific dataset
     */
    protected function fetchDatasetPoints(string $accessToken, string $dataSourceId, Carbon $startTime, Carbon $endTime): array
    {
        if (empty($dataSourceId)) return [];

        $startNanos = (int) ($startTime->timestamp * 1000000000);
        $endNanos = (int) ($endTime->timestamp * 1000000000);

        // URL Encode the dataSourceId to handle colons
        $encodedSourceId = urlencode($dataSourceId);
        $url = "{$this->baseUrl}/{$encodedSourceId}/datasets/{$startNanos}-{$endNanos}";

        $response = Http::withToken($accessToken)->get($url);

        Log::info('Google Fit Dataset Fetch', [
            'url' => $url,
            'source' => $dataSourceId,
            'status' => $response->status(),
            'body_length' => strlen($response->body()),
            'point_count' => count($response->json('point', []))
        ]);

        if ($response->status() === 404) return [];
        
        if ($response->failed()) {
            Log::error('Google Fit Dataset Error', ['url' => $url, 'response' => $response->json()]);
            return [];
        }

        return $response->json('point', []);
    }

    /**
     * Get the highest quality points available for Huawei/Honor Priority
     */
    protected function fetchBestPoints(string $accessToken, array $sources, string $dataTypeName, array $preferredSubstrings, Carbon $startTime, Carbon $endTime): array
    {
        $candidates = $this->getDataSourceCandidates($sources, $dataTypeName, $preferredSubstrings);
        if (empty($candidates)) return [];

        $bestPoints = [];
        $bestLatest = null;

        foreach ($candidates as $candidate) {
            $points = $this->fetchDatasetPoints($accessToken, $candidate, $startTime, $endTime);
            $latest = null;
            
            foreach ($points as $point) {
                $time = $point['endTimeNanos'] ?? $point['startTimeNanos'] ?? null;
                if ($time && ($latest === null || $time > $latest)) {
                    $latest = $time;
                }
            }

            if ($latest !== null) {
                if ($bestLatest === null || $latest > $bestLatest) {
                    $bestLatest = $latest;
                    $bestPoints = $points;
                }
            }
        }

        return $bestPoints;
    }

    public function fetchHeartRate(string $accessToken, array $sources, Carbon $start, Carbon $end): array
    {
        $points = $this->fetchBestPoints($accessToken, $sources, "com.google.heart_rate.bpm", ["merge_heart_rate_bpm", "merged", "honor", "huawei", "health"], $start, $end);
        
        $records = [];
        foreach ($points as $point) {
            $nanos = $point['startTimeNanos'] ?? null;
            if (!$nanos) continue;
            
            $timestamp = Carbon::createFromTimestamp($nanos / 1000000000, 'UTC');
            $valObj = $point['value'][0] ?? [];
            $bpm = $valObj['fpVal'] ?? $valObj['intVal'] ?? null;
            
            if ($bpm !== null) {
                $records[] = ['timestamp' => $timestamp, 'heart_rate_bpm' => $bpm];
            }
        }
        return $records;
    }

    public function fetchOxygen(string $accessToken, array $sources, Carbon $start, Carbon $end): array
    {
        $points = $this->fetchBestPoints($accessToken, $sources, "com.google.oxygen_saturation", ["merged", "oxygen_saturation", "honor", "huawei", "health"], $start, $end);
        
        $records = [];
        foreach ($points as $point) {
            $nanos = $point['startTimeNanos'] ?? null;
            if (!$nanos) continue;
            
            $timestamp = Carbon::createFromTimestamp($nanos / 1000000000, 'UTC');
            $valObj = $point['value'][0] ?? [];
            $oxy = $valObj['fpVal'] ?? $valObj['intVal'] ?? null;
            
            if ($oxy !== null) {
                $pct = $oxy <= 1 ? $oxy * 100 : $oxy;
                $records[] = ['timestamp' => $timestamp, 'oxygen_pct' => $pct];
            }
        }
        return $records;
    }

    public function fetchSteps(string $accessToken, array $sources, Carbon $start, Carbon $end): array
    {
        $points = $this->fetchBestPoints($accessToken, $sources, "com.google.step_count.delta", ["merge_step", "estimated_steps", "honor", "huawei", "health"], $start, $end);
        
        $records = [];
        foreach ($points as $point) {
            $nanos = $point['endTimeNanos'] ?? null;
            if (!$nanos) continue;
            
            $timestamp = Carbon::createFromTimestamp($nanos / 1000000000, 'UTC');
            $valObj = $point['value'][0] ?? [];
            $steps = $valObj['intVal'] ?? $valObj['fpVal'] ?? null;
            
            if ($steps !== null) {
                $records[] = ['timestamp' => $timestamp, 'steps' => (int)$steps];
            }
        }
        return $records;
    }

    public function fetchSleep(string $accessToken, array $sources, Carbon $start, Carbon $end): array
    {
        $points = $this->fetchBestPoints($accessToken, $sources, "com.google.sleep.segment", ["merged", "sleep", "honor", "huawei", "health"], $start, $end);
        
        $records = [];
        foreach ($points as $point) {
            $startNanos = $point['startTimeNanos'] ?? null;
            $endNanos = $point['endTimeNanos'] ?? null;
            $valObj = $point['value'][0] ?? [];
            $stage = $valObj['intVal'] ?? null;

            if ($startNanos && $endNanos && $stage !== null) {
                $records[] = [
                    'start_time' => Carbon::createFromTimestamp($startNanos / 1000000000, 'UTC'),
                    'end_time' => Carbon::createFromTimestamp($endNanos / 1000000000, 'UTC'),
                    'stage' => (int) $stage
                ];
            }
        }
        return $records;
    }
}
