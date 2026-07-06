<?php

namespace Tests\Traits;

use Illuminate\Support\Facades\Http;

trait FakePaymob
{
    protected function fakePaymobSuccess(): void
    {
        Http::fake([
            '*paymob.com*' => Http::response(['success' => true, 'id' => 12345], 200),
            '*accept.paymob*' => Http::response(['token' => 'fake_paymob_token'], 200),
        ]);
    }

    protected function fakePaymobRefund(): void
    {
        Http::fake([
            '*paymob.com/api/acceptance/void_refund*' => Http::response(['success' => true], 200),
        ]);
    }

    protected function buildPaymobCallback($merchantOrderId, bool $success = true, ?string $secret = null): array
    {
        $secret = $secret ?? config('services.paymob.hmac_secret', 'test_secret');
        $merchantOrderId = is_numeric($merchantOrderId) ? "consultation_{$merchantOrderId}_" . time() : $merchantOrderId;

        $obj = [
            'amount_cents'           => '25000',
            'created_at'             => '2023-01-01 00:00:00',
            'currency'               => 'EGP',
            'error_occured'          => 'false',
            'has_parent_transaction' => 'false',
            'id'                     => (string) rand(1000000, 9999999),
            'integration_id'         => '1234',
            'is_3d_secure'           => 'true',
            'is_auth'                => 'false',
            'is_capture'             => 'false',
            'is_refunded'            => 'false',
            'is_standalone_payment'  => 'false',
            'is_voided'              => 'false',
            'owner'                  => '123',
            'pending'                => 'false',
            'success'                => $success ? 'true' : 'false',
            'order' => [
                'id'                => (string) rand(1000, 9999),
                'merchant_order_id' => $merchantOrderId,
            ],
            'source_data' => [
                'pan'      => '1234',
                'sub_type' => 'MasterCard',
                'type'     => 'card',
            ]
        ];

        $hmacData = [
            'amount_cents'           => $obj['amount_cents'],
            'created_at'             => $obj['created_at'],
            'currency'               => $obj['currency'],
            'error_occured'          => $obj['error_occured'],
            'has_parent_transaction' => $obj['has_parent_transaction'],
            'id'                     => $obj['id'],
            'integration_id'         => $obj['integration_id'],
            'is_3d_secure'           => $obj['is_3d_secure'],
            'is_auth'                => $obj['is_auth'],
            'is_capture'             => $obj['is_capture'],
            'is_refunded'            => $obj['is_refunded'],
            'is_standalone_payment'  => $obj['is_standalone_payment'],
            'is_voided'              => $obj['is_voided'],
            'order_id'               => $obj['order']['id'],
            'owner'                  => $obj['owner'],
            'pending'                => $obj['pending'],
            'source_data_pan'        => $obj['source_data']['pan'],
            'source_data_sub_type'   => $obj['source_data']['sub_type'],
            'source_data_type'       => $obj['source_data']['type'],
            'success'                => $obj['success'],
        ];

        $hmacString = implode('', array_values($hmacData));
        $hmac = hash_hmac('sha512', $hmacString, $secret);

        return [
            'obj'  => $obj,
            'hmac' => $hmac,
            'type' => 'TRANSACTION',
        ];
    }
}
