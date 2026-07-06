<?php
namespace App\Http\Controllers\Api\Doctor\Auth\Password;


use App\Models\Doctor;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\RateLimiter;
use App\Notifications\SendOtpForgetPassword;

class ForgetPasswordController extends Controller
{
    use ApiResponse;
    public function sendOtp(Request $request)
{
    $email = strtolower(trim($request->email));

    $request->merge(['email' => $email]); // دمج الإيميل المنظف للتحقق منه
    $request->validate([
        'email' => ['required', 'email', 'exists:doctors,email']
    ]);

    $key = 'forget_password:' . $request->ip() . '|' . $email;
    
    if (RateLimiter::tooManyAttempts($key, 1)) {
        $seconds = RateLimiter::availableIn($key);
        return $this->errorResponse('Please wait ' . $seconds . ' seconds before trying again.', 429);
    }

    $doctor = Doctor::where('email', $email)->first();

    // 5. إرسال الإشعار
    // نقوم بتسجيل المحاولة في الـ Rate Limiter فقط عند الإرسال الفعلي
    RateLimiter::hit($key, 120); // الحظر لمدة دقيقتين (120 ثانية)
    
    $doctor->notify(new SendOtpForgetPassword());

    return $this->successResponse(null, 'OTP sent successfully, please check your email.', 200);
}



}
