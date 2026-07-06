<?php
namespace App\Http\Controllers\Api\Patient;

use App\Http\Controllers\Controller;
use App\Http\Requests\Shared\SendChatMessageRequest;
use App\Http\Resources\Shared\ChatMessageResource;
use App\Models\Consultation;
use App\Models\ConsultationMessage;
use App\Services\ChatImageService;
use App\Services\NotificationService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;

class ConsultationChatController extends Controller
{
    use ApiResponse;

    public function __construct(
        private ChatImageService $imageService,
        private NotificationService $notificationService,
    ) {}

    // ✅ FIX #1 — دالتان منفصلتان
    // getOwned: تحقق من الملكية فقط — تُستخدم لـ getMessages (تعمل حتى بعد انتهاء الاستشارة)
    private function getOwned(int $id): Consultation
    {
        return Consultation::where('id', $id)
            ->where('user_id', auth('patient')->id())->firstOrFail();
    }

    // getActive: تحقق من الملكية + السطاتوس — تُستخدم لـ sendMessage فقط
    private function getActive(int $id): Consultation
    {
        $c = $this->getOwned($id);
        abort_if(!in_array($c->status, ['confirmed', 'in_progress']), 403,
            'المحادثة مغلقة — انتهت الاستشارة');
        return $c;
    }

    /** GET /consultations/{id}/chat/messages — يعمل حتى على الاستشارات المنتهية */
    public function getMessages(int $consultationId): JsonResponse
    {
        $patientId = auth('patient')->id();
        Cache::put('chat-patient-online-' . $patientId, true, now()->addSeconds(5));

        $c = $this->getOwned($consultationId);
        $msgs = ConsultationMessage::where('consultation_id', $c->id)
            ->with(['consultation.patient', 'consultation.doctor'])->oldest()
            ->paginate(config('chat.limits.messages_per_page', 50));
            
        $response = $this->successResponse(ChatMessageResource::collection($msgs), 'تم جلب الرسائل')->getData(true);
        $response['other_party_online'] = Cache::has('chat-doctor-online-' . $c->doctor_id);
        
        return response()->json($response);
    }

    /** GET /consultations/{id}/chat/messages/new?last_message_id=X */
    public function getNewMessages(Request $request, int $consultationId): JsonResponse
    {
        $patientId = auth('patient')->id();
        Cache::put('chat-patient-online-' . $patientId, true, now()->addSeconds(5));

        $c = $this->getOwned($consultationId);
        $lastId = max(0, (int) $request->query('last_message_id', 0));
        $checkIds = array_filter(explode(',', $request->query('check_ids', '')));

        $msgs = ConsultationMessage::where('consultation_id', $c->id)
            ->where(function($q) use ($lastId, $checkIds) {
                if ($lastId > 0) $q->where('id', '>', $lastId);
                if (!empty($checkIds)) $q->orWhereIn('id', $checkIds);
            })
            ->with(['consultation.patient', 'consultation.doctor'])->oldest()->get();
        ConsultationMessage::where('consultation_id', $c->id)
            ->where('sender_type', 'doctor')->where('is_delivered', false)
            ->update(['is_delivered' => true, 'delivered_at' => now()]);
            
        $response = $this->successResponse(ChatMessageResource::collection($msgs), 'رسائل جديدة')->getData(true);
        $response['other_party_online'] = Cache::has('chat-doctor-online-' . $c->doctor_id);
        
        return response()->json($response);
    }

    /** POST /consultations/{id}/chat/messages — يستخدم getActive */
    public function sendMessage(SendChatMessageRequest $request, int $consultationId): JsonResponse
    {
        $c = $this->getActive($consultationId);
        $patient = auth('patient')->user();
        $imagePath = null;
        $type = 'text';
        if ($request->hasFile('image')) {
            $imagePath = $this->imageService->store($request->file('image'), $consultationId);
            $type = $request->filled('message') ? 'text_image' : 'image';
        }
        $msg = ConsultationMessage::create([
            'consultation_id' => $c->id, 'sender_type' => 'patient',
            'sender_id' => $patient->id, 'message' => $request->input('message'),
            'image_path' => $imagePath, 'message_type' => $type,
        ]);
        $c->load('doctor');
        $this->notificationService->notifyNewChatMessage($c->doctor, $patient, $c, $msg);
        return $this->successResponse(
            new ChatMessageResource($msg->load(['consultation.patient', 'consultation.doctor'])),
            'تم إرسال الرسالة', 201
        );
    }

    /** PUT /consultations/{id}/chat/messages/read */
    public function markAsRead(int $consultationId): JsonResponse
    {
        $c = $this->getOwned($consultationId);
        ConsultationMessage::where('consultation_id', $c->id)
            ->where('sender_type', 'doctor')->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now(), 'is_delivered' => true]);
        return $this->successResponse(null, 'تم تحديد الرسائل كمقروءة');
    }

    /** GET /consultations/chat/unread-count */
    public function getUnreadCount(): JsonResponse
    {
        $count = ConsultationMessage::whereHas('consultation',
            fn($q) => $q->where('user_id', auth('patient')->id())
        )->where('sender_type', 'doctor')->where('is_read', false)->count();
        return $this->successResponse(['unread_count' => $count], 'عدد الرسائل غير المقروءة');
    }

    public function downloadImage(int $consultationId, int $messageId)
    {
        $c = $this->getOwned($consultationId);
        $msg = ConsultationMessage::where('consultation_id', $c->id)->findOrFail($messageId);
        
        if (!$msg->image_path) {
            abort(404, 'Image not found');
        }
        
        $disk = config('chat.storage.disk', 'public');
        if (!Storage::disk($disk)->exists($msg->image_path)) {
            abort(404, 'File does not exist');
        }
        
        return Storage::disk($disk)->download($msg->image_path, 'widad-image-' . $msg->id . '.jpg');
    }
}
