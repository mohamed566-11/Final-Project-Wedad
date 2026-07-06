<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Google OAuth & Meet
    |--------------------------------------------------------------------------
    */
    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect_uri' => env('GOOGLE_REDIRECT_URI', '/api/doctor/google/callback'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Google Fit (IoT)
    |--------------------------------------------------------------------------
    */
    'google_fit' => [
        'client_id' => env('GOOGLE_CLIENT_IOT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_IOT_SECRET'),
        'redirect_uri' => env('GOOGLE_FIT_REDIRECT_URI', 'http://localhost:8080/trackers/smart-band'),
    ],


    /*
    |--------------------------------------------------------------------------
    | Paymob Payment Gateway
    |--------------------------------------------------------------------------
    */
    'paymob' => [
        'api_key' => env('PAYMOB_API_KEY'),
        'integration_id' => env('PAYMOB_INTEGRATION_ID'),
        'iframe_id' => env('PAYMOB_IFRAME_ID'),
        'hmac_secret' => env('PAYMOB_HMAC_SECRET'),
        'commission_rate' => env('PAYMOB_COMMISSION_RATE', 0.15), // 15% default
        'wallet_integration_id' => env('PAYMOB_WALLET_INTEGRATION_ID'),
    ],

];
