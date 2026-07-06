<?php
namespace App\Http\Controllers\Api\Patient\Auth;


use App\Models\User;
use App\Traits\ApiResponse;
use App\Utils\ImageManager;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use App\Notifications\SendOtpVerifyUserEmail;
use App\Http\Resources\Patient\PatientResource;
use App\Http\Requests\Patient\PatientRegisterRequest;

// تأكد من أن الكنترولر يستخدم Trait ApiResponse
class RegisterController extends \App\Http\Controllers\Controller
{
    use ApiResponse;
    public function register(PatientRegisterRequest $request, ImageManager $imageManager)
{
    DB::beginTransaction();
    try {
        // 1. تجهيز البيانات الأساسية
        $userData = [
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password), 
            'phone'    => $request->phone,
            'age'      => $request->age ? $request->age : null,
            'life_stage_id' => $request->life_stage_id ?? null,
            'image'    => null, // القيمة الافتراضية
        ];

        // 2. معالجة الصورة باستخدام ImageManager المحسن
        // بما أن حقل الصورة موجود في جدول المستخدمين (string)، سنحفظ المسار فقط
        if ($request->hasFile('image')) {
            // نرفع الصورة ونأخذ اسم الملف
            $fileName = $imageManager->uploadSingleImage($request->file('image'), 'users', 'public');
            $userData['image'] = $fileName;
        }

        // 3. إنشاء المستخدم
        $user = User::create($userData);

        // Assign default role
        // $defaultRole = Role::where('guard_name', 'patient')->where('name', 'patient')->first();
        // if ($defaultRole) {
        //     $patient->assignRole($defaultRole);
        // }
        
        // هنا هنكريت بروفايل ليه 

        // 4. إصدار التوكن
        $token = $user->createToken('user-token')->plainTextToken;

        // Create profile (empty for now, can be filled later)
        $user->profile()->create([]);

        // 5. إرسال الإشعار
        $user->notify(new SendOtpVerifyUserEmail());
        // ✅ الإضافة هنا: تحميل علاقة البروفايل والمرحلة العمرية داخل كائن المستخدم
        $user->load(['profile', 'lifeStage']);
        DB::commit();

        // 6. إرجاع الاستجابة (باستخدام Trait ApiResponse المحسن)
        // نقوم بإرجاع بيانات المستخدم (يمكنك استخدام UserResource هنا أيضاً)
        $responseData = [
            'user'  => new PatientResource($user),
            'token' => $token
        ];

        return $this->successResponse($responseData, 'User Created Successfully', 201);

    } catch (\Exception $e) {
        DB::rollBack();
        
        // تسجيل الخطأ بدقة لمعرفته في ملفات اللوج
        Log::error('Error From Registration process: ' . $e->getMessage());

        // في حالة وجود صورة تم رفعها ولكن حدث خطأ لاحقاً، يفضل حذفها (خطوة احترافية إضافية)
        // if (isset($fileName)) { $imageManager->deleteImage('users/' . $fileName); }

        return $this->errorResponse('Internal server error', 500);
    }

}
}
