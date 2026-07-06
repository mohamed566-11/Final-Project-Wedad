<?php

use App\Services\WebPushService;
use Tests\TestCase;

uses(TestCase::class);

it('creates reminder payload correctly', function () {
    $payload = WebPushService::createReminderPayload(
        'Reminder Title',
        'Reminder Body',
        42,
        '15_minutes'
    );

    expect($payload)->toHaveKeys(['title', 'body', 'icon', 'badge', 'tag', 'data']);
    expect($payload['title'])->toBe('Reminder Title');
    expect($payload['tag'])->toBe('consultation-42');
    expect($payload['data']['type'])->toBe('consultation_reminder');
    expect($payload['data']['consultation_id'])->toBe(42);
    expect($payload['data']['requireInteraction'])->toBeTrue();
    expect($payload['data']['url'])->toBe('/patient/consultations/42');
});

it('creates new consultation payload correctly', function () {
    $payload = WebPushService::createNewConsultationPayload(
        55,
        '2024-05-10',
        '14:00'
    );

    expect($payload)->toHaveKeys(['title', 'body', 'icon', 'tag', 'vibrate', 'data']);
    expect($payload['title'])->toBe('طلب استشارة جديد!');
    expect($payload['body'])->toContain('2024-05-10');
    expect($payload['body'])->toContain('14:00');
    expect($payload['tag'])->toBe('new-consultation-55');
    expect($payload['data']['type'])->toBe('new_consultation');
    expect($payload['data']['url'])->toBe('/doctor/consultations');
    expect($payload['data']['requireInteraction'])->toBeTrue();
});

it('creates chat message payload correctly for patient', function () {
    $payload = WebPushService::createChatMessagePayload(
        'Dr. Smith',
        'Hello there',
        100,
        'patient'
    );

    expect($payload['title'])->toBe('رسالة جديدة من Dr. Smith');
    expect($payload['body'])->toBe('Hello there');
    expect($payload['tag'])->toBe('chat-100');
    expect($payload['data']['type'])->toBe('new_chat_message');
    expect($payload['data']['url'])->toBe('/patient/consultations/100');
});

it('creates chat message payload correctly for doctor', function () {
    $payload = WebPushService::createChatMessagePayload(
        'John Doe',
        'I have a question',
        101,
        'doctor'
    );

    expect($payload['title'])->toBe('رسالة جديدة من John Doe');
    expect($payload['data']['url'])->toBe('/doctor/consultations/101');
});
