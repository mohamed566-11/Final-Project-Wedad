import api from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone: string;
  age?: number;
}

export interface DoctorRegisterData extends RegisterData {
  specialization: string;
  license_number: string;
  consultation_price: number;
}

export interface ResetPasswordData {
  email: string;
  code: string;
  password: string;
  password_confirmation: string;
}

// Patient service type
interface PatientService {
  register: (formData: FormData) => ReturnType<typeof api.post>;
  login: (credentials: LoginCredentials) => ReturnType<typeof api.post>;
  logout: () => ReturnType<typeof api.post>;
  logoutAll: () => ReturnType<typeof api.post>;
  getData: () => ReturnType<typeof api.get>;
  verifyEmail: (code: string) => ReturnType<typeof api.post>;
  resendOTP: () => ReturnType<typeof api.get>;
  forgotPassword: (email: string) => ReturnType<typeof api.post>;
  resetPassword: (data: ResetPasswordData) => ReturnType<typeof api.post>;
}

// Doctor service type
interface DoctorService {
  register: (formData: FormData) => ReturnType<typeof api.post>;
  login: (credentials: LoginCredentials) => ReturnType<typeof api.post>;
  logout: () => ReturnType<typeof api.post>;
  getData: () => ReturnType<typeof api.get>;
  verifyEmail: (code: string) => ReturnType<typeof api.post>;
  resendOTP: () => ReturnType<typeof api.get>;
  forgotPassword: (email: string) => ReturnType<typeof api.post>;
  resetPassword: (data: ResetPasswordData) => ReturnType<typeof api.post>;
}

// Admin service type
interface AdminService {
  login: (credentials: LoginCredentials) => ReturnType<typeof api.post>;
  logout: () => ReturnType<typeof api.post>;
  getData: () => ReturnType<typeof api.get>;
  forgotPassword: (email: string) => ReturnType<typeof api.post>;
  resetPassword: (data: ResetPasswordData) => ReturnType<typeof api.post>;
}

interface AuthServiceType {
  patient: PatientService;
  doctor: DoctorService;
  admin: AdminService;
}

export const authService: AuthServiceType = {
  // Patient APIs
  patient: {
    register: (formData: FormData) =>
      api.post('/patient/auth/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }),
    login: (credentials: LoginCredentials) =>
      api.post('/patient/auth/login', credentials),
    logout: () =>
      api.post('/patient/auth/logout'),
    logoutAll: () =>
      api.post('/patient/auth/logout/all'),
    getData: () =>
      api.get('/patient/data'),
    verifyEmail: (code: string) =>
      api.post('/patient/auth/email/verify', { code }),
    resendOTP: () =>
      api.get('/patient/auth/email/send-again'),
    forgotPassword: (email: string) =>
      api.post('/patient/password/email', { email }),
    resetPassword: (data: ResetPasswordData) =>
      api.post('/patient/password/reset', data),
  },

  // Doctor APIs
  doctor: {
    register: (formData: FormData) =>
      api.post('/doctor/auth/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }),
    login: (credentials: LoginCredentials) =>
      api.post('/doctor/auth/login', credentials),
    logout: (token?: string) =>
      api.post('/doctor/auth/logout', {}, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      }),
    getData: () =>
      api.get('/doctor/data'),
    verifyEmail: (code: string) =>
      api.post('/doctor/auth/email/verify', { code }),
    resendOTP: () =>
      api.get('/doctor/auth/email/send-again'),
    forgotPassword: (email: string) =>
      api.post('/doctor/password/email', { email }),
    resetPassword: (data: ResetPasswordData) =>
      api.post('/doctor/password/reset', data),
  },

  // Admin APIs
  admin: {
    login: (credentials: LoginCredentials) =>
      api.post('/admin/auth/login', credentials),
    logout: () =>
      api.post('/admin/auth/logout'),
    getData: () =>
      api.get('/admin/data'),
    forgotPassword: (email: string) =>
      api.post('/admin/password/email', { email }),
    resetPassword: (data: ResetPasswordData) =>
      api.post('/admin/password/reset', data),
  },
};

export default authService;
