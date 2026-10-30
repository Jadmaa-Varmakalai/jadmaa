<?php
declare(strict_types=1);

namespace Jadmaa\Core;

/**
 * HTTP Request Representation
 * Provides convenient access to body, headers, raw body, cookies, query, and user context.
 */
class Request
{
    private string $method;
    private string $uri;
    private string $path;
    private array $queryParams = [];
    private array $routeParams = [];
    private array $headers = [];
    private ?string $rawBody = null;
    private array $body = [];
    private array $cookies = [];
    public ?array $user = null;

    public function __construct()
    {
        $this->method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $this->uri = $_SERVER['REQUEST_URI'] ?? '/';
        $pathOnly = parse_url($this->uri, PHP_URL_PATH) ?? '/';
        $this->path = rtrim($pathOnly, '/') ?: '/';
        $this->queryParams = $_GET;
        $this->cookies = $_COOKIE;
        $this->headers = $this->extractHeaders();
        $this->parseBody();
    }

    private function extractHeaders(): array
    {
        $headers = [];
        foreach ($_SERVER as $key => $value) {
            if (str_starts_with($key, 'HTTP_')) {
                $headerName = strtolower(str_replace('_', '-', substr($key, 5)));
                $headers[$headerName] = $value;
            } elseif (in_array($key, ['CONTENT_TYPE', 'CONTENT_LENGTH'])) {
                $headerName = strtolower(str_replace('_', '-', $key));
                $headers[$headerName] = $value;
            }
        }
        return $headers;
    }

    private function parseBody(): void
    {
        $this->rawBody = file_get_contents('php://input');

        $contentType = $this->getHeader('content-type') ?? '';

        if (str_contains($contentType, 'application/json')) {
            $decoded = json_decode($this->rawBody ?: '{}', true);
            $this->body = is_array($decoded) ? $decoded : [];
        } else {
            $this->body = $_POST;
        }
    }

    public function getMethod(): string
    {
        return $this->method;
    }

    public function getPath(): string
    {
        return $this->path;
    }

    public function getQuery(?string $key = null, mixed $default = null): mixed
    {
        if ($key === null) {
            return $this->queryParams;
        }
        return $this->queryParams[$key] ?? $default;
    }

    public function getBody(?string $key = null, mixed $default = null): mixed
    {
        if ($key === null) {
            return $this->body;
        }
        return $this->body[$key] ?? $default;
    }

    public function getRawBody(): string
    {
        return $this->rawBody ?? '';
    }

    public function getHeader(string $name, ?string $default = null): ?string
    {
        return $this->headers[strtolower($name)] ?? $default;
    }

    public function getCookie(string $name, ?string $default = null): ?string
    {
        return $this->cookies[$name] ?? $default;
    }

    public function setRouteParams(array $params): void
    {
        $this->routeParams = $params;
    }

    public function getParam(string $name, mixed $default = null): mixed
    {
        return $this->routeParams[$name] ?? $default;
    }

    public function getParams(): array
    {
        return $this->routeParams;
    }
}
