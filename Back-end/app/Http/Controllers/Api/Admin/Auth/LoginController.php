<?php
namespace App\Http\Controllers\Api\Admin\Auth;



use App\Models\Admin;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Hash;

use App\Http\Resources\Admin\AdminResource;
use Illuminate\Support\Facades\RateLimiter;
use App\Http\Requests\Admin\AdminLoginRequest;


class LoginController extends Controller
{
    use ApiResponse;
public function login(AdminLoginRequest $request)
    {
        // 1. مفتاح فريد يجمع بين الإيميل والـ IP لتجنب حظر الجميع
        $key = 'login_attempts:' . $request->ip() . '|' . $request->email;

        // 2. التحقق من عدد المحاولات (مثلاً 5 محاولات)
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            return $this->errorResponse('لقد تجاوزت عدد المحاولات المسموحة. حاول مرة أخرى بعد ' . $seconds . ' ثانية.', 429);
        }

        // 3. البحث عن المستخدم
        $admin = Admin::where('email', $request->email)->first();

        // 4. التحقق من المستخدم وكلمة السر معاً
        if (!$admin || !Hash::check($request->password, $admin->password)) {
            // تسجيل محاولة فاشلة (لمدة دقيقة مثلاً)
            RateLimiter::hit($key, 60);
            
            // رسالة موحدة للأمان
            return $this->errorResponse('بيانات الدخول غير صحيحة.', 401);
        }

        // Check is_active
        if (!$admin->is_active) {
             return $this->errorResponse('الحساب معطل. يرجى مراجعة الإدارة العليا.', 403);
        }

        // 5. تصفير العداد عند النجاح (مهم جداً)
        RateLimiter::clear($key);

        // 6. إنشاء التوكن
        $token = $admin->createToken('Admin-access-token', ['*'], now()->addMonth())->plainTextToken;
        $admin->load('role');

        // 7. إرجاع البيانات باستخدام Resource لضمان عدم خروج بيانات حساسة
        $data = [
            'admin' => new AdminResource($admin), 
            'token' => $token,
        ];

        return $this->successResponse($data, 'تم تسجيل الدخول بنجاح.', 200);
    }

    public function me(Request $request)
    {
        $admin = $request->user('admin');
        $admin->load('role');
        return $this->successResponse(new AdminResource($admin), 'تم جلب البيانات بنجاح.', 200);
    }

    public function logout(Request $request)
    {
        if ($request->user('admin')) {
            $request->user('admin')->currentAccessToken()->delete();
            return $this->successResponse(null, 'تم تسجيل الخروج بنجاح.', 200);
        }

        return $this->errorResponse('المستخدم غير موثق.', 401);
    }
    public function logoutAllDevices(Request $request)
    {
        if ($request->user('admin')) {
            $request->user('admin')->tokens()->delete();
            return $this->successResponse(null, 'تم تسجيل الخروج من جميع الأجهزة بنجاح.');
        }

        return $this->errorResponse('المستخدم غير موثق.', 401);
    }
}
