<?php

namespace App\Http\Requests\Patient\Consultation;

use App\Http\Requests\BaseRequest;

class BookConsultationRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'doctor_id' => 'required|exists:doctors,id',
            'date' => 'required|date|after_or_equal:today',
            'time' => 'required|date_format:H:i',
            'type' => 'required|in:video,offline',
            'patient_notes' => 'nullable|string|max:1000',
            'payment_method' => 'required_if:type,video|in:paymob_card,paymob_wallet,paymob_installments,cash,card,wallet',
            'wallet_number' => 'required_if:payment_method,wallet|nullable|string|regex:/^01[0125][0-9]{8}$/',
        ];
    }

    public function messages(): array
    {
        return [
            'doctor_id.required' => 'يجب اختيار الطبيب',
            'doctor_id.exists' => 'الطبيب غير موجود',
            'date.required' => 'يجب تحديد التاريخ',
            'date.date' => 'صيغة التاريخ غير صحيحة',
            'date.after_or_equal' => 'لا يمكن الحجز في تاريخ سابق',
            'time.required' => 'يجب تحديد الوقت',
            'time.date_format' => 'صيغة الوقت غير صحيحة',
            'type.required' => 'يجب تحديد نوع الاستشارة',
            'type.in' => 'نوع الاستشارة غير صحيح',
            'patient_notes.max' => 'الملاحظات طويلة جداً',
            'payment_method.required_if' => 'يجب تحديد طريقة الدفع للاستشارة عبر الفيديو',
            'payment_method.in' => 'طريقة الدفع غير صحيحة',
            'wallet_number.required_if' => 'يجب إدخال رقم المحفظة للدفع',
            'wallet_number.regex' => 'رقم المحفظة غير صحيح (يجب أن يكون رقم موبايل مصري صالح)',
        ];
    }
}
