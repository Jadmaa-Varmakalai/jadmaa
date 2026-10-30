<?php
declare(strict_types=1);

namespace Jadmaa\Modules\Auth;

use Jadmaa\Core\Request;
use Jadmaa\Core\Response;
use Jadmaa\Core\JWT;
use Jadmaa\Core\Utils;
use Jadmaa\Config\Database;
use Jadmaa\Middleware\AuthMiddleware;
use PDO;

class AuthController
{
    private static function generateTokens(array $user): array
    {
        $jwtSecret = getenv('JWT_SECRET') ?: 'supersecret_jwt_key';
        $refreshSecret = getenv('JWT_REFRESH_SECRET') ?: 'supersecret_refresh_key';

        $accessToken = JWT::sign(
            ['id' => $user['id'], 'role' => $user['role']],
            $jwtSecret,
            7 * 24 * 3600 // 7 days
        );

        $refreshToken = JWT::sign(
            ['id' => $user['id']],
            $refreshSecret,
            30 * 24 * 3600 // 30 days
        );

        return ['accessToken' => $accessToken, 'refreshToken' => $refreshToken];
    }

    public function register(Request $request): void
    {
        $body = $request->getBody();
        $name = trim((string)($body['name'] ?? ''));
        $email = strtolower(trim((string)($body['email'] ?? '')));
        $phone = trim((string)($body['phone'] ?? ''));
        $password = (string)($body['password'] ?? '');
        $applyAsInstructor = !empty($body['applyAsInstructor']);

        if (empty($name) || strlen($name) < 2) {
            Response::error('Name must be at least 2 characters');
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::error('Invalid email address');
        }

        if (strlen($password) < 6) {
            Response::error('Password must be at least 6 characters');
        }

        $pdo = Database::getPdo();

        // Check existing user
        $stmt = $pdo->prepare('SELECT id, role FROM users WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        $existing = $stmt->fetch();

        if ($existing) {
            if ($existing['role'] === 'INSTRUCTOR') {
                Response::json([
                    'success' => false,
                    'isAlreadyInstructor' => true,
                    'error' => ['message' => 'This email is already registered as an Instructor. Please log in directly.']
                ], 400);
            }
            Response::error('Email already exists. Please log in.');
        }

        $passwordHash = password_hash($password, PASSWORD_BCRYPT);
        $userId = Utils::generateUuid();

        $insertStmt = $pdo->prepare('
            INSERT INTO users (id, name, email, phone, passwordHash, role, isActive, isAdmin, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, "STUDENT", 1, 0, NOW(), NOW())
        ');
        $insertStmt->execute([$userId, $name, $email, $phone, $passwordHash]);

        // If candidate applied as instructor, record application into system_settings
        if ($applyAsInstructor) {
            $applicationData = [
                'userId' => $userId,
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'title' => $body['title'] ?? 'Instructor Candidate',
                'specialization' => $body['specialization'] ?? 'Varmakalai Training',
                'experience' => $body['experience'] ?? '',
                'bio' => $body['bio'] ?? '',
                'status' => 'PENDING',
                'appliedAt' => date('c'),
            ];

            $appKey = "instructor_app_{$userId}";
            $setStmt = $pdo->prepare('
                INSERT INTO system_settings (id, `key`, `value`, description, updatedAt)
                VALUES (?, ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), description = VALUES(description), updatedAt = NOW()
            ');
            $setStmt->execute([
                Utils::generateUuid(),
                $appKey,
                json_encode($applicationData, JSON_UNESCAPED_SLASHES),
                "Instructor Application for {$name}"
            ]);
        }

        Response::success([
            'id' => $userId,
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'appliedAsInstructor' => $applyAsInstructor,
            'message' => $applyAsInstructor
                ? 'Registration successful! Your request to become an instructor has been submitted to the Admin. Until approved, you can explore courses as a student.'
                : 'Registration successful!'
        ]);
    }

    public function login(Request $request): void
    {
        $body = $request->getBody();
        $email = strtolower(trim((string)($body['email'] ?? '')));
        $password = (string)($body['password'] ?? '');

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::error('Invalid email address');
        }

        if (empty($password)) {
            Response::error('Password is required');
        }

        $pdo = Database::getPdo();
        $stmt = $pdo->prepare('
            SELECT id, name, email, phone, passwordHash, role, avatarUrl, isActive, isAdmin
            FROM users WHERE email = ? LIMIT 1
        ');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['passwordHash'])) {
            Response::error('Invalid credentials or inactive account', 401);
        }

        if (!(int)$user['isActive']) {
            Response::error('Invalid credentials or inactive account', 401);
        }

        // Update last login
        $pdo->prepare('UPDATE users SET lastLoginAt = NOW() WHERE id = ?')->execute([$user['id']]);

        // Check instructor approval notice
        $showInstructorApprovalNotice = false;
        if ($user['role'] === 'INSTRUCTOR') {
            $noticeKey = "instructor_approved_notice_{$user['id']}";
            $noticeStmt = $pdo->prepare('SELECT `value` FROM system_settings WHERE `key` = ? LIMIT 1');
            $noticeStmt->execute([$noticeKey]);
            $noticeVal = $noticeStmt->fetchColumn();

            if ($noticeVal === 'UNNOTIFIED') {
                $showInstructorApprovalNotice = true;
                $pdo->prepare('UPDATE system_settings SET `value` = "NOTIFIED" WHERE `key` = ?')->execute([$noticeKey]);
            }
        }

        $tokens = self::generateTokens($user);

        // Fetch enrolled course IDs
        $enrStmt = $pdo->prepare('SELECT courseId FROM enrollments WHERE userId = ? AND status = "ACTIVE"');
        $enrStmt->execute([$user['id']]);
        $enrolledCourses = $enrStmt->fetchAll(PDO::FETCH_COLUMN) ?: [];

        // Set HTTP-only refresh token cookie
        $isSecure = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on';
        setcookie('refreshToken', $tokens['refreshToken'], [
            'expires' => time() + 30 * 24 * 3600,
            'path' => '/',
            'httponly' => true,
            'secure' => $isSecure,
            'samesite' => 'Lax',
        ]);

        Response::success([
            'token' => $tokens['accessToken'],
            'refreshToken' => $tokens['refreshToken'],
            'showInstructorApprovalNotice' => $showInstructorApprovalNotice,
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'phone' => $user['phone'],
                'role' => $user['role'],
                'avatarUrl' => $user['avatarUrl'],
                'enrolledCourses' => $enrolledCourses,
            ]
        ]);
    }

    public function refresh(Request $request): void
    {
        $refreshToken = $request->getCookie('refreshToken') 
            ?: ($request->getBody('refreshToken') ?: $request->getHeader('x-refresh-token'));

        if (!$refreshToken) {
            Response::unauthorized('No refresh token provided');
        }

        $refreshSecret = getenv('JWT_REFRESH_SECRET') ?: 'supersecret_refresh_key';
        $payload = JWT::verify($refreshToken, $refreshSecret);

        if (!$payload || !isset($payload['id'])) {
            Response::unauthorized('Invalid or expired refresh token');
        }

        $pdo = Database::getPdo();
        $stmt = $pdo->prepare('SELECT id, name, email, role, isActive FROM users WHERE id = ? LIMIT 1');
        $stmt->execute([$payload['id']]);
        $user = $stmt->fetch();

        if (!$user || !(int)$user['isActive']) {
            Response::unauthorized('Invalid refresh token or inactive account');
        }

        $tokens = self::generateTokens($user);

        $isSecure = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on';
        setcookie('refreshToken', $tokens['refreshToken'], [
            'expires' => time() + 30 * 24 * 3600,
            'path' => '/',
            'httponly' => true,
            'secure' => $isSecure,
            'samesite' => 'Lax',
        ]);

        Response::success([
            'token' => $tokens['accessToken'],
            'refreshToken' => $tokens['refreshToken'],
        ]);
    }

    public function logout(Request $request): void
    {
        setcookie('refreshToken', '', [
            'expires' => time() - 3600,
            'path' => '/',
            'httponly' => true,
        ]);
        Response::success(['message' => 'Logged out successfully']);
    }

    public function getMe(Request $request): void
    {
        $user = AuthMiddleware::authenticate($request);
        Response::success([
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'phone' => $user['phone'],
            'role' => $user['role'],
            'avatarUrl' => $user['avatarUrl'],
            'createdAt' => $user['createdAt'],
            'enrolledCourses' => $user['enrolledCourses'] ?? [],
        ]);
    }

    public function updateProfile(Request $request): void
    {
        $user = AuthMiddleware::authenticate($request);
        $body = $request->getBody();

        $name = trim((string)($body['name'] ?? ''));
        $phone = trim((string)($body['phone'] ?? ''));
        $avatarUrl = $body['avatarUrl'] ?? null;

        if (empty($name)) {
            Response::error('Name is required');
        }

        $pdo = Database::getPdo();
        if ($avatarUrl !== null) {
            $stmt = $pdo->prepare('UPDATE users SET name = ?, phone = ?, avatarUrl = ?, updatedAt = NOW() WHERE id = ?');
            $stmt->execute([$name, $phone, $avatarUrl, $user['id']]);
        } else {
            $stmt = $pdo->prepare('UPDATE users SET name = ?, phone = ?, updatedAt = NOW() WHERE id = ?');
            $stmt->execute([$name, $phone, $user['id']]);
        }

        Response::success([
            'name' => $name,
            'phone' => $phone,
            'avatarUrl' => $avatarUrl ?? $user['avatarUrl'],
        ]);
    }

    public function checkInstructorStatus(Request $request): void
    {
        $email = strtolower(trim((string)($request->getQuery('email') ?: $request->getBody('email'))));
        if (empty($email)) {
            Response::error('Email is required');
        }

        $pdo = Database::getPdo();
        $stmt = $pdo->prepare('
            SELECT u.id, u.role, i.id AS instructorProfileId
            FROM users u
            LEFT JOIN instructors i ON i.userId = u.id
            WHERE u.email = ? LIMIT 1
        ');
        $stmt->execute([$email]);
        $row = $stmt->fetch();

        $exists = !empty($row);
        $isInstructor = $row && ($row['role'] === 'INSTRUCTOR' || !empty($row['instructorProfileId']));

        Response::success([
            'exists' => $exists,
            'isInstructor' => (bool)$isInstructor,
            'role' => $row['role'] ?? null,
        ]);
    }
}
