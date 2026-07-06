<?php

return [
    /*
    |--------------------------------------------------------------------------
    | VAPID Keys
    |--------------------------------------------------------------------------
    |
    | VAPID keys are used to identify your server to push services.
    | You can generate new keys using: php artisan webpush:generate-keys
    | Or use online tools: https://web-push-codelab.glitch.me/
    |
    */
    
    'vapid' => [
        'subject' => env('VAPID_SUBJECT', env('APP_URL')),
        'public_key' => env('VAPID_PUBLIC_KEY'),
        'private_key' => env('VAPID_PRIVATE_KEY'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Default TTL
    |--------------------------------------------------------------------------
    |
    | Time-to-live in seconds for push notifications.
    | How long a push message is retained by the push service (e.g. 1 hour = 3600).
    |
    */
    
    'ttl' => env('WEBPUSH_TTL', 3600),

    /*
    |--------------------------------------------------------------------------
    | Default Urgency
    |--------------------------------------------------------------------------
    |
    | Push message urgency: very-low, low, normal, or high.
    | High urgency messages are delivered even in low power modes.
    |
    */
    
    'urgency' => env('WEBPUSH_URGENCY', 'high'),

    /*
    |--------------------------------------------------------------------------
    | GCM API Key (Legacy)
    |--------------------------------------------------------------------------
    |
    | Google Cloud Messaging API key for legacy support.
    | Not required for modern web push implementations using VAPID.
    |
    */
    
    'gcm_api_key' => env('GCM_API_KEY'),
];
