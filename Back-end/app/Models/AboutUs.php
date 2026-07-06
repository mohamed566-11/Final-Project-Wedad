<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AboutUs extends Model
{
    protected $table = 'about_us';

    protected $fillable = [
        'title',
        'description',
        'image',
        'mission_title',
        'mission_desc',
        'vision_title',
        'vision_desc',
    ];
}
