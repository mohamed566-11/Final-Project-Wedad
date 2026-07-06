import api from "./api";

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  consultation_reminders: boolean;
  marketing_emails: boolean;
  // Extended preferences
  new_booking_alerts: boolean;
  article_status_updates: boolean;
  payment_notifications: boolean;
}

/**
 * Get the API prefix based on current user type.
 * Routes are at /patient/notifications/... or /doctor/notifications/... or /admin/notifications/...
 */
function getApiPrefix(): string {
  const userType = localStorage.getItem("userType");
  if (userType === "doctor") return "/doctor";
  if (userType === "admin") return "/admin";
  return "/patient"; // default for patients
}

class NotificationService {
  private vapidPublicKey: string | null = null;
  private swRegistration: ServiceWorkerRegistration | null = null;

  /**
   * Initialize push notifications
   */
  async init(): Promise<boolean> {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("Push notifications not supported");
      return false;
    }

    try {
      // Register service worker
      this.swRegistration = await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker registered");

      // Get VAPID public key from backend
      const prefix = getApiPrefix();
      const response = await api.get(`${prefix}/notifications/vapid-key`);
      if (response.data.status) {
        this.vapidPublicKey = response.data.data.vapid_key;
      }

      return true;
    } catch (error) {
      console.error("Failed to initialize push notifications:", error);
      return false;
    }
  }

  /**
   * Request permission and subscribe to push notifications
   */
  async subscribe(): Promise<boolean> {
    if (!this.swRegistration || !this.vapidPublicKey) {
      await this.init();
    }

    if (!this.swRegistration || !this.vapidPublicKey) {
      return false;
    }

    try {
      // Check/request permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.warn("Notification permission denied");
        return false;
      }

      // Check existing subscription
      let subscription =
        await this.swRegistration.pushManager.getSubscription();

      if (!subscription) {
        // Create new subscription
        subscription = await this.swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(
            this.vapidPublicKey,
          ) as BufferSource,
        });
      }

      // Send subscription to backend
      const prefix = getApiPrefix();
      const response = await api.post(`${prefix}/notifications/subscribe`, {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey("p256dh")),
          auth: this.arrayBufferToBase64(subscription.getKey("auth")),
        },
      });

      return response.data.status;
    } catch (error) {
      console.error("Failed to subscribe to push notifications:", error);
      return false;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.swRegistration) {
      return false;
    }

    try {
      const subscription =
        await this.swRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();

        // Notify backend
        const prefix = getApiPrefix();
        await api.post(`${prefix}/notifications/unsubscribe`, {
          endpoint: subscription.endpoint,
        });
      }
      return true;
    } catch (error) {
      console.error("Failed to unsubscribe:", error);
      return false;
    }
  }

  /**
   * Check if push notifications are supported and enabled
   */
  async isEnabled(): Promise<boolean> {
    if (!("Notification" in window)) {
      return false;
    }
    return Notification.permission === "granted";
  }

  /**
   * Get all notifications
   */
  async getNotifications(params?: {
    page?: number;
    per_page?: number;
    unread_only?: boolean;
  }): Promise<{
    notifications: Notification[];
    total: number;
    unread_count: number;
  }> {
    try {
      const prefix = getApiPrefix();
      const response = await api.get(`${prefix}/notifications`, { params });
      if (response.data.status) {
        return {
          notifications: response.data.data.notifications || [],
          total: response.data.data.total || 0,
          unread_count: response.data.data.unread_count || 0,
        };
      }
      return { notifications: [], total: 0, unread_count: 0 };
    } catch (error) {
      console.error("Failed to get notifications:", error);
      return { notifications: [], total: 0, unread_count: 0 };
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const prefix = getApiPrefix();
      const response = await api.post(
        `${prefix}/notifications/${notificationId}/read`,
      );
      return response.data.status;
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      return false;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<boolean> {
    try {
      const prefix = getApiPrefix();
      const response = await api.post(`${prefix}/notifications/read-all`);
      return response.data.status;
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      return false;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const prefix = getApiPrefix();
      const response = await api.delete(
        `${prefix}/notifications/${notificationId}`,
      );
      return response.data.status;
    } catch (error) {
      console.error("Failed to delete notification:", error);
      return false;
    }
  }

  /**
   * Get notification settings
   */
  async getSettings(): Promise<NotificationSettings | null> {
    try {
      const prefix = getApiPrefix();
      const response = await api.get(`${prefix}/notifications/settings`);
      if (response.data.status) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error("Failed to get notification settings:", error);
      return null;
    }
  }

  /**
   * Update notification settings
   */
  async updateSettings(
    settings: Partial<NotificationSettings>,
  ): Promise<boolean> {
    try {
      const prefix = getApiPrefix();
      const response = await api.put(
        `${prefix}/notifications/settings`,
        settings,
      );
      return response.data.status;
    } catch (error) {
      console.error("Failed to update notification settings:", error);
      return false;
    }
  }

  /**
   * Show local notification (for in-app use)
   */
  showLocalNotification(title: string, options?: NotificationOptions): void {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    new Notification(title, {
      icon: "/icons/icon-192x192.png",
      badge: "/icons/badge-72x72.png",
      ...options,
    });
  }

  // Helper: Convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Helper: ArrayBuffer to Base64
  private arrayBufferToBase64(buffer: ArrayBuffer | null): string {
    if (!buffer) return "";
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

export const notificationService = new NotificationService();
export default notificationService;
