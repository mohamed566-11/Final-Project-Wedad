<?php

use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Support\Facades\Mail;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    Mail::fake();
    config(['otp.expires_in' => 10]);
});

// ─── Registration ──────────────────────────────────────────────────────────────

it('registers a new patient with valid data', function () {
    $response = $this->postJson('/api/v1/patient/auth/register', [
        'name'                  => 'سارة علي',
        'email'                 => 'sara@example.com',
        'password'              => 'Password123!',
        'password_confirmation' => 'Password123!',
        'phone'                 => '01012345678',
    ]);

    $response->assertStatus(201);
    $this->assertDatabaseHas('users', ['email' => 'sara@example.com']);
});

it('fails registration with duplicate email', function () {
    User::factory()->create(['email' => 'duplicate@example.com']);

    $response = $this->postJson('/api/v1/patient/auth/register', [
        'name'                  => 'نورا أحمد',
        'email'                 => 'duplicate@example.com',
        'password'              => 'Password123!',
        'password_confirmation' => 'Password123!',
        'phone'                 => '01012345679',
    ]);

    $response->assertStatus(422)
             ->assertJsonValidationErrors(['email']);
});

it('fails registration with invalid phone format', function () {
    $response = $this->postJson('/api/v1/patient/auth/register', [
        'name'                  => 'فاطمة إبراهيم',
        'email'                 => 'fatima@example.com',
        'password'              => 'Password123!',
        'password_confirmation' => 'Password123!',
        'phone'                 => 'not-a-phone',
    ]);

    $response->assertStatus(422)
             ->assertJsonValidationErrors(['phone']);
});

// ─── Login ────────────────────────────────────────────────────────────────────

it('logs in with correct credentials', function () {
    $user = User::factory()->create([
        'email'    => 'patient@example.com',
        'password' => bcrypt('password'),
        'is_active' => true,
    ]);

    $response = $this->postJson('/api/v1/patient/auth/login', [
        'email'    => 'patient@example.com',
        'password' => 'password',
    ]);

    $response->assertOk()
             ->assertJsonStructure(['data' => ['token']]);
});

it('returns 401 for wrong password', function () {
    User::factory()->create([
        'email'    => 'valid@example.com',
        'password' => bcrypt('correct_password'),
        'is_active' => true,
    ]);

    $response = $this->postJson('/api/v1/patient/auth/login', [
        'email'    => 'valid@example.com',
        'password' => 'wrong_password',
    ]);

    $response->assertStatus(401);
});

it('returns 401 for non-existent email', function () {
    $response = $this->postJson('/api/v1/patient/auth/login', [
        'email'    => 'nobody@example.com',
        'password' => 'password',
    ]);

    $response->assertStatus(401);
});

it('cannot login with inactive account', function () {
    User::factory()->create([
        'email'     => 'inactive@example.com',
        'password'  => bcrypt('password'),
        'is_active' => false,
    ]);

    $response = $this->postJson('/api/v1/patient/auth/login', [
        'email'    => 'inactive@example.com',
        'password' => 'password',
    ]);

    $response->assertStatus(403);
});

// ─── Logout ───────────────────────────────────────────────────────────────────

it('logs out and invalidates token', function () {
    $user = User::factory()->create([
        'is_active'         => true,
        'email_verified_at' => now(),
    ]);
    UserProfile::factory()->create(['user_id' => $user->id]);

    $token = $user->createToken('test-token')->plainTextToken;

    $response = $this->withToken($token)
                     ->postJson('/api/v1/patient/auth/logout');

    $response->assertOk();
    $this->assertDatabaseMissing('personal_access_tokens', [
        'tokenable_id'   => $user->id,
        'tokenable_type' => User::class,
    ]);
});

// ─── OTP Verification ─────────────────────────────────────────────────────────

it('verifies OTP successfully', function () {
    $user = User::factory()->unverified()->create([
        'email'     => 'verify@example.com',
        'is_active' => true,
    ]);
    UserProfile::factory()->create(['user_id' => $user->id]);

    $otpObj = new \Ichtrojan\Otp\Otp();
    $otpResult = $otpObj->generate($user->email, 'numeric', 5, 10);
    $otp = $otpResult->token;

    $response = $this->actingAs($user, 'patient')
                     ->postJson('/api/v1/patient/auth/email/verify', ['code' => $otp]);

    $response->assertOk();
    $this->assertNotNull($user->fresh()->email_verified_at);
});

it('rejects incorrect OTP', function () {
    $user = User::factory()->unverified()->create([
        'email'     => 'wrongotp@example.com',
        'is_active' => true,
    ]);
    UserProfile::factory()->create(['user_id' => $user->id]);

    $otpObj = new \Ichtrojan\Otp\Otp();
    $otpObj->generate($user->email, 'numeric', 5, 10);

    $response = $this->actingAs($user, 'patient')
                     ->postJson('/api/v1/patient/auth/email/verify', ['code' => '00000']);

    $response->assertStatus(400);
});
