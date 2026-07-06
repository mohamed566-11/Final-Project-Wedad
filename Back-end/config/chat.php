<?php

return [
    'limits' => [
        'max_message_length' => 1000,
        'max_image_size_kb'  => 5120,  // 5MB
        'allowed_image_types' => ['jpg', 'jpeg', 'png', 'webp'],
        'polling_interval_ms' => 3000,
        'messages_per_page'  => 50,
    ],
    'storage' => [
        'disk'   => 'local',
        'path'   => 'chat-images',
    ],
    'notifications' => [
        'new_message_push' => true,
        'new_message_email' => false,
    ],
];
