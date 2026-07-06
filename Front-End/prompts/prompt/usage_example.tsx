// ============================================================
// كيف تربط الإشعارات في التطبيق
// أضد هذا الكود في صفحة الـ Login أو الـ Home بعد تسجيل الدخول
// ============================================================

import { NotificationService } from '@/services/notificationService';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth'; // استخدم hook المصادقة عندك

// ─── Hook خاص بالإشعارات ─────────────────────────────────
export function useNotifications() {
    const { user } = useAuth();

    useEffect(() => {
        // فقط لو المستخدم مسجل دخول
        if (!user) return;

        // محاولة الاشتراك تلقائياً
        const initNotifications = async () => {
            const status = NotificationService.getPermissionStatus();

            if (status === 'granted') {
                // الإذن موجود، اشترك مباشرة
                await NotificationService.subscribeToPush();
            }
            // لو 'default' (لم يقرر بعد) → لا نطلب تلقائياً
            // نتركها للزر في الإعدادات
        };

        initNotifications();
    }, [user]);
}

// ─── كيف تستخدم الزر في الإعدادات ───────────────────────
// في صفحة NotificationSettings.tsx أضد:

export function NotificationToggle() {
    const [enabled, setEnabled] = useState(
        NotificationService.getPermissionStatus() === 'granted'
    );

    const handleToggle = async () => {
        if (!enabled) {
            // تفعيل الإشعارات
            const success = await NotificationService.subscribeToPush();
            if (success) setEnabled(true);
        } else {
            // تعطيل الإشعارات
            const success = await NotificationService.unsubscribeFromPush();
            if (success) setEnabled(false);
        }
    };

    return (
        <div>
            <label>الإشعارات الفورية</label>
            <button onClick={handleToggle}>
                {enabled ? '🔔 مفعّل' : '🔕 معطّل'}
            </button>
        </div>
    );
}
