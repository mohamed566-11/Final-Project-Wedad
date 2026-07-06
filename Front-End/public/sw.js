// Service Worker for Push Notifications
// This file should be placed in the public folder as sw.js

const CACHE_NAME = "widad-health-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/icons/icon-192x192.svg",
  "/icons/icon-512x512.svg",
];

// Install event - cache assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    }),
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
  self.clients.claim();
});

// Push event - handle incoming push notifications
self.addEventListener("push", (event) => {
  console.log("Push received:", event);

  let data = {
    title: "منصة وداد الصحية",
    body: "لديك إشعار جديد",
    icon: "/icons/icon-192x192.svg",
    badge: "/icons/icon-72x72.svg",
    data: {},
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        ...data,
        ...payload,
      };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [100, 50, 100],
    data: data.data,
    dir: "rtl",
    lang: "ar",
    tag: data.data?.tag || "default",
    requireInteraction: data.data?.requireInteraction || false,
    actions: getActionsForType(data.data?.type),
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event);

  event.notification.close();

  const data = event.notification.data || {};
  let url = "/";

  // Determine URL based on notification type and action
  if (event.action === "view") {
    url = data.url || "/";
  } else if (event.action === "join") {
    url = data.video_url || "/";
  } else if (event.action === "dismiss") {
    return;
  } else {
    // Default click - go to related page
    switch (data.type) {
      case "consultation_reminder":
        url = `/patient/consultations/${data.consultation_id}`;
        break;
      case "consultation_confirmed":
        url = `/patient/consultations/${data.consultation_id}`;
        break;
      case "consultation_cancelled":
        url = `/patient/consultations`;
        break;
      case "new_consultation":
        url = `/doctor/consultations`;
        break;
      case "review_received":
        url = `/doctor/reviews`;
        break;
      default:
        url = data.url || "/";
    }
  }

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === url && "focus" in client) {
            return client.focus();
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      }),
  );
});

// Notification close event
self.addEventListener("notificationclose", (event) => {
  console.log("Notification closed:", event);
});

// Helper function to get actions based on notification type
function getActionsForType(type) {
  switch (type) {
    case "consultation_reminder":
      return [
        { action: "join", title: "انضم الآن", icon: "/icons/video.png" },
        { action: "view", title: "عرض التفاصيل", icon: "/icons/view.png" },
      ];
    case "consultation_confirmed":
      return [
        { action: "view", title: "عرض التفاصيل", icon: "/icons/view.png" },
      ];
    case "new_consultation":
      return [
        { action: "view", title: "عرض", icon: "/icons/view.png" },
        { action: "dismiss", title: "تجاهل", icon: "/icons/dismiss.png" },
      ];
    default:
      return [{ action: "view", title: "عرض", icon: "/icons/view.png" }];
  }
}

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  console.log("Background sync:", event.tag);

  if (event.tag === "sync-notifications") {
    event.waitUntil(syncNotifications());
  }
});

async function syncNotifications() {
  // Sync pending notification reads when back online
  const cache = await caches.open("notification-reads");
  const requests = await cache.keys();

  for (const request of requests) {
    try {
      await fetch(request);
      await cache.delete(request);
    } catch (error) {
      console.error("Failed to sync notification:", error);
    }
  }
}

// Periodic background sync (if supported)
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "check-consultations") {
    event.waitUntil(checkUpcomingConsultations());
  }
});

async function checkUpcomingConsultations() {
  // This would check for upcoming consultations and show reminders
  // Implementation depends on backend API availability
  console.log("Checking upcoming consultations...");
}
