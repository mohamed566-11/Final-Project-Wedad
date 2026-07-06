<?php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Shared\ChatMessageResource;
use App\Models\Consultation;
use App\Models\ConsultationMessage;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatMonitorController extends Controller
{
    use ApiResponse;

    public function getConversation(int $consultationId): JsonResponse
    {
        $c = Consultation::with(['patient', 'doctor'])->findOrFail($consultationId);
        $msgs = ConsultationMessage::where('consultation_id', $consultationId)
            ->with(['consultation.patient', 'consultation.doctor'])
            ->oldest()->paginate(50);
        return $this->successResponse([
            'consultation' => [
                'id' => $c->id, 'status' => $c->status,
                'patient_name' => $c->patient->name,
                'doctor_name' => $c->doctor->name,
            ],
            'messages' => ChatMessageResource::collection($msgs),
        ], 'تفاصيل المحادثة');
    }

    public function getAllActiveChats(Request $request): JsonResponse
    {
        $query = Consultation::whereIn('status', ['confirmed', 'in_progress'])
            ->withCount('messages')->with(['patient:id,name', 'doctor:id,name'])
            ->having('messages_count', '>', 0)
            ->when($request->filled('doctor_id'), fn($q) => $q->where('doctor_id', $request->doctor_id))
            ->when($request->filled('date'), fn($q) => $q->whereDate('date', $request->date))
            ->latest();
        return $this->successResponse($query->paginate(20), 'المحادثات النشطة');
    }

    public function getChatStats(): JsonResponse
    {
        return $this->successResponse([
            'total_messages_today' => ConsultationMessage::whereDate('created_at', today())->count(),
            'active_consultations' => Consultation::whereIn('status', ['confirmed', 'in_progress'])
                ->whereHas('messages', fn($q) => $q->where('created_at', '>=', now()->subDay()))->count(),
            'unresponded_chats' => Consultation::whereIn('status', ['confirmed', 'in_progress'])
                ->whereDoesntHave('messages', fn($q) => $q->where('sender_type', 'doctor'))
                ->where('updated_at', '<=', now()->subDay())->count(),
        ], 'إحصاءات الشات');
    }
}
