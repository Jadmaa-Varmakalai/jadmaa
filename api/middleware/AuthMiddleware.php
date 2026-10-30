<?php
declare(strict_types=1);

namespace Jadmaa\Middleware;

use Jadmaa\Core\Request;
use Jadmaa\Core\Response;
use Jadmaa\Core\JWT;
use Jadmaa\Config\Database;
use PDO;

/**
 * Authentication and Authorization Middleware
 * Verifies JWT access tokens and checks user roles.
 */
class AuthMiddleware
{
    private static ?array $userCache = null;

    /**
     * Authenticate request and attach user record to Request.
     * Halts with 401 Unauthorized if invalid.
     */
    public static function authenticate(Request $request): array
    {
        $authHeader = $request->getHeader('authorization');
        $token = null;

        if ($authHeader && preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            $token = trim($matches[1]);
        } else {
            $token = $request->getCookie('accessToken') ?: $request->getCookie('token');
        }

        if (!$token) {
            Response::unauthorized('Unauthorized');
        }

        $secret = getenv('JWT_SECRET') ?: 'supersecret_jwt_key';
        $payload = JWT::verify($token, $secret);

        if (!$payload || !isset($payload['id'])) {
            Response::unauthorized('Invalid or expired token');
        }

        $userId = $payload['id'];

        // Fetch user from DB
        $pdo = Database::getPdo();
        $stmt = $pdo->prepare('
            SELECT id, name, email, phone, role, avatarUrl, emailVerified, isActive, isAdmin, createdAt 
            FROM users 
            WHERE id = ? LIMIT 1
        ');
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user || !(int)$user['isActive']) {
            Response::unauthorized('Unauthorized: Account inactive or not found');
        }

        // Attach enrolled course IDs
        $enrStmt = $pdo->prepare('SELECT courseId FROM enrollments WHERE userId = ? AND status = "ACTIVE"');
        $enrStmt->execute([$userId]);
        $user['enrolledCourses'] = $enrStmt->fetchAll(PDO::FETCH_COLUMN) ?: [];

        $request->user = $user;
        return $user;
    }

    /**
     * Authorize user against allowed roles list
     */
    public static function authorize(Request $request, array $roles): void
    {
        $user = $request->user ?? self::authenticate($request);
        $userRole = strtoupper((string)($user['role'] ?? ''));
        $isAdmin = (bool)($user['isAdmin'] ?? false);

        $allowed = array_map('strtoupper', $roles);

        if (!in_array($userRole, $allowed, true) && !$isAdmin) {
            Response::forbidden('Forbidden: Insufficient permissions');
        }
    }

    public static function requireAdmin(Request $request): void
    {
        self::authorize($request, ['ADMIN', 'SUPER_ADMIN']);
    }

    public static function requireSuperAdmin(Request $request): void
    {
        self::authorize($request, ['SUPER_ADMIN']);
    }

    public static function requireInstructor(Request $request): void
    {
        self::authorize($request, ['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN']);
    }
}
