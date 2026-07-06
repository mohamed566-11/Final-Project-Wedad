<?php

namespace App\Jobs;

use App\Models\AiChatMessage;
use App\Services\ChatbotService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessChatbotMessageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 60;
    public array $backoff = [5, 15];

    public function __construct(
        private readonly AiChatMessage $userMessage,
        private readonly string $botType,
        private readonly array $history,
        private readonly ?string $contextPrompt = null,
    ) {
    }

    public function handle(ChatbotService $chatbotService): void
    {
        // Update status to processing
        $metadata = $this->userMessage->metadata ?? [];
        $metadata['status'] = 'processing';
        $this->userMessage->update(['metadata' => $metadata]);

        try {
            // Build final message with context prepended
            $historyWithContext = $this->history;
            $finalMessage = $this->userMessage->message;
            if ($this->contextPrompt && !empty(trim($this->contextPrompt))) {
                $finalMessage = $this->contextPrompt . "\n\nسؤال المريضة:\n" . $this->userMessage->message;
            }

            $reply = $chatbotService->callHuggingFace(
                botType: $this->botType,
                message: $finalMessage,
                chatHistory: $historyWithContext,
            );

            // Save bot reply
            $botMessage = AiChatMessage::create([
                'user_id' => $this->userMessage->user_id,
                'session_id' => $this->userMessage->session_id,
                'bot_type' => $this->botType,
                'role' => 'assistant',
                'message' => $reply,
                'metadata' => ['status' => 'ready', 'parent_id' => $this->userMessage->id],
            ]);

            // Update user message status
            $metadata['status'] = 'replied';
            $metadata['reply_id'] = $botMessage->id;
            $this->userMessage->update(['metadata' => $metadata]);

            Log::info('chatbot_reply_saved', [
                'user_message_id' => $this->userMessage->id,
                'bot_message_id' => $botMessage->id,
                'bot_type' => $this->botType,
            ]);

        } catch (\Throwable $e) {
            Log::error('chatbot_job_failed', [
                'message_id' => $this->userMessage->id,
                'bot_type' => $this->botType,
                'error' => $e->getMessage(),
                'attempt' => $this->attempts(),
            ]);

            if ($this->attempts() >= $this->tries) {
                $metadata['status'] = 'failed';
                $this->userMessage->update(['metadata' => $metadata]);
            }

            throw $e;
        }
    }
}
