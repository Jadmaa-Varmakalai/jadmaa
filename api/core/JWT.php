<?php
declare(strict_types=1);

namespace Jadmaa\Core;

/**
 * High-performance, zero-dependency JWT implementation (HS256)
 * 100% compatible with jsonwebtoken npm package.
 */
class JWT
{
    private static function base64UrlEncode(string $data): string
    {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
    }

    private static function base64UrlDecode(string $data): string
    {
        $remainder = strlen($data) % 4;
        if ($remainder) {
            $padlen = 4 - $remainder;
            $data .= str_repeat('=', $padlen);
        }
        return base64_decode(str_replace(['-', '_'], ['+', '/'], $data));
    }

    /**
     * Generate a signed JWT
     */
    public static function sign(array $payload, string $secret, int $expiresInSeconds = 604800): string
    {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256'], JSON_UNESCAPED_SLASHES);
        
        $now = time();
        $payload['iat'] = $now;
        if (!isset($payload['exp'])) {
            $payload['exp'] = $now + $expiresInSeconds;
        }

        $base64Header = self::base64UrlEncode($header);
        $base64Payload = self::base64UrlEncode(json_encode($payload, JSON_UNESCAPED_SLASHES));

        $signature = hash_hmac('sha256', "{$base64Header}.{$base64Payload}", $secret, true);
        $base64Signature = self::base64UrlEncode($signature);

        return "{$base64Header}.{$base64Payload}.{$base64Signature}";
    }

    /**
     * Verify and decode a JWT. Returns decoded payload array or null if invalid / expired.
     */
    public static function verify(string $token, string $secret): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        [$base64Header, $base64Payload, $base64Signature] = $parts;

        $expectedSignature = self::base64UrlEncode(
            hash_hmac('sha256', "{$base64Header}.{$base64Payload}", $secret, true)
        );

        if (!hash_equals($expectedSignature, $base64Signature)) {
            return null;
        }

        $payloadJson = self::base64UrlDecode($base64Payload);
        $payload = json_decode($payloadJson, true);

        if (!is_array($payload)) {
            return null;
        }

        // Check expiration
        if (isset($payload['exp']) && time() >= $payload['exp']) {
            return null;
        }

        return $payload;
    }
}
