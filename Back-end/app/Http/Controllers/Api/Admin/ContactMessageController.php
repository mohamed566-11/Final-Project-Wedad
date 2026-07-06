<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactUs;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class ContactMessageController extends Controller
{
    use ApiResponse;

    /**
     * Get all contact messages
     * GET /api/v1/admin/contact-messages
     */
    public function index(Request $request)
    {
        $query = ContactUs::query();

        // Read status filter
        if ($request->has('is_read')) {
            $query->where('is_read', $request->boolean('is_read'));
        }

        // Date range filter
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('subject', 'like', "%{$search}%")
                  ->orWhere('message', 'like', "%{$search}%");
            });
        }

        // Sort by newest first, unread first
        $query->orderBy('is_read', 'asc')->orderByDesc('created_at');

        $messages = $query->paginate(20);

        // Get statistics
        $stats = [
            'total' => ContactUs::count(),
            'unread' => ContactUs::where('is_read', false)->count(),
            'read' => ContactUs::where('is_read', true)->count(),
        ];

        // Transform messages data
        $transformedMessages = $messages->getCollection()->map(function ($message) {
            return $this->transformMessage($message);
        });

        return $this->successResponse([
            'messages' => $transformedMessages,
            'stats' => $stats,
            'pagination' => [
                'total' => $messages->total(),
                'per_page' => $messages->perPage(),
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage(),
            ],
        ]);
    }

    /**
     * Get a specific contact message
     * GET /api/v1/admin/contact-messages/{id}
     */
    public function show($id)
    {
        $message = ContactUs::find($id);

        if (!$message) {
            return $this->errorResponse('الرسالة غير موجودة', 404);
        }

        // Auto mark as read when viewed
        if (!$message->is_read) {
            $message->markAsRead();
        }

        return $this->successResponse([
            'message' => $this->transformMessage($message),
        ]);
    }

    /**
     * Mark message as read
     * PUT /api/v1/admin/contact-messages/{id}/mark-read
     */
    public function markAsRead($id)
    {
        $message = ContactUs::find($id);

        if (!$message) {
            return $this->errorResponse('الرسالة غير موجودة', 404);
        }

        $message->markAsRead();

        return $this->successResponse([
            'message' => $this->transformMessage($message),
        ], 'تم تحديد الرسالة كمقروءة');
    }

    /**
     * Mark message as unread
     * PUT /api/v1/admin/contact-messages/{id}/mark-unread
     */
    public function markAsUnread($id)
    {
        $message = ContactUs::find($id);

        if (!$message) {
            return $this->errorResponse('الرسالة غير موجودة', 404);
        }

        $message->update([
            'is_read' => false,
            'read_at' => null,
        ]);

        return $this->successResponse([
            'message' => $this->transformMessage($message),
        ], 'تم تحديد الرسالة كغير مقروءة');
    }

    /**
     * Mark multiple messages as read
     * PUT /api/v1/admin/contact-messages/mark-all-read
     */
    public function markAllAsRead()
    {
        ContactUs::where('is_read', false)->update([
            'is_read' => true,
            'read_at' => now(),
        ]);

        return $this->successResponse(null, 'تم تحديد جميع الرسائل كمقروءة');
    }

    /**
     * Delete a contact message
     * DELETE /api/v1/admin/contact-messages/{id}
     */
    public function destroy($id)
    {
        $message = ContactUs::find($id);

        if (!$message) {
            return $this->errorResponse('الرسالة غير موجودة', 404);
        }

        $message->delete();

        return $this->successResponse(null, 'تم حذف الرسالة بنجاح');
    }

    /**
     * Delete multiple messages
     * DELETE /api/v1/admin/contact-messages/bulk-delete
     */
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:contact_us,id',
        ]);

        ContactUs::whereIn('id', $request->ids)->delete();

        return $this->successResponse(null, 'تم حذف الرسائل المحددة بنجاح');
    }

    /**
     * Transform message data
     */
    private function transformMessage(ContactUs $message): array
    {
        return [
            'id' => $message->id,
            'name' => $message->name,
            'email' => $message->email,
            'phone' => $message->phone,
            'subject' => $message->subject,
            'message' => $message->message,
            'is_read' => $message->is_read,
            'read_at' => $message->read_at?->format('Y-m-d H:i:s'),
            'ip_address' => $message->ip_address,
            'submitted_at' => $message->created_at->format('Y-m-d H:i:s'),
        ];
    }
}
