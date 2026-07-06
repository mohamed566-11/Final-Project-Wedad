<?php
namespace App\Http\Controllers\Api\Patient\Auth;


use Ichtrojan\Otp\Otp;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use App\Notifications\SendOtpVerifyUserEmail;

class VerifyEmailController extends Controller
{
    use ApiResponse;
protected $otp;

    // حقن الكلاس أفضل من new Otp()
    public function __construct(Otp $otp)
    {
        $this->otp = $otp;
    }

    public function verifyEmail(Request $request)
    {
        $request->validate(['code' => 'required|string|size:5']);

        // استخدام $request->user() أفضل ويدعم الـ Polymorphism
        $user = $request->user(); 

        // 1. التحقق أولاً: هل هو مفعل أصلاً؟
        if ($user->hasVerifiedEmail()) {
            return $this->successResponse(null, 'Email is already verified.', 200);
        }

        // 2. التحقق من الـ OTP
        $otpValidation = $this->otp->validate($user->email, $request->code);

        if (!$otpValidation->status) {
            // نستخدم رسالة الخطأ القادمة من الباكدج (expired, invalid, etc)
            return $this->errorResponse($otpValidation->message ?? 'Invalid code', 400);
        }

        // 3. تفعيل الحساب
        // استخدام markEmailAsVerified() إذا كان الموديل يستخدم MustVerifyEmail
        // أو طريقتك الحالية forceFill ممتازة أيضاً
        $user->forceFill([
            'email_verified_at' => now(),
        ])->save();

        // 4. (اختياري) مسح أي توكنز قديمة لتوفير المساحة، لكن الباكدج يقوم بذلك غالباً

        return $this->successResponse(null, 'Email Verified successfully.', 200);
    }

    public function sendOtpAgain(Request $request)
    {
        $user = $request->user();

        // 1. التحقق أولاً
        if ($user->hasVerifiedEmail()) {
            return $this->errorResponse('Email is already verified.', 400);
        }

        // 2. حماية الـ Resend (Rate Limiting) 🔥 مهم جداً
        // نسمح بمحاولة واحدة كل دقيقة لكل مستخدم
        $key = 'resend_otp:' . $user->id;
        
        if (RateLimiter::tooManyAttempts($key, 1)) {
            $seconds = RateLimiter::availableIn($key);
            return $this->errorResponse('Please wait ' . $seconds . ' seconds before resending.', 429);
        }

        RateLimiter::hit($key, 60); // تسجيل المحاولة لمدة 60 ثانية

        // 3. إرسال الإشعار
        $user->notify(new SendOtpVerifyUserEmail());

        return $this->successResponse(null, 'OTP sent successfully.', 200);
    }
}
