<?php

namespace App\Http\Controllers\Api\Admin\Auth\Password;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ResetPasswordRequest;
use App\Models\Admin; 
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
        // 1. التحقق من صحة كود الـ OTP
        $otpValidation = $this->otp->validate($request->email, $request->code);

        if (!$otpValidation->status) {
            // نستخدم رسالة الباكدج لأنها أدق (Expired vs Invalid)
            return $this->errorResponse($otpValidation->message, 400);
        }

        
        // بما أننا تحققنا من وجود الإيميل في الـ Request، فالمستخدم موجود بالتأكيد
        $admin = Admin::where('email', $request->email)->first();

        if (!$admin) {
            return $this->errorResponse('admin not found', 404);
        }

        $admin->update([
            'password' => Hash::make($request->password),
        ]);

        $admin->tokens()->delete();

        return $this->successResponse(null, 'Password has been reset successfully. Please login with your new password.', 200);
    }
}