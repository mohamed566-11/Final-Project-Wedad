import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { authService, LoginCredentials } from "@/services/authService";
import { UserType, SUCCESS_MESSAGES } from "@/utils/constants";

interface UserRole {
  id: number;
  role: string;
  description?: string;
  permissions: string[];
}

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  image_url?: string;
  is_verified: boolean;
  profile?: Record<string, unknown>;
  is_super_admin?: boolean;
  role?: UserRole;
  verification_status?: string;
}

interface AuthResponse {
  needsVerification: boolean;
  user: User;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  userType: UserType | null;
  loading: boolean;
  isAuthenticated: boolean;
  isVerified: boolean;
  isSuperAdmin: boolean;
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (...permissions: string[]) => boolean;
  login: (
    credentials: LoginCredentials,
    type: UserType,
  ) => Promise<AuthResponse>;
  register: (formData: FormData, type: UserType) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  verifyEmail: (code: string) => Promise<boolean>;
  resendOTP: () => Promise<void>;
  fetchUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token"),
  );
  const [userType, setUserType] = useState<UserType | null>(
    localStorage.getItem("userType") as UserType | null,
  );
  const [loading, setLoading] = useState(true);

  // Fetch user data on mount if token exists
  useEffect(() => {
    if (token && userType) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserData = async () => {
    try {
      if (!userType || !token) {
        setLoading(false);
        return;
      }
      const response = await authService[userType].getData();
      const responseData = (response as { data: ApiResponse<User> }).data;
      setUser(responseData.data);
    } catch (error: any) {
      console.error("Error fetching user data:", error);
      // Only clear the session on explicit 401 — not on network errors or timeouts
      // This prevents the chatbot from losing auth on transient failures
      const status = error?.response?.status;
      if (status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("userType");
        setToken(null);
        setUserType(null);
        setUser(null);
      }
      // For any other error (network, 5xx, timeout), keep the session alive
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (
    credentials: LoginCredentials,
    type: UserType,
  ): Promise<AuthResponse> => {
    try {
      const response = await authService[type].login(credentials);
      const responseData = (response as { data: ApiResponse<any> }).data;

      // Extract token and user data - based on backend response structure
      const {
        token: newToken,
        user,
        patient,
        doctor,
        admin,
      } = responseData.data || {};
      const userData = user || patient || doctor || admin;

      if (!userData || !newToken) {
        console.error("Invalid response structure:", responseData);
        throw new Error("Invalid response structure from server");
      }

      // Save to localStorage
      localStorage.setItem("token", newToken);
      localStorage.setItem("userType", type);

      // Update state
      setToken(newToken);
      setUserType(type);
      setUser(userData);

      // Check email verification
      // Note: Doctor verification status is handled differently via 'pending' page in UI logic
      // Admin bypasses verification
      if (type !== "admin" && !userData.is_verified) {
        // Send OTP automatically for patient
        try {
          if (type === "patient") {
            await authService.patient.resendOTP();
          }
          // Doctors don't need auto-OTP on login if they are not verified yet (usually pending admin approval)
        } catch (e) {
          // Ignore resend errors
        }
        return { needsVerification: true, user: userData };
      }

      toast.success(SUCCESS_MESSAGES.login);
      return { needsVerification: false, user: userData };
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const handleRegister = async (
    formData: FormData,
    type: UserType,
  ): Promise<AuthResponse> => {
    if (type === "admin") {
      throw new Error("Admin registration is not allowed");
    }

    try {
      const response = await authService[type].register(formData);
      const responseData = (response as { data: ApiResponse<any> }).data;

      // Extract token and user data
      const {
        token: newToken,
        user,
        patient,
        doctor,
      } = responseData.data || {};
      const userData = user || patient || doctor;

      if (!userData || !newToken) {
        console.error("Invalid response structure:", responseData);
        throw new Error("Invalid response structure from server");
      }

      localStorage.setItem("token", newToken);
      localStorage.setItem("userType", type);

      setToken(newToken);
      setUserType(type);
      setUser(userData);

      toast.success(SUCCESS_MESSAGES.register);

      // OTP is sent automatically on registration
      return { user: userData, needsVerification: true };
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      if (userType && token) {
        await authService[userType].logout();
      }
    } catch (error) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("userType");
      setToken(null);
      setUserType(null);
      setUser(null);
      // مسح cache الشات بوت لمنع ظهور بيانات المستخدم السابق عند تسجيل حساب جديد
      queryClient.removeQueries({ queryKey: ["chatbot"] });
      toast.success(SUCCESS_MESSAGES.logout);
    }
  };

  const verifyEmail = async (code: string): Promise<boolean> => {
    if (!userType) return false;

    if (userType === "patient") {
      await authService.patient.verifyEmail(code);
    } else if (userType === "doctor") {
      await authService.doctor.verifyEmail(code);
    } else {
      return false;
    }

    setUser((prev) => (prev ? { ...prev, is_verified: true } : null));
    toast.success(SUCCESS_MESSAGES.emailVerified);
    return true;
  };

  const resendOTP = async () => {
    if (!userType) return;

    if (userType === "patient") {
      await authService.patient.resendOTP();
    } else if (userType === "doctor") {
      await authService.doctor.resendOTP();
    } else {
      return;
    }

    toast.success(SUCCESS_MESSAGES.otpSent);
  };

  // Permission helpers for admin users
  const isSuperAdmin = user?.is_super_admin ?? false;
  const permissions = user?.role?.permissions ?? [];

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (userType !== "admin") return false;
      if (user?.is_super_admin) return true;
      return (user?.role?.permissions ?? []).includes(permission);
    },
    [userType, user],
  );

  const hasAnyPermission = useCallback(
    (...perms: string[]): boolean => {
      if (userType !== "admin") return false;
      if (user?.is_super_admin) return true;
      const permsSet = user?.role?.permissions ?? [];
      return perms.some((p) => permsSet.includes(p));
    },
    [userType, user],
  );

  const value: AuthContextType = {
    user,
    token,
    userType,
    loading,
    isAuthenticated: !!token,
    isVerified: user?.is_verified ?? false,
    isSuperAdmin,
    permissions,
    hasPermission,
    hasAnyPermission,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    verifyEmail,
    resendOTP,
    fetchUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
