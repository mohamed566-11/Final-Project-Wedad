<?php

namespace App\Http\Controllers\Api\Doctor\Auth\Password;

use App\Http\Controllers\Controller;
use App\Http\Requests\Doctor\ResetPasswordRequest;
use App\Models\Doctor;
use App\Traits\ApiResponse;
use Ichtrojan\Otp\Otp;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ResetPasswordController extends Controller
{
    use ApiResponse;

    protected $otp;

    public function __construct(Otp $otp)
    {
        $this->otp = $otp;
    }

    public function resetPassword(ResetPasswordRequest $request)
    {
        $email = strtolower(trim($request->email));

        // 1. التحقق من صحة كود الـ OTP
        $otpValidation = $this->otp->validate($email, $request->code);

        if (!$otpValidation->status) {
            $message = $otpValidation->message;
            if ($message === 'OTP does not exist' || $message === 'OTP is invalid') {
                $message = 'رمز التحقق غير صحيح.';
            } elseif ($message === 'OTP is expired') {
                $message = 'انتهت صلاحية رمز التحقق.';
            }
            return $this->errorResponse($message, 400);
        }


        // بما أننا تحققنا من وجود الإيميل في الـ Request، فالمستخدم موجود بالتأكيد
        $doctor = Doctor::where('email', $request->email)->first();

        if (!$doctor) {
            return $this->errorResponse('Doctor not found', 404);
        }

        $doctor->update([
            'password' => Hash::make($request->password),
        ]);

        $doctor->tokens()->delete();

        // إرسال إشعار للمستخدم بأنه تم تغيير كلمة المرور
        $doctor->notify(new \App\Notifications\PasswordChangedNotification());

        return $this->successResponse(null, 'Password has been reset successfully. Please login with your new password.', 200);
    }
}