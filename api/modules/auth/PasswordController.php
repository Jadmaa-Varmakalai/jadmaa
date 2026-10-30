<?php
declare(strict_types=1);

namespace Jadmaa\Modules\Auth;

use Jadmaa\Core\Request;
use Jadmaa\Core\Response;
use Jadmaa\Core\Utils;
use Jadmaa\Config\Database;
use Jadmaa\Services\EmailService;
use Jadmaa\Middleware\AuthMiddleware;
use PDO;

class PasswordController
{
    public function forgotPassword(Request $request): void
    {
        $body = $request->getBody();
        $email = strtolower(trim((string)($body['email'] ?? '')));

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::error('Valid email is required');
        }

        $pdo = Database::getPdo();
        $stmt = $pdo->prepare('SELECT id, name, email FROM users WHERE email = ? AND isActive = 1 LIMIT 1');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        // Always return success message to avoid email enumeration
        if (!$user) {
            Response::success(null, 200, 'If an account exists with this email, password reset instructions have been sent.');
            return;
        }

        $rawToken = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $rawToken);
        $expiresAt = date('Y-m-d H:i:s', time() + 1800); // 30 minutes

        $insStmt = $pdo->prepare('
            INSERT INTO password_reset_tokens (id, userId, tokenHash, expiresAt, createdAt)
            VALUES (?, ?, ?, ?, NOW())
        ');
        $insStmt->execute([Utils::generateUuid(), $user['id'], $tokenHash, $expiresAt]);

        $appUrl = getenv('APP_URL') ?: (getenv('FRONTEND_URL') ?: 'https://jadmaa.com');
        $resetUrl = rtrim($appUrl, '/') . "/auth/reset-password?token={$rawToken}";

        EmailService::sendPasswordResetEmail($user['email'], $resetUrl, $user['name']);

        Response::success(null, 200, 'If an account exists with this email, password reset instructions have been sent.');
    }

    public function resetPassword(Request $request): void
    {
        $body = $request->getBody();
        $token = trim((string)($body['token'] ?? ''));
        $newPassword = (string)($body['newPassword'] ?? ($body['password'] ?? ''));

        if (empty($token)) {
            Response::error('Reset token is required');
        }

        if (strlen($newPassword) < 6) {
            Response::error('Password must be at least 6 characters');
        }

        $tokenHash = hash('sha256', $token);
        $pdo = Database::getPdo();

        $stmt = $pdo->prepare('
            SELECT id, userId, expiresAt, usedAt 
            FROM password_reset_tokens 
            WHERE tokenHash = ? LIMIT 1
        ');
        $stmt->execute([$tokenHash]);
        $resetRecord = $stmt->fetch();

        if (!$resetRecord || $resetRecord['usedAt'] !== null || strtotime($resetRecord['expiresAt']) <= time()) {
            Response::error('Invalid or expired password reset link');
        }

        $newHash = password_hash($newPassword, PASSWORD_BCRYPT);

        $pdo->beginTransaction();
        try {
            $updateUser = $pdo->prepare('UPDATE users SET passwordHash = ?, updatedAt = NOW() WHERE id = ?');
            $updateUser->execute([$newHash, $resetRecord['userId']]);

            $markUsed = $pdo->prepare('UPDATE password_reset_tokens SET usedAt = NOW() WHERE id = ?');
            $markUsed->execute([$resetRecord['id']]);

            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            Response::serverError('Failed to reset password. Please try again.');
        }

        Response::success(null, 200, 'Password has been successfully reset. You can now log in.');
    }

    public function changePassword(Request $request): void
    {
        $user = AuthMiddleware::authenticate($request);
        $body = $request->getBody();

        $currentPassword = (string)($body['currentPassword'] ?? '');
        $newPassword = (string)($body['newPassword'] ?? '');

        if (empty($currentPassword) || empty($newPassword)) {
            Response::error('Current password and new password are required');
        }

        if (strlen($newPassword) < 6) {
            Response::error('New password must be at least 6 characters');
        }

        $pdo = Database::getPdo();
        $stmt = $pdo->prepare('SELECT passwordHash FROM users WHERE id = ? LIMIT 1');
        $stmt->execute([$user['id']]);
        $currentHash = $stmt->fetchColumn();

        if (!$currentHash || !password_verify($currentPassword, $currentHash)) {
            Response::error('Incorrect current password');
        }

        $newHash = password_hash($newPassword, PASSWORD_BCRYPT);
        $updateStmt = $pdo->prepare('UPDATE users SET passwordHash = ?, updatedAt = NOW() WHERE id = ?');
        $updateStmt->execute([$newHash, $user['id']]);

        Response::success(null, 200, 'Password changed successfully');
    }
}
