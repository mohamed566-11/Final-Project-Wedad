<?php
namespace App\Http\Controllers\Api\Doctor\Auth;



use App\Models\Doctor;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use App\Http\Requests\Doctor\DoctorLoginRequest;
use App\Http\Resources\Doctor\DoctorResource;
use App\Traits\ApiResponse;


class LoginController extends Controller
{
    use ApiResponse;
public function login(DoctorLoginRequest $request)
    {
        // 1. مفتاح فريد يجمع بين الإيميل والـ IP لتجنب حظر الجميع
        $key = 'login_attempts:' . $request->ip() . '|' . $request->email;

        // 2. التحقق من عدد المحاولات (مثلاً 5 محاولات)
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            return $this->errorResponse('Too many login attempts. Please try again in ' . $seconds . ' seconds.', 429);
        }

        // 3. البحث عن المستخدم
        $doctor = Doctor::where('email', $request->email)->first();

        // 4. التحقق من المستخدم وكلمة السر معاً
        if (!$doctor || !Hash::check($request->password, $doctor->password)) {
            // تسجيل محاولة فاشلة (لمدة دقيقة مثلاً)
            RateLimiter::hit($key, 60);
            
            // رسالة موحدة للأمان
            return $this->errorResponse('Invalid credentials', 401);
        }

        // Check is_active for doctor
        if (!$doctor->is_active) {
             return $this->errorResponse('الحساب معطل. يرجى مراجعة الإدارة.', 403);
        }

        // Check verification_status for doctor
        if ($doctor->verification_status !== 'approved') {
             return $this->errorResponse('لم يتم التحقق من الحساب بعد، أو تم رفضه. يرجى مراجعة الإدارة.', 403);
        }
        // 5. تصفير العداد عند النجاح (مهم جداً)
        RateLimiter::clear($key);

        // Update last login
        $doctor->update(['last_login_at' => now()]);

        // 6. إنشاء التوكن
        $token = $doctor->createToken('Doctor-access-token', ['*'], now()->addMonth())->plainTextToken;
        $doctor->load('lifeStages');

        // 7. إرجاع البيانات باستخدام Resource لضمان عدم خروج بيانات حساسة
        $data = [
            'doctor' => new DoctorResource($doctor), 
            'token' => $token,
        ];

        return $this->successResponse($data, 'doctor logged in successfully', 200);
    }

    public function me(Request $request)
    {
        $doctor = $request->user('doctor');
        $doctor->load('lifeStages');
        return $this->successResponse(new DoctorResource($doctor), 'User retrieved successfully', 200);
    }

    public function logout(Request $request)
    {
        if ($request->user('doctor')) {
            $request->user('doctor')->currentAccessToken()->delete();
            return $this->successResponse(null, 'Logged out successfully', 200);
        }

        return $this->errorResponse('User not authenticated', 401);
    }
    public function logoutAllDevices(Request $request)
    {
        if ($request->user('doctor')) {
            $request->user('doctor')->tokens()->delete();
            return $this->successResponse(null, 'Logged out from all devices successfully');
        }

        return $this->errorResponse('User not authenticated', 401);
    }
}
