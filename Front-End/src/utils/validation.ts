import * as yup from 'yup';
import { VALIDATION_MESSAGES } from './constants';

// Egyptian phone number validation
const egyptianPhoneRegex = /^01[0125][0-9]{8}$/;

export const patientRegisterSchema = yup.object().shape({
  name: yup.string()
    .required(VALIDATION_MESSAGES.name.required)
    .max(255, VALIDATION_MESSAGES.name.max),

  email: yup.string()
    .required('البريد الإلكتروني مطلوب')
    .email(VALIDATION_MESSAGES.email),

  password: yup.string()
    .required(VALIDATION_MESSAGES.password.required)
    .min(8, VALIDATION_MESSAGES.password.min),

  password_confirmation: yup.string()
    .required('تأكيد كلمة المرور مطلوب')
    .oneOf([yup.ref('password')], VALIDATION_MESSAGES.password.mismatch),

  phone: yup.string()
    .required('رقم الهاتف مطلوب')
    .matches(egyptianPhoneRegex, VALIDATION_MESSAGES.phone),

  age: yup.number()
    .nullable()
    .transform((value, originalValue) => (originalValue === '' ? null : value))
    .min(12, VALIDATION_MESSAGES.age.min)
    .max(100, VALIDATION_MESSAGES.age.max),
});

export const doctorRegisterSchema = yup.object().shape({
  name: yup.string()
    .required(VALIDATION_MESSAGES.name.required)
    .max(255, VALIDATION_MESSAGES.name.max),

  email: yup.string()
    .required('البريد الإلكتروني مطلوب')
    .email(VALIDATION_MESSAGES.email),

  password: yup.string()
    .required(VALIDATION_MESSAGES.password.required)
    .min(8, VALIDATION_MESSAGES.password.min),

  password_confirmation: yup.string()
    .required('تأكيد كلمة المرور مطلوب')
    .oneOf([yup.ref('password')], VALIDATION_MESSAGES.password.mismatch),

  phone: yup.string()
    .required('رقم الهاتف مطلوب')
    .matches(egyptianPhoneRegex, VALIDATION_MESSAGES.phone),

  specialization: yup.string()
    .required(VALIDATION_MESSAGES.doctor.specialization),

  license_number: yup.string()
    .required(VALIDATION_MESSAGES.doctor.license),

  consultation_price: yup.number()
    .required(VALIDATION_MESSAGES.doctor.price)
    .positive('السعر يجب أن يكون أكبر من صفر')
    .typeError(VALIDATION_MESSAGES.doctor.price),
});

export const loginSchema = yup.object().shape({
  email: yup.string()
    .required('البريد الإلكتروني مطلوب')
    .email(VALIDATION_MESSAGES.email),

  password: yup.string()
    .required(VALIDATION_MESSAGES.password.required)
    .min(8, VALIDATION_MESSAGES.password.min),
});

export const forgotPasswordSchema = yup.object().shape({
  email: yup.string()
    .required('البريد الإلكتروني مطلوب')
    .email(VALIDATION_MESSAGES.email),
});

export const resetPasswordSchema = yup.object().shape({
  code: yup.string()
    .optional(),  // OTP is handled separately via useState

  password: yup.string()
    .required(VALIDATION_MESSAGES.password.required)
    .min(8, VALIDATION_MESSAGES.password.min)
    .max(20, VALIDATION_MESSAGES.password.max),

  password_confirmation: yup.string()
    .required('تأكيد كلمة المرور مطلوب')
    .oneOf([yup.ref('password')], VALIDATION_MESSAGES.password.mismatch),
});

export const otpSchema = yup.object().shape({
  code: yup.string()
    .required(VALIDATION_MESSAGES.otp.required)
    .length(5, VALIDATION_MESSAGES.otp.length)
    .matches(/^[0-9]+$/, VALIDATION_MESSAGES.otp.numeric),
});

// Type exports
export type PatientRegisterFormData = yup.InferType<typeof patientRegisterSchema>;
export type DoctorRegisterFormData = yup.InferType<typeof doctorRegisterSchema>;
export type LoginFormData = yup.InferType<typeof loginSchema>;
export type ForgotPasswordFormData = yup.InferType<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = yup.InferType<typeof resetPasswordSchema>;
export type OTPFormData = yup.InferType<typeof otpSchema>;
