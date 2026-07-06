<?php

namespace App\Http\Requests\Patient;

use App\Http\Requests\BaseRequest;

class SendChatMessageRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'message' => [
                'required',
                'string',
                'max:' . config('chatbot.limits.max_message_length', 1000),
            ],
            'session_id' => 'nullable|string|max:100',
            'bot_type' => 'nullable|in:public,pre_marriage,pregnancy,motherhood',
            'force_new_session' => 'nullable|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'message.required' => 'الرسالة مطلوبة',
            'message.max' => 'الرسالة طويلة جداً، الحد الأقصى ' . config('chatbot.limits.max_message_length', 1000) . ' حرف',
        ];
    }
}
