<?php

namespace App\Http\Requests\Patient\Consultation;

use App\Http\Requests\BaseRequest;

class SearchDoctorsRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'search' => 'nullable|string|max:255',
            'specialization' => 'nullable|in:gynecology,obstetrics,fertility,endocrinology,general_practitioner,pediatrics,nutrition,other',
            'life_stage_id' => 'nullable|exists:life_stages,id',
            'min_price' => 'nullable|numeric|min:0',
            'max_price' => 'nullable|numeric|min:0|gte:min_price',
            'min_rating' => 'nullable|numeric|min:1|max:5',
            'languages' => 'nullable|array',
            'languages.*' => 'in:ar,en',
            'session_type' => 'nullable|in:video,offline,both',
            'availability' => 'nullable|in:today,this_week,this_month',
            'sort_by' => 'nullable|in:rating,price_low,price_high,experience,consultations',
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:50',
        ];
    }

    public function messages(): array
    {
        return [
            'specialization.in' => 'التخصص غير صحيح',
            'life_stage_id.exists' => 'المرحلة الحياتية غير موجودة',
            'min_price.numeric' => 'الحد الأدنى للسعر يجب أن يكون رقماً',
            'max_price.numeric' => 'الحد الأقصى للسعر يجب أن يكون رقماً',
            'max_price.gte' => 'الحد الأقصى للسعر يجب أن يكون أكبر من الحد الأدنى',
            'min_rating.min' => 'التقييم يجب أن يكون بين 1 و 5',
            'min_rating.max' => 'التقييم يجب أن يكون بين 1 و 5',
            'languages.*.in' => 'اللغة غير صحيحة',
            'session_type.in' => 'نوع الجلسة غير صحيح',
            'availability.in' => 'فترة التوفر غير صحيحة',
            'sort_by.in' => 'طريقة الترتيب غير صحيحة',
        ];
    }
}
