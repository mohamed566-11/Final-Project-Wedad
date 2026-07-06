<?php

namespace App\Jobs;

use App\Models\LabTestResult;
use App\Services\LabTestOcrService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessLabTestJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int   $tries   = 3;
    public int   $timeout = 180;
    public array $backoff  = [5, 15];

    public function __construct(private readonly LabTestResult $labTest) {}

    public function handle(LabTestOcrService $service): void
    {
        Log::info('lab_ocr_job_started', [
            'lab_test_id' => $this->labTest->id,
            'attempt'     => $this->attempts(),
        ]);

        $service->processImage($this->labTest);

        Log::info('lab_ocr_job_completed', ['lab_test_id' => $this->labTest->id]);
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('lab_ocr_job_permanently_failed', [
            'lab_test_id' => $this->labTest->id,
            'error'       => $exception->getMessage(),
        ]);

        $this->labTest->markAsFailed(
            'فشل في معالجة التحليل بعد ' . $this->tries . ' محاولات: ' . $exception->getMessage()
        );
    }
}
