<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class ConsultationAttachment extends Model
{
    protected $fillable = [
        'consultation_id',
        'user_id',
        'file_name',
        'file_path',
        'original_name',
        'file_type',
        'file_size',
        'category',
        'description',
        'uploaded_by',
    ];

    protected $appends = ['full_url'];

    public function consultation()
    {
        return $this->belongsTo(Consultation::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function getFullUrlAttribute(): ?string
    {
        if (!$this->file_path) return null;
        return Storage::disk('public')->url($this->file_path);
    }

    public function isImage(): bool
    {
        return in_array(strtolower($this->file_type), ['jpg', 'jpeg', 'png', 'webp']);
    }

    public function getCategoryLabelAttribute(): string
    {
        return match ($this->category) {
            'lab_result' => 'نتيجة تحليل',
            'ultrasound' => 'صورة سونار',
            'x_ray' => 'أشعة سينية',
            'prescription' => 'وصفة طبية',
            'medical_report' => 'تقرير طبي',
            default => 'أخرى',
        };
    }

    public function getFileSizeFormattedAttribute(): string
    {
        $bytes = $this->file_size;
        if ($bytes >= 1048576)
            return round($bytes / 1048576, 1) . ' MB';
        if ($bytes >= 1024)
            return round($bytes / 1024, 1) . ' KB';
        return $bytes . ' B';
    }

    // حذف الملف تلقائياً عند حذف السجل
    protected static function booted(): void
    {
        static::deleting(function (ConsultationAttachment $attachment) {
            if ($attachment->file_path && Storage::disk('public')->exists($attachment->file_path)) {
                Storage::disk('public')->delete($attachment->file_path);
            }
        });
    }
}
