<?php

namespace App\Jobs;

use App\Models\PatientGoogleFit;
use App\Models\PatientHeartRate;
use App\Models\PatientOxygen;
use App\Models\PatientSleep;
use App\Models\PatientStep;
use App\Services\GoogleFitService;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SyncGoogleFitData implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(GoogleFitService $googleFitService): void
    {
        $connections = PatientGoogleFit::with('user')->get();

        foreach ($connections as $connection) {
            try {
                // Refresh if needed
                if ($connection->updated_at->diffInMinutes(now()) > 50 && $connection->refresh_token) {
                    $newTokens = $googleFitService->refreshAccessToken($connection->refresh_token);
                    $connection->update([
                        'access_token' => $newTokens['access_token'],
                        'expires_in' => $newTokens['expires_in'] ?? 3599
                    ]);
                }

                $accessToken = $connection->access_token;
                $sources = $googleFitService->fetchDataSources($accessToken);

                $now = Carbon::now('UTC');
                $start4h = $now->copy()->subHours(4); // Lighter background sync interval

                $heartRates = $googleFitService->fetchHeartRate($accessToken, $sources, $start4h, $now);
                $oxygens = $googleFitService->fetchOxygen($accessToken, $sources, $start4h, $now);
                $steps = $googleFitService->fetchSteps($accessToken, $sources, $start4h, $now);
                $sleeps = $googleFitService->fetchSleep($accessToken, $sources, $start4h, $now);

                foreach ($heartRates as $hr) {
                    PatientHeartRate::updateOrCreate(
                        ['user_id' => $connection->user_id, 'timestamp' => $hr['timestamp']],
                        ['heart_rate_bpm' => $hr['heart_rate_bpm']]
                    );
                }

                foreach ($oxygens as $oxy) {
                    PatientOxygen::updateOrCreate(
                        ['user_id' => $connection->user_id, 'timestamp' => $oxy['timestamp']],
                        ['oxygen_pct' => $oxy['oxygen_pct']]
                    );
                }

                foreach ($steps as $st) {
                    PatientStep::updateOrCreate(
                        ['user_id' => $connection->user_id, 'timestamp' => $st['timestamp']],
                        ['steps' => $st['steps']]
                    );
                }

                foreach ($sleeps as $sl) {
                    PatientSleep::updateOrCreate(
                        ['user_id' => $connection->user_id, 'start_time' => $sl['start_time'], 'end_time' => $sl['end_time']],
                        ['stage' => $sl['stage']]
                    );
                }
            } catch (\Exception $e) {
                Log::error("Failed to background sync Google Fit for User ID {$connection->user_id}: " . $e->getMessage());
            }
        }
    }
}
