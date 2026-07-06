<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Log;
use App\Models\Consultation;
use App\Models\Payment;

class PaymobService
{
    protected $client;
    protected $apiKey;
    protected $integrationId;
    protected $integrationIdWallet; // New property
    protected $iframeId;
    protected $hmacSecret;
    protected $baseUrl = 'https://accept.paymob.com/api/';

    public function __construct()
    {
        $this->apiKey = config('services.paymob.api_key');
        $this->integrationId = config('services.paymob.integration_id');
        $this->integrationIdWallet = config('services.paymob.wallet_integration_id'); // Init
        $this->iframeId = config('services.paymob.iframe_id');
        $this->hmacSecret = config('services.paymob.hmac_secret');

        $this->client = new Client([
            'base_uri' => $this->baseUrl,
            'timeout' => 30,
        ]);
    }

    /**
     * Step 1: Authentication - Get auth token
     */
    protected function authenticate(): ?string
    {
        try {
            $response = $this->client->post('auth/tokens', [
                'json' => [
                    'api_key' => $this->apiKey,
                ],
            ]);

            $data = json_decode($response->getBody()->getContents(), true);
            return $data['token'] ?? null;
        } catch (GuzzleException $e) {
            Log::error('Paymob Auth Error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Step 2: Register Order
     */
    protected function registerOrder(string $authToken, Consultation $consultation): ?int
    {
        try {
            $response = $this->client->post('ecommerce/orders', [
                'json' => [
                    'auth_token' => $authToken,
                    'delivery_needed' => 'false',
                    'amount_cents' => (int) ($consultation->price * 100),
                    'currency' => 'EGP',
                    'merchant_order_id' => 'consultation_' . $consultation->id . '_' . time(),
                    'items' => [
                        [
                            'name' => 'استشارة طبية مع د. ' . $consultation->doctor->name,
                            'amount_cents' => (int) ($consultation->price * 100),
                            'description' => 'استشارة ' . ($consultation->type === 'video' ? 'فيديو' : 'عيادة'),
                            'quantity' => 1,
                        ],
                    ],
                ],
            ]);

            $data = json_decode($response->getBody()->getContents(), true);
            return $data['id'] ?? null;
        } catch (GuzzleException $e) {
            Log::error('Paymob Register Order Error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Step 3: Get Payment Key
     */
    protected function getPaymentKey(string $authToken, int $orderId, Consultation $consultation, ?string $integrationId = null): ?string
    {
        try {
            $patient = $consultation->patient;
            $integrationId = $integrationId ?? $this->integrationId;
            
            $response = $this->client->post('acceptance/payment_keys', [
                'json' => [
                    'auth_token' => $authToken,
                    'amount_cents' => (int) ($consultation->price * 100),
                    'expiration' => 3600, // 1 hour
                    'order_id' => $orderId,
                    'billing_data' => [
                        'apartment' => 'NA',
                        'email' => $patient->email,
                        'floor' => 'NA',
                        'first_name' => explode(' ', $patient->name)[0] ?? $patient->name,
                        'street' => 'NA',
                        'building' => 'NA',
                        'phone_number' => $patient->phone ?? 'NA',
                        'shipping_method' => 'NA',
                        'postal_code' => 'NA',
                        'city' => 'Cairo',
                        'country' => 'EG',
                        'last_name' => explode(' ', $patient->name)[1] ?? 'NA',
                        'state' => 'NA',
                    ],
                    'currency' => 'EGP',
                    'integration_id' => (int) $integrationId,
                ],
            ]);

            $data = json_decode($response->getBody()->getContents(), true);
            return $data['token'] ?? null;
        } catch (GuzzleException $e) {
            Log::error('Paymob Payment Key Error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Initiate payment for a consultation
     */
    public function initiatePayment(Consultation $consultation): ?array
    {
        // Step 1: Authenticate
        $authToken = $this->authenticate();
        if (!$authToken) {
            return null;
        }

        // Step 2: Register Order
        $orderId = $this->registerOrder($authToken, $consultation);
        if (!$orderId) {
            return null;
        }

        // Step 3: Get Payment Key
        $paymentKey = $this->getPaymentKey($authToken, $orderId, $consultation);
        if (!$paymentKey) {
            return null;
        }

        // Generate payment URL
        $paymentUrl = "https://accept.paymob.com/api/acceptance/iframes/{$this->iframeId}?payment_token={$paymentKey}";

        return [
            'order_id' => $orderId,
            'payment_key' => $paymentKey,
            'payment_url' => $paymentUrl,
        ];
    }

    /**
     * Initiate Wallet Payment
     */
    public function initiateWalletPayment(Consultation $consultation, string $mobileNumber): ?array
    {
        // Step 1: Authenticate
        $authToken = $this->authenticate();
        if (!$authToken) {
            return null;
        }

        // Step 2: Register Order
        $orderId = $this->registerOrder($authToken, $consultation);
        if (!$orderId) {
            return null;
        }

        // Step 3: Get Payment Key (Using Wallet Integration ID)
        $paymentKey = $this->getPaymentKey($authToken, $orderId, $consultation, $this->integrationIdWallet);
        if (!$paymentKey) {
            return null;
        }

        // Step 4: Pay Request
        try {
            $response = $this->client->post('acceptance/payments/pay', [
                'json' => [
                    'source' => [
                        'identifier' => $mobileNumber,
                        'subtype' => 'WALLET',
                    ],
                    'payment_token' => $paymentKey,
                ],
            ]);

            $data = json_decode($response->getBody()->getContents(), true);
            
            // For wallets, the redirect_url is where the user should go (though often it's direct)
            // or we might just get a pending status if it's a push notification request.
            // Paymob usually returns a redirect_url in the response for wallet payments.
            
            return [
                'order_id' => $orderId,
                'payment_key' => $paymentKey,
                'redirect_url' => $data['redirect_url'] ?? $data['iframe_redirection_url'] ?? null,
                'pending' => $data['pending'] ?? false,
            ];

        } catch (GuzzleException $e) {
            Log::error('Paymob Wallet Pay Request Error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Verify callback HMAC signature
     */
    public function verifyCallback(array $data): bool
    {
        $hmacData = [
            'amount_cents' => $data['obj']['amount_cents'] ?? '',
            'created_at' => $data['obj']['created_at'] ?? '',
            'currency' => $data['obj']['currency'] ?? '',
            'error_occured' => $data['obj']['error_occured'] ?? '',
            'has_parent_transaction' => $data['obj']['has_parent_transaction'] ?? '',
            'id' => $data['obj']['id'] ?? '',
            'integration_id' => $data['obj']['integration_id'] ?? '',
            'is_3d_secure' => $data['obj']['is_3d_secure'] ?? '',
            'is_auth' => $data['obj']['is_auth'] ?? '',
            'is_capture' => $data['obj']['is_capture'] ?? '',
            'is_refunded' => $data['obj']['is_refunded'] ?? '',
            'is_standalone_payment' => $data['obj']['is_standalone_payment'] ?? '',
            'is_voided' => $data['obj']['is_voided'] ?? '',
            'order_id' => $data['obj']['order']['id'] ?? '',
            'owner' => $data['obj']['owner'] ?? '',
            'pending' => $data['obj']['pending'] ?? '',
            'source_data_pan' => $data['obj']['source_data']['pan'] ?? '',
            'source_data_sub_type' => $data['obj']['source_data']['sub_type'] ?? '',
            'source_data_type' => $data['obj']['source_data']['type'] ?? '',
            'success' => $data['obj']['success'] ?? '',
        ];

        $hmacString = implode('', array_values($hmacData));
        $calculatedHmac = hash_hmac('sha512', $hmacString, $this->hmacSecret);

        return $calculatedHmac === ($data['hmac'] ?? '');
    }

    /**
     * Process payment callback
     */
    public function processCallback(array $data): array
    {
        $success = filter_var($data['obj']['success'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $transactionId = $data['obj']['id'] ?? null;
        $orderId = $data['obj']['order']['id'] ?? null;
        $amountCents = $data['obj']['amount_cents'] ?? 0;

        // Extract consultation ID from merchant_order_id
        $merchantOrderId = $data['obj']['order']['merchant_order_id'] ?? '';
        preg_match('/consultation_(\d+)_/', $merchantOrderId, $matches);
        $consultationId = $matches[1] ?? null;

        $sourceType = $data['obj']['source_data']['type'] ?? 'card';
        $paymentMethod = $sourceType === 'wallet' ? 'paymob_wallet' : 'paymob_card';

        return [
            'success' => $success,
            'transaction_id' => $transactionId,
            'order_id' => $orderId,
            'consultation_id' => $consultationId,
            'amount' => $amountCents / 100,
            'payment_method' => $paymentMethod,
            'error_message' => $data['obj']['data']['message'] ?? null,
        ];
    }

    /**
     * Initiate refund
     */
    public function refund(string $transactionId, float $amount): bool
    {
        $authToken = $this->authenticate();
        if (!$authToken) {
            return false;
        }

        try {
            $response = $this->client->post('acceptance/void_refund/refund', [
                'json' => [
                    'auth_token' => $authToken,
                    'transaction_id' => $transactionId,
                    'amount_cents' => (int) ($amount * 100),
                ],
            ]);

            $data = json_decode($response->getBody()->getContents(), true);
            return ($data['success'] ?? false) === true;
        } catch (GuzzleException $e) {
            Log::error('Paymob Refund Error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Calculate platform commission
     */
    public function calculateCommission(float $price): array
    {
        $commissionRate = config('services.paymob.commission_rate', 0.15); // 15% default
        $platformFee = round($price * $commissionRate, 2);
        $doctorAmount = round($price - $platformFee, 2);

        return [
            'total' => $price,
            'platform_fee' => $platformFee,
            'doctor_amount' => $doctorAmount,
        ];
    }

    /**
     * Check payment status with Paymob API
     */
    public function checkPaymentStatus(string $transactionId): array
    {
        $authToken = $this->authenticate();
        if (!$authToken) {
            return ['success' => false, 'failed' => false, 'pending' => true];
        }

        try {
            $response = $this->client->get("acceptance/transactions/{$transactionId}", [
                'headers' => [
                    'Authorization' => "Bearer {$authToken}",
                ],
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            $isSuccess = ($data['success'] ?? false) === true;
            $isPending = ($data['pending'] ?? false) === true;
            $isFailed = !$isSuccess && !$isPending;

            return [
                'success' => $isSuccess,
                'failed' => $isFailed,
                'pending' => $isPending,
                'transaction_id' => $transactionId,
                'amount_cents' => $data['amount_cents'] ?? null,
                'raw' => $data,
            ];
        } catch (GuzzleException $e) {
            Log::error('Paymob Check Payment Status Error: ' . $e->getMessage());
            return ['success' => false, 'failed' => false, 'pending' => true];
        }
    }

    /**
     * Check if Paymob is configured
     */
    public function isConfigured(): bool
    {
        return !empty($this->apiKey) && 
               !empty($this->integrationId) && 
               !empty($this->iframeId);
    }

    /**
     * Verify HMAC from Paymob redirect (query string) params.
     * Paymob sends an `hmac` param in the redirect URL which we can use
     * to confirm success without making a secondary API call.
     */
    public function verifyRedirectHmac(array $params): bool
    {
        if (empty($params['hmac']) || empty($this->hmacSecret)) {
            return false;
        }

        // The exact fields Paymob includes in the redirect HMAC (order matters!)
        $fields = [
            'amount_cents',
            'created_at',
            'currency',
            'error_occured',
            'has_parent_transaction',
            'id',
            'integration_id',
            'is_3d_secure',
            'is_auth',
            'is_capture',
            'is_refunded',
            'is_standalone_payment',
            'is_voided',
            'order',
            'owner',
            'pending',
            'source_data_pan',
            'source_data_sub_type',
            'source_data_type',
            'success',
        ];

        $hmacString = '';
        foreach ($fields as $field) {
            $hmacString .= $params[$field] ?? '';
        }

        $calculatedHmac = hash_hmac('sha512', $hmacString, $this->hmacSecret);
        return hash_equals($calculatedHmac, $params['hmac']);
    }
}

