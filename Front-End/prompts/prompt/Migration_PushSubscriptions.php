<?php
// ============================================================
// ملف: database/migrations/2024_01_20_000001_create_push_subscriptions_table.php
// الموقع: widad-backend/database/migrations/
// الوصف: Migration لجدول اشتراكات الإشعارات الفورية
// ============================================================

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('push_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // حذف الاشتراكات عند حذف المستخدم
            $table->text('endpoint')->unique();        // رابط الإرسال
            $table->text('p256dh');                    // مفتاح التشفير
            $table->text('auth');                      // مفتاح المصادقة
            $table->string('device_type')->default('unknown'); // نوع الجهاز
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('push_subscriptions');
    }
};
