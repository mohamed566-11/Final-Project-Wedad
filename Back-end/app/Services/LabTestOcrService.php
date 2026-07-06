<?php

namespace App\Services;

use App\Models\LabTestResult;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class LabTestOcrService
{
    private string $spaceUrl;
    private int    $timeout;
    private int    $maxAttempts;

    public function __construct()
    {
        $this->spaceUrl    = rtrim(config('lab_ocr.hugging_face.space_url'), '/');
        $this->timeout     = (int) config('lab_ocr.hugging_face.timeout', 120);
        $this->maxAttempts = app()->environment('local') ? 2 : 3;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MAIN ENTRY POINT — called by ProcessLabTestJob
    // ─────────────────────────────────────────────────────────────────────────

    public function processImage(LabTestResult $labTest): void
    {
        $labTest->markAsProcessing();

        // Check Redis cache first (key: lab_ocr:{md5_hash})
        $cacheKey = config('lab_ocr.cache.prefix') . $labTest->image_hash;
        $cached   = Cache::get($cacheKey);

        if ($cached) {
            Log::info('lab_ocr_cache_hit', ['id' => $labTest->id, 'hash' => $labTest->image_hash]);
            $labTest->markAsCompleted($cached);
            return;
        }

        // Cache Miss — upload to HF and extract
        $localPath = Storage::disk('public')->path($labTest->image_path);
        $filename  = basename($labTest->image_path);

        $hfPath  = $this->uploadImageToHuggingFace($localPath, $filename);
        $results = $this->extractLabResults($hfPath);

        // Store in Redis for 24h
        Cache::put($cacheKey, $results, now()->addHours(config('lab_ocr.cache.ttl_hours', 24)));

        $labTest->markAsCompleted($results);

        Log::info('lab_ocr_completed', [
            'id'          => $labTest->id,
            'tests_count' => count($results['tests'] ?? []),
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 1 — Upload image to HF /gradio_api/upload
    // ─────────────────────────────────────────────────────────────────────────

    public function uploadImageToHuggingFace(string $localPath, string $filename): string
    {
        $uploadUrl = $this->spaceUrl . config('lab_ocr.hugging_face.upload_path');

        Log::info('lab_ocr_upload_start', ['url' => $uploadUrl, 'file' => $filename]);

        $response = Http::timeout($this->timeout)
            ->withOptions(['verify' => !app()->environment('local')])
            ->attach('files', fopen($localPath, 'r'), $filename)
            ->post($uploadUrl);

        if (!$response->successful() || empty($response->json())) {
            throw new \RuntimeException(
                'HF upload failed (HTTP ' . $response->status() . '): ' . Str::limit($response->body(), 300)
            );
        }

        $hfPath = $response->json()[0];
        Log::info('lab_ocr_upload_success', ['hf_path' => $hfPath]);

        return $hfPath;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 2 — POST to /extract_from_image → event_id, then GET SSE
    // ─────────────────────────────────────────────────────────────────────────

    public function extractLabResults(string $hfImagePath): array
    {
        $predictUrl = $this->spaceUrl . config('lab_ocr.hugging_face.predict_path');

        for ($attempt = 1; $attempt <= $this->maxAttempts; $attempt++) {
            try {
                // Step 2a: POST → event_id
                $postResponse = Http::timeout($this->timeout)
                    ->withOptions(['verify' => !app()->environment('local')])
                    ->withHeaders(['Content-Type' => 'application/json'])
                    ->post($predictUrl, [
                        'image_path' => [
                            'path' => $hfImagePath,
                            'meta' => ['_type' => 'gradio.FileData'],
                        ],
                    ]);

                // 503/500 = Space cold-starting → retry
                if (in_array($postResponse->status(), [500, 503])) {
                    Log::warning('lab_ocr_space_starting', [
                        'attempt' => $attempt,
                        'status'  => $postResponse->status(),
                    ]);
                    if ($attempt < $this->maxAttempts) {
                        sleep($this->backoff($attempt));
                        continue;
                    }
                    throw new \RuntimeException('HF Space unavailable after ' . $this->maxAttempts . ' attempts (HTTP ' . $postResponse->status() . ')');
                }

                if (!$postResponse->successful()) {
                    throw new \RuntimeException('HF POST failed: ' . $postResponse->status());
                }

                $eventId = $postResponse->json('event_id');
                if (!$eventId) {
                    Log::warning('lab_ocr_no_event_id', ['attempt' => $attempt, 'body' => Str::limit($postResponse->body(), 300)]);
                    if ($attempt < $this->maxAttempts) { sleep($this->backoff($attempt)); continue; }
                    throw new \RuntimeException('No event_id received from HF after ' . $this->maxAttempts . ' attempts');
                }

                // Step 2b: GET SSE
                $resultUrl = $this->spaceUrl . config('lab_ocr.hugging_face.result_path') . '/' . $eventId;

                $getResponse = Http::timeout($this->timeout)
                    ->withOptions(['verify' => !app()->environment('local')])
                    ->get($resultUrl);

                if (!$getResponse->successful()) {
                    throw new \RuntimeException('HF GET SSE failed: ' . $getResponse->status());
                }

                return $this->parseSSEResponse($getResponse->body());

            } catch (\Illuminate\Http\Client\ConnectionException $e) {
                Log::warning('lab_ocr_connection_retry', ['attempt' => $attempt, 'error' => $e->getMessage()]);
                if ($attempt < $this->maxAttempts) { sleep($this->backoff($attempt)); continue; }
                throw $e;
            }
        }

        throw new \RuntimeException('HF extraction failed after ' . $this->maxAttempts . ' attempts');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SSE PARSER — adapted from ChatbotService::parseSSEResponse()
    // Difference: OCR returns JSON {tests, patient_info, lab_info}, not text
    // ─────────────────────────────────────────────────────────────────────────

    public function parseSSEResponse(string $sseBody): array
    {
        Log::info('lab_ocr_raw_sse', ['body' => Str::limit($sseBody, 2000)]);

        $lines     = explode("\n", $sseBody);
        $dataLines = [];

        foreach ($lines as $line) {
            $line = trim($line);
            if (str_starts_with($line, 'data:')) {
                $payload = trim(substr($line, 5));
                if ($payload !== '' && $payload !== 'null' && $payload !== '[DONE]') {
                    $dataLines[] = $payload;
                }
            }
        }

        if (empty($dataLines)) {
            throw new \RuntimeException('No data lines in SSE response — Space may be sleeping');
        }

        // Scan from newest to oldest (same pattern as ChatbotService)
        for ($i = count($dataLines) - 1; $i >= 0; $i--) {
            try {
                $decoded = json_decode($dataLines[$i], true);
                if (!is_array($decoded)) continue;

                // OCR Space returns: [{ tests:[...], patient_info:{...}, lab_info:{...} }]
                // Outer array wrapper from Gradio
                $payload = $decoded[0] ?? $decoded;

                if (isset($payload['tests']) && is_array($payload['tests'])) {
                    return $this->formatResults($payload);
                }

                // Handle case where result is directly the array
                if (isset($decoded['tests']) && is_array($decoded['tests'])) {
                    return $this->formatResults($decoded);
                }

            } catch (\Exception $e) {
                Log::warning('lab_ocr_sse_parse_error', ['raw' => Str::limit($dataLines[$i], 300)]);
            }
        }

        throw new \RuntimeException('Could not extract OCR results from SSE response — invalid JSON structure');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Response Mapper
    // ─────────────────────────────────────────────────────────────────────────

    private function formatResults(array $payload): array
    {
        $formattedTests = [];
        foreach ($payload['tests'] as $test) {
            $formattedTests[] = [
                'test_name'       => $test['canonical_name'] ?? $test['raw_test_name'] ?? 'غير متعرف عليه',
                'value'           => (string) ($test['value'] ?? $test['raw_value'] ?? ''),
                'unit'            => (string) ($test['unit'] ?? $test['raw_unit'] ?? ''),
                'reference_range' => (string) ($test['reference_range_raw'] ?? ''),
                'status'          => $test['status'] ?? 'unknown',
            ];
        }

        $payload['tests'] = $formattedTests;
        return $payload;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Exponential backoff — same pattern as ChatbotService
    // ─────────────────────────────────────────────────────────────────────────

    private function backoff(int $attempt): int
    {
        return min(20, 5 * (int) pow(2, max(0, $attempt - 1)));
        // attempt 1 → 5s, attempt 2 → 10s, attempt 3+ → 20s
    }
}
