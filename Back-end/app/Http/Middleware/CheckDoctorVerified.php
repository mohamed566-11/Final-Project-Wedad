<?php

namespace App\Http\Middleware;

use App\Traits\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckDoctorVerified
{
    use ApiResponse;

    /**
     * Handle an incoming request.
     *
     * Ensures that the authenticated doctor has been verified by admin.
     * Doctors with pending/rejected verification status cannot access protected routes.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $doctor = Auth::guard('doctor')->user();

        if ($doctor && !in_array($doctor->verification_status, ['verified', 'approved'])) {
            $messages = [
                'pending' => 'حسابك قيد المراجعة. يرجى الانتظار حتى يتم التحقق من بياناتك.',
                'rejected' => 'تم رفض طلب التحقق الخاص بك. يرجى التواصل مع الإدارة.',
            ];

            $message = $messages[$doctor->verification_status]
                ?? 'حسابك غير مُتحقق. يرجى التواصل مع الإدارة.';

            return $this->errorResponse($message, 403);
        }

        return $next($request);
    }
}
