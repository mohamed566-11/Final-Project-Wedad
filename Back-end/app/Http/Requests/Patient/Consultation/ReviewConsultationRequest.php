<?php

namespace App\Http\Requests\Patient\Consultation;

use App\Http\Requests\BaseRequest;

class ReviewConsultationRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:500',
            'is_anonymous' => 'nullable|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'rating.required' => 'يجب إضافة التقييم',
            'rating.integer' => 'التقييم يجب أن يكون رقماً صحيحاً',
            'rating.min' => 'التقييم يجب أن يكون بين 1 و 5',
            'rating.max' => 'التقييم يجب أن يكون بين 1 و 5',
            'comment.max' => 'التعليق طويل جداً',
        ];
    }
}
