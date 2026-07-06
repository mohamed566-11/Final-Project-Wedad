<?php
namespace App\Http\Controllers\Api\Doctor\Auth;


use App\Models\Doctor;
use App\Traits\ApiResponse;
use App\Utils\ImageManager;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use App\Http\Resources\Doctor\DoctorResource;
use App\Http\Requests\Doctor\DoctorRegisterRequest;

// تأكد من أن الكنترولر يستخدم Trait ApiResponse
class RegisterController extends \App\Http\Controllers\Controller
{
    use ApiResponse;
    public function register(DoctorRegisterRequest $request, ImageManager $imageManager)
{
    DB::beginTransaction();
    try {
        // 1. تجهيز البيانات الأساسية
        $doctorData = [
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password ?? 'password123'),
            'phone'    => $request->phone,
            'age'      => $request->age ? $request->age : null,
            'image'    => null, // القيمة الافتراضية
            'is_active' => true,
            'email_verified_at' => now(),

            // Required doctor-specific fields
            'specialization' => $request->specialization,
            'license_number' => $request->license_number,
            'consultation_price' => $request->consultation_price,
            'verification_status' => 'pending', // Requires admin verification before accessing the platform
        ];

        // 2. معالجة الصورة باستخدام ImageManager المحسن
        // بما أن حقل الصورة موجود في جدول المستخدمين (string)، سنحفظ المسار فقط
        if ($request->hasFile('image')) {
            // نرفع الصورة ونأخذ مسار الملف (يعود كاملاً: profiles/uuid.jpg)
            $filePath = $imageManager->uploadSingleImage($request->file('image'), 'profiles', 'uploads');
            $doctorData['image'] = $filePath;
        }

        // 3. إنشاء المستخدم
        $doctor = Doctor::create($doctorData);

        // Assign default role
        // $defaultRole = Role::where('guard_name', 'doctor')->where('name', 'doctor')->first();
        // if ($defaultRole) {
        //     $doctor->assignRole($defaultRole);
        // }

        // هنا هنكريت بروفايل ليه

        // 4. إصدار التوكن
        $token = $doctor->createToken('doctor-token')->plainTextToken;




        //  الإضافة هنا: تحميل علاقة البروفايل داخل كائن المستخدم
        DB::commit();

        // 6. إرجاع الاستجابة (باستخدام Trait ApiResponse المحسن)
        // نقوم بإرجاع بيانات المستخدم (يمكنك استخدام doctorResource هنا أيضاً)
        $responseData = [
            'doctor'  => new DoctorResource($doctor),
            'token' => $token
        ];

        return $this->successResponse($responseData, 'doctor Created Successfully', 201);

    } catch (\Exception $e) {
        DB::rollBack();

        // تسجيل الخطأ بدقة لمعرفته في ملفات اللوج
        Log::error('Error From Registration process: ' . $e->getMessage());

        // في حالة وجود صورة تم رفعها ولكن حدث خطأ لاحقاً، يفضل حذفها (خطوة احترافية إضافية)
        // if (isset($fileName)) { $imageManager->deleteImage('doctors/' . $fileName); }

        return $this->errorResponse('حدث خطأ أثناء التسجيل، يرجى المحاولة لاحقاً', 500);
    }

}
}
