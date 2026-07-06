<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Storage;

class LabTestResult extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'user_id',
        'image_path',
        'image_hash',
        'status',
        'results_json',
        'tests_count',
        'error_message',
        'processed_at',
    ];

    protected $casts = [
        'results_json' => 'array',
        'processed_at' => 'datetime',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    // ─── Accessors ────────────────────────────────────────────────────────────

    public function getImageUrlAttribute(): string
    {
        return Storage::disk('public')->url($this->image_path);
    }

    // ─── Helper Methods ───────────────────────────────────────────────────────

    public function markAsProcessing(): void
    {
        $this->update(['status' => 'processing']);
    }

    public function markAsCompleted(array $results): void
    {
        $this->update([
            'status'       => 'completed',
            'results_json' => $results,
            'tests_count'  => count($results['tests'] ?? []),
            'processed_at' => now(),
        ]);
    }

    public function markAsFailed(string $error): void
    {
        $this->update([
            'status'        => 'failed',
            'error_message' => $error,
        ]);
    }

    // ─── Boot — auto-delete image when record is deleted ──────────────────────

    protected static function booted(): void
    {
        static::deleting(function (LabTestResult $model) {
            if ($model->image_path && Storage::disk('public')->exists($model->image_path)) {
                Storage::disk('public')->delete($model->image_path);
            }
        });
    }
}
