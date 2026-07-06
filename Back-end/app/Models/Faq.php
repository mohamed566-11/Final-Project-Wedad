<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Faq extends Model
{
    // protected $table = 'faqs';
    protected $fillable = [
        'question',
        'answer',
        'life_stage_id',
        'order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // Relationships
    public function lifeStage()
    {
        return $this->belongsTo(LifeStage::class);
    }
}
