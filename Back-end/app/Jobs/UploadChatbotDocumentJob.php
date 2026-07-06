<?php

namespace App\Jobs;

use App\Models\ChatbotDocument;
use App\Services\ChatbotService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Job يعالج رفع ملف قاعدة المعرفة (RAG) بشكل غير متزامن.
 *
 * لماذا؟ عملية الـ RAG Embedding على Hugging Face قد تستغرق حتى 120 ثانية،
 * مما يمنع الأدمن من استخدام لوحة التحكم أثناء الانتظار.
 * الحل: الـ Job يُعالج العملية في الخلفية ويُحدّث حالة الملف في قاعدة البيانات.
 */
class UploadChatbotDocumentJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $timeout = 150; // أكبر من مهلة Guzzle (120s) بهامش أمان
    public array $backoff = [30]; // انتظر 30 ثانية قبل إعادة المحاولة

    public function __construct(
        private readonly int    $documentId,
        private readonly string $botType,
        private readonly string $tempFilePath,   // مسار الملف المؤقت في storage
        private readonly string $originalName,   // الاسم الأصلي للملف
    ) {}

    public function handle(ChatbotService $chatbotService): void
    {
        $document = ChatbotDocument::find($this->documentId);

        if (!$document) {
            Log::warning('upload_chatbot_doc_job_doc_not_found', [
                'document_id' => $this->documentId,
            ]);
            return;
        }

        try {
            // نُعيد بناء UploadedFile من المسار المؤقت
            $absolutePath = Storage::disk('local')->path($this->tempFilePath);

            if (!file_exists($absolutePath)) {
                throw new \Exception("Temp file not found: {$absolutePath}");
            }

            // نمرر الملف كـ SplFileInfo مؤقت متوافق مع ChatbotService
            $splFile = new \SplFileInfo($absolutePath);

            // نُنشئ كائناً مُساعداً يُحاكي واجهة UploadedFile
            $fakeUpload = new class($splFile, $this->originalName) {
                public function __construct(
                    private \SplFileInfo $file,
                    private string       $name,
                ) {}

                public function getRealPath(): string
                {
                    return $this->file->getRealPath();
                }

                public function getClientOriginalName(): string
                {
                    return $this->name;
                }
            };

            $result = $chatbotService->uploadDocumentToBot($this->botType, $fakeUpload);

            $document->update(['status' => 'ready']);

            Log::info('upload_chatbot_doc_job_success', [
                'document_id' => $this->documentId,
                'bot_type'    => $this->botType,
                'result'      => $result,
            ]);

        } catch (\Throwable $e) {
            Log::error('upload_chatbot_doc_job_failed', [
                'document_id' => $this->documentId,
                'bot_type'    => $this->botType,
                'error'       => $e->getMessage(),
                'attempt'     => $this->attempts(),
            ]);

            if ($this->attempts() >= $this->tries) {
                $document->update([
                    'status'        => 'failed',
                    'error_message' => $e->getMessage(),
                ]);
            }

            throw $e;
        } finally {
            // تنظيف الملف المؤقت فقط إذا استنفذ المحاولات وتفادى إتلاف الملف قبل الإعادة
            if ($this->attempts() >= $this->tries || $document->status === 'ready') {
                if (Storage::disk('local')->exists($this->tempFilePath)) {
                    Storage::disk('local')->delete($this->tempFilePath);
                }
            }
        }
    }
}
