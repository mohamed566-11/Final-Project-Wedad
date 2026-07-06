<?php

use Ichtrojan\Otp\Otp;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

it('can generate an OTP', function () {
    $otp = new Otp();
    
    $generated = $otp->generate('test@example.com', 'numeric', 5, 15);
    
    expect($generated)->toBeObject();
    expect($generated->status)->toBeTrue();
    expect($generated->token)->toHaveLength(5);
    expect($generated->message)->toBe('OTP generated');
});

it('can validate a correct OTP', function () {
    $otp = new Otp();
    
    $generated = $otp->generate('valid@example.com', 'numeric', 5, 15);
    $validation = $otp->validate('valid@example.com', $generated->token);
    
    expect($validation->status)->toBeTrue();
    expect($validation->message)->toBe('OTP is valid');
});

it('rejects an invalid OTP', function () {
    $otp = new Otp();
    
    $otp->generate('invalid@example.com', 'numeric', 5, 15);
    $validation = $otp->validate('invalid@example.com', '00000'); // Assuming it's random and this will fail practically always
    
    expect($validation->status)->toBeFalse();
});

it('rejects an OTP for a different email', function () {
    $otp = new Otp();
    
    $generated = $otp->generate('test1@example.com', 'numeric', 5, 15);
    $validation = $otp->validate('test2@example.com', $generated->token);
    
    expect($validation->status)->toBeFalse();
});
