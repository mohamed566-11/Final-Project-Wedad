<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Log;
use App\Models\Consultation;
use Carbon\Carbon;

class ZoomService
{
    protected $client;
    protected $accountId;
    protected $clientId;
    protected $clientSecret;
    protected $baseUrl = 'https://api.zoom.us/v2';

    public function __construct()
    {
        $this->accountId = config('services.zoom.account_id');
        $this->clientId = config('services.zoom.client_id');
        $this->clientSecret = config('services.zoom.client_secret');
        
        $this->client = new Client([
            'base_uri' => $this->baseUrl,
            'timeout' => 30,
        ]);
    }

    /**
     * Get OAuth access token using Server-to-Server OAuth
     */
    protected function getAccessToken(): ?string
    {
        try {
            $client = new Client();
            $response = $client->post('https://zoom.us/oauth/token', [
                'headers' => [
                    'Authorization' => 'Basic ' . base64_encode($this->clientId . ':' . $this->clientSecret),
                    'Content-Type' => 'application/x-www-form-urlencoded',
                ],
                'form_params' => [
                    'grant_type' => 'account_credentials',
                    'account_id' => $this->accountId,
                ],
            ]);

            $data = json_decode($response->getBody()->getContents(), true);
            return $data['access_token'] ?? null;
        } catch (GuzzleException $e) {
            Log::error('Zoom OAuth Error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Create a Zoom meeting for a consultation
     */
    public function createMeeting(Consultation $consultation): ?array
    {
        $accessToken = $this->getAccessToken();
        
        if (!$accessToken) {
            Log::error('Failed to get Zoom access token');
            return null;
        }

        try {
            $doctor = $consultation->doctor;
            $patient = $consultation->patient;
            
            $startTime = Carbon::parse($consultation->date . ' ' . $consultation->time)
                ->setTimezone('Africa/Cairo')
                ->format('Y-m-d\TH:i:s');

            $response = $this->client->post('/users/me/meetings', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $accessToken,
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'topic' => "استشارة طبية مع د. {$doctor->name}",
                    'type' => 2, // Scheduled meeting
                    'start_time' => $startTime,
                    'duration' => $consultation->duration_minutes ?? 30,
                    'timezone' => 'Africa/Cairo',
                    'password' => $this->generateMeetingPassword(),
                    'agenda' => "استشارة طبية - {$patient->name}",
                    'settings' => [
                        'host_video' => true,
                        'participant_video' => true,
                        'join_before_host' => false,
                        'mute_upon_entry' => true,
                        'watermark' => false,
                        'use_pmi' => false,
                        'approval_type' => 0,
                        'audio' => 'voip',
                        'auto_recording' => 'none',
                        'waiting_room' => true,
                        'meeting_authentication' => false,
                    ],
                ],
            ]);

            $meetingData = json_decode($response->getBody()->getContents(), true);

            return [
                'meeting_id' => (string) $meetingData['id'],
                'join_url' => $meetingData['join_url'],
                'start_url' => $meetingData['start_url'],
                'password' => $meetingData['password'],
            ];
        } catch (GuzzleException $e) {
            Log::error('Zoom Create Meeting Error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Delete a Zoom meeting
     */
    public function deleteMeeting(string $meetingId): bool
    {
        $accessToken = $this->getAccessToken();
        
        if (!$accessToken) {
            return false;
        }

        try {
            $this->client->delete("/meetings/{$meetingId}", [
                'headers' => [
                    'Authorization' => 'Bearer ' . $accessToken,
                ],
            ]);
            return true;
        } catch (GuzzleException $e) {
            Log::error('Zoom Delete Meeting Error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Update a Zoom meeting
     */
    public function updateMeeting(string $meetingId, array $data): bool
    {
        $accessToken = $this->getAccessToken();
        
        if (!$accessToken) {
            return false;
        }

        try {
            $this->client->patch("/meetings/{$meetingId}", [
                'headers' => [
                    'Authorization' => 'Bearer ' . $accessToken,
                    'Content-Type' => 'application/json',
                ],
                'json' => $data,
            ]);
            return true;
        } catch (GuzzleException $e) {
            Log::error('Zoom Update Meeting Error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Get meeting details
     */
    public function getMeeting(string $meetingId): ?array
    {
        $accessToken = $this->getAccessToken();
        
        if (!$accessToken) {
            return null;
        }

        try {
            $response = $this->client->get("/meetings/{$meetingId}", [
                'headers' => [
                    'Authorization' => 'Bearer ' . $accessToken,
                ],
            ]);

            return json_decode($response->getBody()->getContents(), true);
        } catch (GuzzleException $e) {
            Log::error('Zoom Get Meeting Error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Generate SDK signature for joining meeting
     */
    public function generateSignature(string $meetingNumber, int $role = 0): string
    {
        $sdkKey = config('services.zoom.sdk_key');
        $sdkSecret = config('services.zoom.sdk_secret');
        
        $iat = time();
        $exp = $iat + 60 * 60 * 2; // Token expires in 2 hours

        $payload = [
            'sdkKey' => $sdkKey,
            'mn' => $meetingNumber,
            'role' => $role, // 0 for participant, 1 for host
            'iat' => $iat,
            'exp' => $exp,
            'tokenExp' => $exp,
        ];

        return $this->base64UrlEncode(json_encode(['alg' => 'HS256', 'typ' => 'JWT'])) . '.' .
               $this->base64UrlEncode(json_encode($payload)) . '.' .
               $this->base64UrlEncode(hash_hmac('sha256', 
                   $this->base64UrlEncode(json_encode(['alg' => 'HS256', 'typ' => 'JWT'])) . '.' .
                   $this->base64UrlEncode(json_encode($payload)), 
                   $sdkSecret, true));
    }

    /**
     * Base64 URL encode
     */
    protected function base64UrlEncode($data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Generate a random meeting password
     */
    protected function generateMeetingPassword(): string
    {
        return substr(str_shuffle('0123456789abcdefghijklmnopqrstuvwxyz'), 0, 6);
    }

    /**
     * Check if Zoom is configured
     */
    public function isConfigured(): bool
    {
        return !empty($this->accountId) && 
               !empty($this->clientId) && 
               !empty($this->clientSecret);
    }
}
