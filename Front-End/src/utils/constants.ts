// API Configuration
export const API_BASE_URL = 'http://localhost:8000/api/v1';

// User Types
export const USER_TYPES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  ADMIN: 'admin',
} as const;

export type UserType = typeof USER_TYPES[keyof typeof USER_TYPES];

// Routes Configuration
export const ROUTES = {
  // Public
  HOME: '/',
  TERMS: '/terms',
  PRIVACY: '/privacy',

  // Patient Routes
  PATIENT_LOGIN: '/patient/login',
  PATIENT_REGISTER: '/patient/register',
  PATIENT_DASHBOARD: '/patient/dashboard',
  PATIENT_PROFILE: '/patient/profile',
  PATIENT_APPOINTMENTS: '/patient/appointments',

  // Doctor Routes
  DOCTOR_LOGIN: '/doctor/login',
  DOCTOR_REGISTER: '/join-as-doctor',
  DOCTOR_DASHBOARD: '/doctor/dashboard',
  DOCTOR_PROFILE: '/doctor/profile',
  DOCTOR_PENDING_APPROVAL: '/doctor/pending',

  // Admin Routes
  ADMIN_LOGIN: '/admin/login',
  ADMIN_DASHBOARD: '/admin/dashboard',

  // Auth Routes
  VERIFY_EMAIL: '/verify-email',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  ACCOUNT_LOCKED: '/account-locked',
} as const;

// Validation Messages (Arabic)
export const VALIDATION_MESSAGES = {
  required: 'هذا الحقل مطلوب',
  email: 'البريد الإلكتروني غير صالح',
  phone: 'رقم الهاتف غير صالح. يجب أن يبدأ بـ 010 أو 011 أو 012 أو 015',
  password: {
    required: 'كلمة المرور مطلوبة',
    min: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
    max: 'كلمة المرور يجب أن لا تزيد عن 20 حرف',
    mismatch: 'كلمة المرور غير متطابقة',
  },
  name: {
    required: 'الاسم مطلوب',
    max: 'الاسم يجب أن لا يزيد عن 255 حرف',
  },
  age: {
    min: 'العمر يجب أن يكون 12 سنة على الأقل',
    max: 'العمر غير صالح',
  },
  otp: {
    required: 'كود التحقق مطلوب',
    length: 'كود التحقق يجب أن يكون 5 أرقام',
    numeric: 'كود التحقق يجب أن يحتوي على أرقام فقط',
  },
  doctor: {
    specialization: 'التخصص الطبي مطلوب',
    license: 'رقم الترخيص مطلوب',
    price: 'سعر الاستشارة مطلوب',
  },
} as const;

// Error Messages (Arabic)
export const ERROR_MESSAGES = {
  network: 'خطأ في الاتصال بالإنترنت. تحقق من اتصالك وحاول مرة أخرى.',
  server: 'حدث خطأ في الخادم. حاول مرة أخرى لاحقاً',
  unauthorized: 'بيانات الدخول غير صحيحة',
  notFound: 'المستخدم غير موجود',
  rateLimit: 'تم تجاوز عدد المحاولات المسموح بها. حاول مرة أخرى لاحقاً',
  unknown: 'حدث خطأ غير متوقع',
} as const;

// Success Messages (Arabic)
export const SUCCESS_MESSAGES = {
  login: 'تم تسجيل الدخول بنجاح',
  logout: 'تم تسجيل الخروج بنجاح',
  register: 'تم إنشاء الحساب بنجاح',
  emailVerified: 'تم تفعيل البريد الإلكتروني بنجاح',
  otpSent: 'تم إرسال الكود بنجاح',
  passwordReset: 'تم إعادة تعيين كلمة المرور بنجاح',
} as const;

// Image Upload Constraints
export const IMAGE_CONSTRAINTS = {
  maxSize: 2048 * 1024, // 2MB
  acceptedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'] as string[],
} as const;
