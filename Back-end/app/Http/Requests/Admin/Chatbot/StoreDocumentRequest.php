<?php

namespace App\Http\Requests\Admin\Chatbot;

use App\Http\Requests\BaseRequest;

class StoreDocumentRequest extends BaseRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user('admin') && $this->user('admin')->hasPermission(\App\Enums\Permission::MANAGE_CHATBOT);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            'bot_type' => 'required|string|in:public,pre_marriage,pregnancy,motherhood',
            'file' => 'required|file|mimes:pdf,txt,md|max:10240', // 10MB max
        ];
    }

    public function messages(): array
    {
        return [
            'bot_type.required' => 'نوع المساعد الذكي مطلوب',
            'bot_type.in' => 'نوع المساعد الذكي غير صالح',
            'file.required' => 'الملف مطلوب',
            'file.file' => 'يجب رفع ملف صالح',
            'file.mimes' => 'يجب أن يكون الملف بصيغة PDF أو TXT أو MD',
            'file.max' => 'حجم الملف يجب ألا يتجاوز 10 ميجابايت',
        ];
    }
}
