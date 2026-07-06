<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Storage;
use App\Models\User;

class PatientMedicalFile extends Model
{
    use HasFactory;
    protected $fillable = [
        'user_id',
        'pregnancy_id',
        'file_name',
        'file_path',
        'file_type',
        'file_size',
        'category',
        'description',
        'file_date',
        'uploaded_by',
    ];

    protected $casts = [
        'file_date' => 'date',
    ];

    // Relationships
    public function patient()
    {
        return $this->belongsTo(User::class);
    }

    public function pregnancy()
    {
        return $this->belongsTo(Pregnancy::class);
    }

    public function uploader()
    {
        return $this->belongsTo(Doctor::class, 'uploaded_by');
    }

    // حذف الملف تلقائياً عند حذف السجل
    protected static function booted(): void
    {
        static::deleting(function (PatientMedicalFile $file) {
            if ($file->file_path && Storage::disk('public')->exists($file->file_path)) {
                Storage::disk('public')->delete($file->file_path);
            }
        });
    }
}
