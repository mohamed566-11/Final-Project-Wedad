<?php

namespace App\Models;

use App\Utils\TranslationHelper;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class SuccessStory extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'patient_name',
        'patient_image',
        'story',
        'short_story',
        'life_stage',
        'rating',
        'is_featured',
        'is_active',
        'order',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'rating' => 'integer',
        'is_featured' => 'boolean',
        'is_active' => 'boolean',
        'order' => 'integer',
    ];

    /**
     * Get the life stage label in Arabic.
     */
    public function getLifeStageLabelAttribute(): string
    {
        return TranslationHelper::lifeStage($this->life_stage);
    }

    /**
     * Scope for active stories.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for featured stories.
     */
    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    /**
     * Scope by life stage.
     */
    public function scopeByLifeStage($query, string $stage)
    {
        return $query->where('life_stage', $stage);
    }

    /**
     * Get short story or truncated story.
     */
    public function getShortStoryTextAttribute(): string
    {
        if ($this->short_story) {
            return $this->short_story;
        }

        return \Illuminate\Support\Str::limit($this->story, 200);
    }

    // حذف الصورة تلقائياً عند حذف السجل
    protected static function booted(): void
    {
        static::deleting(function (SuccessStory $story) {
            if ($story->patient_image && Storage::disk('public')->exists($story->patient_image)) {
                Storage::disk('public')->delete($story->patient_image);
            }
        });
    }
}
