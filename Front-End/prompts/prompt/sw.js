// ============================================================
// ملف: public/sw.js
// الموقع: widad-frontend/public/sw.js
// الوصف: Service Worker - يعمل في الخلفية حتى لو التطبيق مغلق
// ============================================================

// ─── استقبال الإشعار من السيرفر ───────────────────────────
self.addEventListener('push', function (event) {
    // لو السيرفر أرسل بيانات
    if (!event.data) return;

    let notification;

    try {
        // حاول تحويل البيانات من JSON
        notification = event.data.json();
    } catch (e) {
        // لو مش JSON، استخدمه كـ text
        notification = {
            title: 'منصة وداد الصحية',
            body: event.data.text(),
        };
    }

    // إعداد خيارات الإشعار
    const options = {
        body:    notification.body || '',
        icon:    notification.icon || '/icons/icon-192x192.png',
        badge:   notification.badge || '/icons/badge-72x72.png',
        tag:     notification.tag || 'widad-notification',  // منع التكرار
        data:    { url: notification.url || '/' },          // الـ URL عند الضغط
        actions: notification.actions || [],
        // للـ vibration على الهاتف
        vibrate: [100, 50, 100],
    };

    // إظهار الإشعار
    event.waitUntil(
        self.registration.showNotification(notification.title, options)
    );
});

// ─── الضغط على الإشعار ───────────────────────────────────
self.addEventListener('notificationclick', function (event) {
    event.notification.close(); // اغلق الإشعار

    // الـ URL المحفوظ في البيانات
    const url = (event.notification.data && event.notification.data.url)
        ? event.notification.data.url
        : '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(function (windowClients) {
                // لو التطبيق مفتوح، انتقل للـ URL
                for (let client of windowClients) {
                    if (client.url === url) {
                        client.focus();
                        return;
                    }
                }
                // لو التطبيق مغلق، افتحه
                return clients.openWindow(url);
            })
    );
});

// ─── تحديث السيرفر ──────────────────────────────────────
self.addEventListener('install', function (event) {
    // اسمح بالتحديث الفوري
    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    event.waitUntil(clients.claim());
});
