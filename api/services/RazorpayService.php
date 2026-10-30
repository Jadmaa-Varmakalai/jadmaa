<?php
declare(strict_types=1);

namespace Jadmaa\Services;

/**
 * Native Razorpay Payment Service (cURL + HMAC-SHA256)
 * Zero external package dependencies; 100% compatible with Hostinger shared hosting.
 */
class RazorpayService
{
    private static ?RazorpayService $instance = null;
    private string $keyId = '';
    private string $keySecret = '';
    private string $webhookSecret = '';

    private function __construct()
    {
        $this->refreshCredentials();
    }

    public static function getInstance(): RazorpayService
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function refreshCredentials(): void
    {
        $this->keyId = trim((string)getenv('RAZORPAY_KEY_ID'));
        $this->keySecret = trim((string)getenv('RAZORPAY_KEY_SECRET'));
        $this->webhookSecret = trim((string)getenv('RAZORPAY_WEBHOOK_SECRET'));
    }

    public function getKeyId(): string
    {
        return $this->keyId ?: (string)getenv('RAZORPAY_KEY_ID');
    }

    public function isConfigured(): bool
    {
        return !empty($this->keyId) && !empty($this->keySecret);
    }

    private function request(string $method, string $endpoint, array $data = []): array
    {
        $url = 'https://api.razorpay.com/v1/' . ltrim($endpoint, '/');

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_USERPWD, "{$this->keyId}:{$this->keySecret}");
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);

        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err = curl_error($ch);
        curl_close($ch);

        if ($err) {
            throw new \RuntimeException("Razorpay connection error: {$err}");
        }

        $decoded = json_decode($response ?: '{}', true);

        if ($httpCode < 200 || $httpCode >= 300) {
            $msg = $decoded['error']['description'] ?? $decoded['error']['message'] ?? "Razorpay API error ({$httpCode})";
            throw new \RuntimeException("Razorpay error: {$msg}");
        }

        return $decoded;
    }

    /**
     * Create an order on Razorpay
     */
    public function createOrder(int $amountInPaise, string $receipt, array $notes = [], string $currency = 'INR'): array
    {
        return $this->request('POST', 'orders', [
            'amount' => $amountInPaise,
            'currency' => $currency,
            'receipt' => $receipt,
            'notes' => $notes,
        ]);
    }

    /**
     * Fetch order from Razorpay
     */
    public function getOrder(string $orderId): array
    {
        return $this->request('GET', "orders/{$orderId}");
    }

    /**
     * Fetch payment from Razorpay
     */
    public function getPayment(string $paymentId): array
    {
        return $this->request('GET', "payments/{$paymentId}");
    }

    /**
     * Verify standard checkout signature
     * HMAC_SHA256(order_id + '|' + razorpay_payment_id, secret)
     */
    public function verifyPaymentSignature(string $orderId, string $paymentId, string $signature): bool
    {
        $secret = $this->keySecret ?: (string)getenv('RAZORPAY_KEY_SECRET');
        if (empty($secret)) {
            throw new \RuntimeException('RAZORPAY_KEY_SECRET is not configured for signature verification');
        }

        $payload = "{$orderId}|{$paymentId}";
        $generatedSignature = hash_hmac('sha256', $payload, $secret);

        return hash_equals($generatedSignature, $signature);
    }

    /**
     * Verify webhook event signature
     * HMAC_SHA256(raw_body, webhook_secret)
     */
    public function verifyWebhookSignature(string $rawBody, string $signature): bool
    {
        $secret = $this->webhookSecret ?: (string)getenv('RAZORPAY_WEBHOOK_SECRET');
        if (empty($secret)) {
            throw new \RuntimeException('RAZORPAY_WEBHOOK_SECRET is not configured for webhook verification');
        }

        $generatedSignature = hash_hmac('sha256', $rawBody, $secret);

        return hash_equals($generatedSignature, $signature);
    }
}
