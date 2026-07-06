<?php

use App\Services\PaymobService;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    Config::set('services.paymob.hmac_secret', 'test_secret_123');
    $this->service = app(PaymobService::class);
});

it('verifies valid callback HMAC signature', function () {
    // Generate valid HMAC
    $data = [
        'amount_cents' => '15000',
        'created_at' => '2023-01-01T12:00:00.000000',
        'currency' => 'EGP',
        'error_occured' => 'false',
        'has_parent_transaction' => 'false',
        'id' => '123456',
        'integration_id' => '789',
        'is_3d_secure' => 'true',
        'is_auth' => 'false',
        'is_capture' => 'false',
        'is_refunded' => 'false',
        'is_standalone_payment' => 'true',
        'is_voided' => 'false',
        'order' => ['id' => '101112'],
        'owner' => '131415',
        'pending' => 'false',
        'source_data' => [
            'pan' => '1234',
            'sub_type' => 'MasterCard',
            'type' => 'card'
        ],
        'success' => 'true',
    ];

    $stringToHash = $data['amount_cents'] .
        $data['created_at'] .
        $data['currency'] .
        $data['error_occured'] .
        $data['has_parent_transaction'] .
        $data['id'] .
        $data['integration_id'] .
        $data['is_3d_secure'] .
        $data['is_auth'] .
        $data['is_capture'] .
        $data['is_refunded'] .
        $data['is_standalone_payment'] .
        $data['is_voided'] .
        $data['order']['id'] .
        $data['owner'] .
        $data['pending'] .
        $data['source_data']['pan'] .
        $data['source_data']['sub_type'] .
        $data['source_data']['type'] .
        $data['success'];

    $hmac = hash_hmac('sha512', $stringToHash, 'test_secret_123');

    $payload = [
        'obj' => $data,
        'hmac' => $hmac
    ];

    expect($this->service->verifyCallback($payload))->toBeTrue();
});

it('rejects invalid callback HMAC signature', function () {
    $payload = [
        'obj' => [
            'amount_cents' => '15000',
            // Missing all other fields to make hash invalid, or just supply wrong HMAC
        ],
        'hmac' => 'invalid_hmac_string_here'
    ];

    expect($this->service->verifyCallback($payload))->toBeFalse();
});

it('verifies valid redirect HMAC signature', function () {
    $params = [
        'amount_cents' => '15000',
        'created_at' => '2023-01-01T12:00:00.000000',
        'currency' => 'EGP',
        'error_occured' => 'false',
        'has_parent_transaction' => 'false',
        'id' => '123456',
        'integration_id' => '789',
        'is_3d_secure' => 'true',
        'is_auth' => 'false',
        'is_capture' => 'false',
        'is_refunded' => 'false',
        'is_standalone_payment' => 'true',
        'is_voided' => 'false',
        'order' => '101112',
        'owner' => '131415',
        'pending' => 'false',
        'source_data_pan' => '1234',
        'source_data_sub_type' => 'MasterCard',
        'source_data_type' => 'card',
        'success' => 'true',
    ];

    $stringToHash = implode('', array_values($params));
    $params['hmac'] = hash_hmac('sha512', $stringToHash, 'test_secret_123');

    expect($this->service->verifyRedirectHmac($params))->toBeTrue();
});
