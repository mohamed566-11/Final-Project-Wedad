<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Traits\OptimizedQueries;

class Article extends Model
{
    use SoftDeletes, OptimizedQueries, HasFactory;

    protected $fillable = [
        'doctor_id',
        'title',
        'slug',
        'excerpt',
        'content',
        'image',
        'status',
        'life_stage_id',
        'admin_notes',
        'views_count',
        'reading_time',
        'tags',
        'published_at',
        'reviewed_by',
        'reviewed_at',
    ];

    protected $casts = [
        'tags' => 'array',
        'published_at' => 'datetime',
        'reviewed_at' => 'datetime',
    ];

    // Relationships
    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }

    public function lifeStage()
    {
        return $this->belongsTo(LifeStage::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(Admin::class, 'reviewed_by');
    }

    // Auto-generate slug
    protected static function booted()
    {
        static::creating(function ($article) {
            if (empty($article->slug)) {
                $article->slug = Str::slug($article->title);
            }
        });
    }

    // Increment views
    public function incrementViews()
    {
        $this->increment('views_count');
    }
}
