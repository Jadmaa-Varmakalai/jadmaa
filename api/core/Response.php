<?php
declare(strict_types=1);

namespace Jadmaa\Core;

/**
 * Standard JSON Response Formatter
 * Matches existing React 19 frontend expectations:
 * Success: { "success": true, "data": ... }
 * Error:   { "success": false, "error": { "message": "..." } }
 */
class Response
{
    public static function json(mixed $data, int $statusCode = 200, array $headers = []): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');

        foreach ($headers as $key => $value) {
            header("{$key}: {$value}");
        }

        echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function success(mixed $data = null, int $statusCode = 200, ?string $message = null): void
    {
        $payload = ['success' => true];
        if ($message !== null) {
            $payload['message'] = $message;
        }
        if ($data !== null) {
            $payload['data'] = $data;
        }
        self::json($payload, $statusCode);
    }

    public static function error(string $message, int $statusCode = 400, mixed $details = null): void
    {
        $payload = [
            'success' => false,
            'error' => [
                'message' => $message
            ]
        ];
        if ($details !== null) {
            $payload['error']['details'] = $details;
        }
        self::json($payload, $statusCode);
    }

    public static function unauthorized(string $message = 'Unauthorized'): void
    {
        self::error($message, 401);
    }

    public static function forbidden(string $message = 'Forbidden: Insufficient permissions'): void
    {
        self::error($message, 403);
    }

    public static function notFound(string $message = 'Resource not found'): void
    {
        self::error($message, 404);
    }

    public static function serverError(string $message = 'Internal server error'): void
    {
        self::error($message, 500);
    }
}
