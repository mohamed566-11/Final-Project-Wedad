# حل مشكلة Logout 500 Internal Server Error

## 🛠️ التعديلات التي تمت:

1. **تحديد الـ Guard في `LoginController`**:
   تم تعديل دالة `logout` و `logoutAllDevices` في كل من `Patient`، `Doctor`، و `Admin` controllers لتستخدم `user('guard_name')` بدلاً من `user()` الافتراضي.
   
   ```php
   // قبل
   $request->user()->currentAccessToken()->delete();

   // بعد
   if ($request->user('patient')) {
       $request->user('patient')->currentAccessToken()->delete();
       // ...
   }
   ```

2. **تصحيح اسم ملف Trait**:
   تم تغيير اسم ملف `app/Traits/APiResponse.php` إلى `app/Traits/ApiResponse.php` لتصحيح الـ casing وتجنب مشاكل الـ Autoloading.

3. **إضافة Route Names Prefixes**:
   تم تحديث `bootstrap/app.php` لإضافة أسماء مختصرة للـ Routes:
   - `patient.*`
   - `doctor.*`
   - `admin.*`

## 🧪 للتحقق من الحل:

1. تأكد من إرسال `Authorization: Bearer <TOKEN>` في الـ Header.
2. تأكد من إرسال `Accept: application/json` في الـ Header.
3. حاول تسجيل الدخول والحصول على Token جديد، ثم جرب تسجيل الخروج.
4. إذا كان الـ Token غير صالح، ستتلقى `401 Unauthorized` بدلاً من `500 Internal Server Error` (وهذا هو السلوك الصحيح).
