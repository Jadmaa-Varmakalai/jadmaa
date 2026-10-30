<?php
declare(strict_types=1);

namespace Jadmaa\Core;

/**
 * Lightweight, regex-based HTTP Router with parameter support and middleware chain.
 */
class Router
{
    private array $routes = [];
    private array $globalMiddleware = [];

    public function use(callable $middleware): self
    {
        $this->globalMiddleware[] = $middleware;
        return $this;
    }

    public function get(string $path, mixed $handler, array $middlewares = []): self
    {
        return $this->addRoute('GET', $path, $handler, $middlewares);
    }

    public function post(string $path, mixed $handler, array $middlewares = []): self
    {
        return $this->addRoute('POST', $path, $handler, $middlewares);
    }

    public function put(string $path, mixed $handler, array $middlewares = []): self
    {
        return $this->addRoute('PUT', $path, $handler, $middlewares);
    }

    public function patch(string $path, mixed $handler, array $middlewares = []): self
    {
        return $this->addRoute('PATCH', $path, $handler, $middlewares);
    }

    public function delete(string $path, mixed $handler, array $middlewares = []): self
    {
        return $this->addRoute('DELETE', $path, $handler, $middlewares);
    }

    public function options(string $path, mixed $handler, array $middlewares = []): self
    {
        return $this->addRoute('OPTIONS', $path, $handler, $middlewares);
    }

    private function addRoute(string $method, string $path, mixed $handler, array $middlewares = []): self
    {
        // Convert route pattern e.g. /courses/:slug to regex
        $pattern = preg_replace('#:([a-zA-Z0-9_]+)#', '(?P<$1>[^/]+)', $path);
        $regex = '#^' . $pattern . '$#';

        $this->routes[] = [
            'method' => strtoupper($method),
            'path' => $path,
            'regex' => $regex,
            'handler' => $handler,
            'middlewares' => $middlewares,
        ];

        return $this;
    }

    public function dispatch(Request $request): void
    {
        $method = $request->getMethod();
        $path = $request->getPath();

        // Handle CORS preflight OPTIONS
        if ($method === 'OPTIONS') {
            header('Access-Control-Allow-Origin: *');
            header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, Authorization, x-refresh-token, x-razorpay-signature');
            header('Access-Control-Allow-Credentials: true');
            http_response_code(204);
            exit;
        }

        // Apply global middleware
        foreach ($this->globalMiddleware as $middleware) {
            $middleware($request);
        }

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }

            if (preg_match($route['regex'], $path, $matches)) {
                $params = [];
                foreach ($matches as $key => $val) {
                    if (is_string($key)) {
                        $params[$key] = urldecode($val);
                    }
                }
                $request->setRouteParams($params);

                // Run route-level middlewares
                foreach ($route['middlewares'] as $middleware) {
                    if (is_callable($middleware)) {
                        $middleware($request);
                    }
                }

                $handler = $route['handler'];

                if (is_callable($handler)) {
                    $handler($request);
                    return;
                }

                if (is_array($handler) && count($handler) === 2) {
                    [$class, $action] = $handler;
                    $controller = new $class();
                    $controller->$action($request);
                    return;
                }

                Response::serverError('Invalid route handler configuration');
                return;
            }
        }

        Response::notFound("Endpoint not found: [{$method}] {$path}");
    }
}
