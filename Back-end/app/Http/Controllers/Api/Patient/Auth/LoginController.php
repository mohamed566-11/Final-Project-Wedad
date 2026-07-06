<?php
namespace App\Http\Controllers\Api\Patient\Auth;



use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use App\Http\Requests\Patient\PatientLoginRequest;
use App\Http\Resources\Patient\PatientResource;
use App\Traits\ApiResponse;


class LoginController extends Controller
{
    use ApiResponse;
public function login(PatientLoginRequest $request)
    {
        // 1. مفتاح فريد يجمع بين الإيميل والـ IP لتجنب حظر الجميع
        $key = 'login_attempts:' . $request->ip() . '|' . $request->email;

        // 2. التحقق من عدد المحاولات (مثلاً 5 محاولات)
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            return $this->errorResponse('Too many login attempts. Please try again in ' . $seconds . ' seconds.', 429);
        }

        // 3. البحث عن المستخدم
        $user = User::where('email', $request->email)->first();

        // 4. التحقق من المستخدم وكلمة السر معاً
        if (!$user || !Hash::check($request->password, $user->password)) {
            // تسجيل محاولة فاشلة (لمدة دقيقة مثلاً)
            RateLimiter::hit($key, 60);
            
            // رسالة موحدة للأمان
            return $this->errorResponse('Invalid credentials', 401);
        }

        // Check is_active for patient
        if (!$user->is_active) {
             return $this->errorResponse('الحساب مغلق. يرجى التواصل مع الدعم الفني.', 403);
        }

        // 5. تصفير العداد عند النجاح (مهم جداً)
        RateLimiter::clear($key);

        // Update last login
        $user->update(['last_login_at' => now()]);

        // 6. إنشاء التوكن
        $token = $user->createToken('patient-access-token', ['*'], now()->addMonth())->plainTextToken;
        $user->load(['profile', 'lifeStage']);

        // 7. إرجاع البيانات باستخدام Resource لضمان عدم خروج بيانات حساسة
        $data = [
            'user' => new PatientResource($user), 
            'token' => $token,
        ];

        return $this->successResponse($data, 'User logged in successfully', 200);
    }

    public function me(Request $request)
    {
        $patient = $request->user('patient');
        $patient->load(['profile', 'lifeStage']);
        return $this->successResponse(new PatientResource($patient), 'User retrieved successfully', 200);
    }

    public function logout(Request $request)
    {
        try {
            \Illuminate\Support\Facades\Log::info('Logout request received for patient.');

            if ($request->user('patient')) {
                \Illuminate\Support\Facades\Log::info('User found, deleting token.');
                $request->user('patient')->currentAccessToken()->delete();
                \Illuminate\Support\Facades\Log::info('Token deleted.');
                return $this->successResponse(null, 'Logged out successfully', 200);
            }
            
            \Illuminate\Support\Facades\Log::warning('User not found in logout request.');
            return $this->errorResponse('User not authenticated', 401);

        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Logout Error: ' . $e->getMessage());
            \Illuminate\Support\Facades\Log::error($e->getTraceAsString());
            return $this->errorResponse('فشل تسجيل الخروج، يرجى المحاولة لاحقاً', 500);
        }
    }
    public function logoutAllDevices(Request $request)
    {
        if ($request->user('patient')) {
            $request->user('patient')->tokens()->delete();
            return $this->successResponse(null, 'Logged out from all devices successfully');
        }

        return $this->errorResponse('User not authenticated', 401);
    }
}
