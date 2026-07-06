// ============================================================
// ملف: src/services/notificationService.ts
// الموقع: widad-frontend/src/services/notificationService.ts
// الوصف: إدارة كل شيء متعلق بالإشعارات في الـ Frontend
// ============================================================

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// ─── الخدمة الرئيسية ─────────────────────────────────────
export const NotificationService = {

    /**
     * الخطوة 1: تسجيل الـ Service Worker
     * يجب استدعاء هذه الدالة أول ما التطبيق يفتح
     */
    async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
        // الـ Service Worker فقط يعمل على HTTPS أو localhost
        if (!('serviceWorker' in navigator)) {
            console.warn('Service Worker غير مدعوم في هذا المتصفح');
            return null;
        }

        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('✅ تم تسجيل Service Worker');
            return registration;
        } catch (error) {
            console.error('❌ خطأ في تسجيل Service Worker:', error);
            return null;
        }
    },

    /**
     * الخطوة 2: طلب إذن الإشعارات من المستخدم
     */
    async requestPermission(): Promise<boolean> {
        if (Notification.permission === 'granted') {
            return true; // الإذن موجود أصلاً
        }

        if (Notification.permission === 'denied') {
            console.warn('المستخدم رفض الإشعارات سابقاً');
            return false;
        }

        // طلب الإذن
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    },

    /**
     * الخطوة 3: الاشتراك في الـ Push Notifications
     * هذه الدالة تجمع كل الخطوات السابقة
     */
    async subscribeToPush(): Promise<boolean> {
        try {
            // 1. سجّل الـ Service Worker
            const registration = await this.registerServiceWorker();
            if (!registration) return false;

            // 2. طلب الإذن
            const hasPermission = await this.requestPermission();
            if (!hasPermission) return false;

            // 3. الحصول على الـ VAPID Public Key من السيرفر
            const response = await fetch(`${API_BASE}/patient/notifications/vapid-key`, {
                headers: { 'Accept': 'application/json' },
            });
            const { public_key } = await response.json();

            // 4. إنشاء الـ Push Subscription
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(public_key),
            });

            // 5. إرسال الـ Subscription للـ Backend
            const subscribeResponse = await fetch(`${API_BASE}/patient/notifications/subscribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    endpoint: subscription.endpoint,
                    p256dh:   this.arrayBufferToBase64(subscription.getKey('p256dh')),
                    auth:     this.arrayBufferToBase64(subscription.getKey('auth')),
                }),
            });

            if (subscribeResponse.ok) {
                console.log('✅ تم الاشتراك في الإشعارات بنجاح');
                return true;
            }

            return false;

        } catch (error) {
            console.error('❌ خطأ في الاشتراك:', error);
            return false;
        }
    },

    /**
     * إلغاء الاشتراك في الإشعارات
     */
    async unsubscribeFromPush(): Promise<boolean> {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (!subscription) return true;

            // إلغاء الاشتراك من السيرفر
            await fetch(`${API_BASE}/patient/notifications/unsubscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint: subscription.endpoint }),
            });

            // إلغاء الاشتراك محلياً
            await subscription.unsubscribe();
            console.log('✅ تم إلغاء الاشتراك');
            return true;

        } catch (error) {
            console.error('❌ خطأ في إلغاء الاشتراك:', error);
            return false;
        }
    },

    /**
     * التحقق من حالة الإشعارات
     */
    getPermissionStatus(): string {
        if (!('Notification' in window)) return 'unsupported';
        return Notification.permission; // 'granted' | 'denied' | 'default'
    },

    // ─── دوال مساعدة ─────────────────────────────────────

    /**
     * تحويل Base64 URL إلى Uint8Array (للـ VAPID Key)
     */
    urlBase64ToUint8Array(base64String: string): Uint8Array {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const raw = window.atob(base64);
        const array = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) {
            array[i] = raw.charCodeAt(i);
        }
        return array;
    },

    /**
     * تحويل ArrayBuffer إلى Base64 String
     */
    arrayBufferToBase64(buffer: ArrayBuffer | null): string {
        if (!buffer) return '';
        const array = new Uint8Array(buffer);
        let binary = '';
        array.forEach((byte) => { binary += String.fromCharCode(byte); });
        return btoa(binary);
    },
};
