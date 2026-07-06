<?php

return [

    'hugging_face' => [
        'space_url'        => env('HF_LAB_OCR_SPACE_URL', 'https://amrhk-ocr-lab-tests.hf.space'),
        'upload_path'      => '/gradio_api/upload',
        'predict_path'     => '/gradio_api/call/v2/extract_from_image',
        'result_path'      => '/gradio_api/call/extract_from_image',
        'timeout'          => 120,
        'connect_timeout'  => 10,
    ],

    'storage' => [
        'disk' => 'public',
        'path' => 'lab-test-images',
    ],

    'limits' => [
        'max_image_size_kb'    => 10240,   // 10MB
        'allowed_types'        => ['jpg', 'jpeg', 'png', 'webp'],
        'max_uploads_per_hour' => 10,
        'polling_interval_ms'  => 2000,    // 2 ثانية
        'max_polling_attempts' => 30,      // 60 ثانية إجمالي
    ],

    'cache' => [
        'ttl_hours' => 24,
        'prefix'    => 'lab_ocr:',
    ],

    'queue' => [
        'name'     => 'lab-ocr',
        'attempts' => 3,
        'backoff'  => [5, 15],
    ],

];
