<?php

namespace App\Http\Controllers\Api\Patient;

use App\Http\Controllers\Controller;
use App\Models\PatientGoogleFit;
use App\Models\PatientHeartRate;
use App\Models\PatientOxygen;
use App\Models\PatientSleep;
use App\Models\PatientStep;
use App\Services\GoogleFitService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class IotController extends Controller
{
    protected GoogleFitService $googleFitService;

    public function __construct(GoogleFitService $googleFitService)
    {
        $this->googleFitService = $googleFitService;
    }

    /**
     * Get the Google Auth URL
     */
    public function getAuthUrl()
    {
        return response()->json([
            'url' => $this->googleFitService->getAuthorizationUrl()
        ]);
    }

    /**
     * Connect (Callback) - Frontend sends the 'code' here
     */
    public function connect(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
        ]);

        try {
            $tokens = $this->googleFitService->fetchTokens($request->code);

            PatientGoogleFit::updateOrCreate(
                ['user_id' => $request->user()->id],
                [
                    'access_token' => $tokens['access_token'],
                    'refresh_token' => $tokens['refresh_token'] ?? null,
                    'expires_in' => $tokens['expires_in'] ?? null,
                ]
            );

            // Trigger an initial sync
            $this->syncData($request->user());

            return response()->json(['message' => 'Successfully connected to Google Fit.']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Disconnect Google Fit
     */
    public function disconnect(Request $request)
    {
        PatientGoogleFit::where('user_id', $request->user()->id)->delete();
        return response()->json(['message' => 'Disconnected successfully.']);
    }

    /**
     * Manual Sync
     */
    public function sync(Request $request)
    {
        $user = $request->user();
        if (!$user->googleFitToken) {
            return response()->json(['error' => 'Not connected to Google Fit'], 400);
        }

        try {
            $this->syncData($user);
            return response()->json(['message' => 'Sync completed successfully.']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Sync failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Retrieve Metrics
     */
    public function metrics(Request $request)
    {
        $user = $request->user();
        $isConnected = $user->googleFitToken()->exists();

        if (!$isConnected) {
            return response()->json(['is_connected' => false]);
        }

        $now = Carbon::now();
        $last24h = $now->copy()->subHours(24);

        $heartRates = $user->heartRates()->where('timestamp', '>=', $last24h)->get();
        $oxygens = $user->oxygens()->where('timestamp', '>=', $last24h)->get();
        $steps = $user->stepRecords()->where('timestamp', '>=', $last24h)->get();
        $sleeps = $user->sleepSegments()->where('start_time', '>=', $now->copy()->subDays(14))->get();

        $latestHeartRate = $user->heartRates()->latest('timestamp')->first();

        // Calculate steps sum for 24h
        $stepsTotal = $steps->sum('steps');

        return response()->json([
            'is_connected' => true,
            'metrics' => [
                'latest_heart_rate' => $latestHeartRate ? $latestHeartRate->heart_rate_bpm : null,
                'steps_24h' => $stepsTotal,
            ],
            'charts' => [
                'heart_rates' => $heartRates,
                'oxygens' => $oxygens,
                'steps' => $steps,
                'sleeps' => $sleeps,
            ]
        ]);
    }

    /**
     * Internal method to pull and store data
     */
    protected function syncData($user)
    {
        $tokenModel = $user->googleFitToken;
        if (!$tokenModel) return;

        // Auto refresh token if expired (simplified check)
        if ($tokenModel->updated_at->diffInMinutes(now()) > 50 && $tokenModel->refresh_token) {
            $newTokens = $this->googleFitService->refreshAccessToken($tokenModel->refresh_token);
            $tokenModel->update([
                'access_token' => $newTokens['access_token'],
                'expires_in' => $newTokens['expires_in'] ?? 3599
            ]);
        }

        $accessToken = $tokenModel->access_token;
        $sources = $this->googleFitService->fetchDataSources($accessToken);

        $now = Carbon::now('UTC');
        $start24h = $now->copy()->subHours(24);
        $start14d = $now->copy()->subDays(14);

        // Fetch
        $heartRates = $this->googleFitService->fetchHeartRate($accessToken, $sources, $start24h, $now);
        $oxygens = $this->googleFitService->fetchOxygen($accessToken, $sources, $start24h, $now);
        $steps = $this->googleFitService->fetchSteps($accessToken, $sources, $start24h, $now);
        $sleeps = $this->googleFitService->fetchSleep($accessToken, $sources, $start14d, $now);

        // Store Heart Rates
        foreach ($heartRates as $hr) {
            PatientHeartRate::updateOrCreate(
                ['user_id' => $user->id, 'timestamp' => $hr['timestamp']],
                ['heart_rate_bpm' => $hr['heart_rate_bpm']]
            );
        }

        // Store Oxygens
        foreach ($oxygens as $oxy) {
            PatientOxygen::updateOrCreate(
                ['user_id' => $user->id, 'timestamp' => $oxy['timestamp']],
                ['oxygen_pct' => $oxy['oxygen_pct']]
            );
        }

        // Store Steps
        foreach ($steps as $st) {
            PatientStep::updateOrCreate(
                ['user_id' => $user->id, 'timestamp' => $st['timestamp']],
                ['steps' => $st['steps']]
            );
        }

        // Store Sleeps
        foreach ($sleeps as $sl) {
            PatientSleep::updateOrCreate(
                ['user_id' => $user->id, 'start_time' => $sl['start_time'], 'end_time' => $sl['end_time']],
                ['stage' => $sl['stage']]
            );
        }
    }

    public function debug(Request $request)
    {
        $patientFit = \App\Models\PatientGoogleFit::latest()->first();
        if (!$patientFit) {
            return response()->json(['error' => 'Not connected']);
        }

        try {
            $tokens = $this->googleFitService->refreshAccessToken($patientFit->refresh_token);
            $accessToken = $tokens['access_token'];

            $sources = $this->googleFitService->fetchDataSources($accessToken);

            $now = \Carbon\Carbon::now('UTC');
            $start24h = $now->copy()->subHours(24);
            $heartRates = $this->googleFitService->fetchHeartRate($accessToken, $sources, $start24h, $now);

            return response()->json([
                'token_refreshed' => true,
                'sources_count' => count($sources),
                'heart_rates_found' => count($heartRates),
                'sources' => array_map(function ($s) {
                    return [
                        'dataType' => $s['dataType']['name'] ?? '',
                        'dataStreamId' => $s['dataStreamId'] ?? ''
                    ];
                }, $sources),
                'raw_heart_points' => $heartRates
            ], 200, [], JSON_UNESCAPED_SLASHES);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()]);
        }
    }
}
