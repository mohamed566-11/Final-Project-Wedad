import axios from "axios";
import { API_BASE_URL } from "@/utils/constants";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
  },
  timeout: 180000, // 180s — HF Spaces can take 30-120s on cold start
});

// Request interceptor - Add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const token = localStorage.getItem("token");
    const userType = localStorage.getItem("userType");

    if (status === 401 && token) {
      // طلبات الشات بوت تُعالج أخطاءها محلياً — تجنب redirect أو مسح التوكن
      const requestUrl = error.config?.url || "";
      if (requestUrl.includes("/chatbot/")) {
        return Promise.reject(error);
      }

      // صفحات الشات بوت العامة — نرفض الخطأ فقط دون مسح التوكن
      // (مسح التوكن هنا كان يسبب فشل كل طلبات البوت اللاحقة)
      const publicPages = ["/patient/chatbot", "/chatbot"];
      if (publicPages.includes(window.location.pathname)) {
        return Promise.reject(error);
      }

      // Session expired - clear token and redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("userType");
      if (userType === "admin") {
        window.location.href = "/admin/login";
      } else if (userType === "doctor") {
        window.location.href = "/doctor/login";
      } else {
        window.location.href = "/patient/login";
      }
    }

    if (status === 403 && token && userType === "doctor") {
      // Doctor verification check — DoctorVerified middleware returns 403
      const message = error.response?.data?.message || "";
      if (
        message.includes("التحقق") ||
        message.includes("verified") ||
        message.includes("مراجعة") ||
        message.includes("مرفوض")
      ) {
        window.location.href = "/doctor/pending";
        return new Promise(() => { }); // Prevent further error handling
      }
    }

    return Promise.reject(error);
  },
);

export default api;
