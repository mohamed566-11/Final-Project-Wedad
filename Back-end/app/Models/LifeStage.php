<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LifeStage extends Model
{
    use HasFactory;
    protected $fillable = [
        'name',
        'slug',
        'description',
        'icon',
    ];

    // Relationships
    public function patients()
    {
        return $this->hasMany(User::class);
    }

    public function doctors()
    {
        return $this->belongsToMany(Doctor::class, 'doctor_life_stages');
    }

    public function articles()
    {
        return $this->hasMany(Article::class);
    }

    public function faqs()
    {
        return $this->hasMany(Faq::class);
    }
}
