<?php
// ============================================================
// ملف: app/Models/PushSubscription.php
// الموقع: widad-backend/app/Models/PushSubscription.php
// الوصف: Model الاشتراكات الإشعار الفوري
// ============================================================

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PushSubscription extends Model
{
    use HasFactory;

    protected $table = 'push_subscriptions';

    protected $fillable = [
        'user_id',
        'endpoint',    // رابط الإرسال من المتصفح
        'p256dh',      // مفتاح التشفير العام للمستخدم
        'auth',        // مفتاح المصادقة
        'device_type', // نوع الجهاز (mobile, desktop)
    ];

    /**
     * علاقة مع المستخدم
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
