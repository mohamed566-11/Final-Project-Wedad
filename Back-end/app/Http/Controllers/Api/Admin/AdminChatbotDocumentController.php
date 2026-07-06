<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\UploadChatbotDocumentJob;
use App\Models\ChatbotDocument;
use App\Services\ChatbotService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Http\Requests\Admin\Chatbot\StoreDocumentRequest;

class AdminChatbotDocumentController extends Controller
{
    use ApiResponse;

    protected $chatbotService;

    public function __construct(ChatbotService $chatbotService)
    {
        $this->chatbotService = $chatbotService;
    }

    /**
     * Get all documents.
     */
    public function index(Request $request)
    {
        if (!$request->user('admin') || !$request->user('admin')->hasPermission(\App\Enums\Permission::MANAGE_CHATBOT)) {
            return $this->errorResponse('غير مصرح لك بذلك', 403);
        }

        $query = ChatbotDocument::query();

        if ($request->has('bot_type')) {
            $query->where('bot_type', $request->bot_type);
        }

        $documents = $query->latest()->paginate(15);

        // Transform the collection to include formatted size
        $documents->getCollection()->transform(function ($doc) {
            $doc->formatted_size = $doc->formatted_size;
            return $doc;
        });

        return $this->successResponse($documents, 'تم جلب الملفات بنجاح');
    }

    /**
     * Upload a document to a specific chatbot (Async via Queue).
     *
     * الملف يُحفظ مؤقتاً في storage/app/chatbot-uploads ثم يُعالَج
     * في الخلفية عبر UploadChatbotDocumentJob لتجنب timeout الـ 120s.
     */
    public function store(StoreDocumentRequest $request)
    {
        $file = $request->file('file');
        $botType = $request->bot_type;

        // حفظ الملف مؤقتاً في local storage
        $tempPath = $file->store('chatbot-uploads', 'local');

        $document = ChatbotDocument::create([
            'bot_type' => $botType,
            'file_name' => $file->getClientOriginalName(),
            'file_size' => $file->getSize(),
            'status' => 'processing',
        ]);

        // بناءً على طلبك، تمت معالجة الملف مباشرة فوراً (Synchronous) في جميع بيئات العمل (Local & Production)
        UploadChatbotDocumentJob::dispatchSync(
            $document->id,
            $botType,
            $tempPath,
            $file->getClientOriginalName()
        );

        // إعادة تحميل الموديل لمعرفة الحالة الجديدة
        $document->refresh();

        return $this->successResponse(
            ['document' => $document],
            'تم معالجة الملف وإضافته لقاعدة المعرفة بنجاح.'
        );
    }

    /**
     * Delete a document from the chatbot and the database.
     */
    public function destroy($id, Request $request)
    {
        if (!$request->user('admin') || !$request->user('admin')->hasPermission(\App\Enums\Permission::MANAGE_CHATBOT)) {
            return $this->errorResponse('غير مصرح لك بذلك', 403);
        }

        $document = ChatbotDocument::findOrFail($id);

        try {
            $result = $this->chatbotService->deleteDocumentFromBot($document->bot_type, $document->file_name);
            $document->delete();
            return $this->successResponse(['bot_result' => $result], 'تم حذف الملف من قاعدة المعرفة بنجاح');
        } catch (\Exception $e) {
            return $this->errorResponse('فشل حذف الملف من البوت: ' . $e->getMessage(), 500);
        }
    }
}
