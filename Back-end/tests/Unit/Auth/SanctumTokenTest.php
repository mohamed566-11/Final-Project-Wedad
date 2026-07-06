<?php

use App\Models\User;
use App\Models\Doctor;
use App\Models\Admin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

it('issues patient token with correct abilities', function () {
    $user = User::factory()->create();
    $token = $user->createToken('patient-device', ['patient'])->plainTextToken;
    
    expect($token)->toBeString()->not->toBeEmpty();
    
    $tokenInstance = $user->tokens()->first();
    expect($tokenInstance->name)->toBe('patient-device');
    expect($tokenInstance->can('patient'))->toBeTrue();
    expect($tokenInstance->can('doctor'))->toBeFalse();
});

it('issues doctor token with correct abilities', function () {
    $doctor = Doctor::factory()->create();
    $token = $doctor->createToken('doctor-device', ['doctor'])->plainTextToken;
    
    expect($token)->toBeString();
    
    $tokenInstance = $doctor->tokens()->first();
    expect($tokenInstance->name)->toBe('doctor-device');
    expect($tokenInstance->can('doctor'))->toBeTrue();
    expect($tokenInstance->can('admin'))->toBeFalse();
});

it('issues admin token with admin abilities', function () {
    $admin = Admin::factory()->create();
    $token = $admin->createToken('admin-device', ['admin'])->plainTextToken;
    
    expect($token)->toBeString();
    
    $tokenInstance = $admin->tokens()->first();
    expect($tokenInstance->name)->toBe('admin-device');
    expect($tokenInstance->can('admin'))->toBeTrue();
    expect($tokenInstance->can('patient'))->toBeFalse();
});
