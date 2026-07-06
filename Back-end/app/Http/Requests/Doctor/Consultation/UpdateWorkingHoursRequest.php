<?php

namespace App\Http\Requests\Doctor\Consultation;

use App\Http\Requests\BaseRequest;

class UpdateWorkingHoursRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'working_hours' => 'required|array',
            'working_hours.*.day' => 'required|in:monday,tuesday,wednesday,thursday,friday,saturday,sunday',
            'working_hours.*.start_time' => 'required|date_format:H:i',
        ];
    }

    public function messages(): array
    {
        return [
            'working_hours.required' => 'يجب تحديد ساعات العمل',
            'working_hours.array' => 'صيغة ساعات العمل غير صحيحة',
            'working_hours.*.day.required' => 'يجب تحديد اليوم',
            'working_hours.*.day.in' => 'اليوم غير صحيح',
            'working_hours.*.start_time.required' => 'يجب تحديد وقت البدء',
            'working_hours.*.start_time.date_format' => 'صيغة الوقت يجب أن تكون HH:MM',
        ];
    }
}
