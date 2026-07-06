<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SettingsSite extends Model
{
    protected $table = 'settings_site';

    protected $fillable = [
        'name',
        'email',
        'favicon',
        'logo',
        'facebook_url',
        'twitter_url',
        'instagram_url',
        'youtube_url',
        'phone',
        'country',
        'city',
        'street',
        'small_description',
        'terms_content',
        'privacy_content',
    ];

    // Helper method to get single instance
    public static function getSettings()
    {
        return self::first() ?? self::create([
            'name' => 'Widad Health Platform',
            'email' => 'info@widad.health',
            'phone' => '+20 123 456 7890',
            'country' => 'Egypt',
        ]);
    }
}
