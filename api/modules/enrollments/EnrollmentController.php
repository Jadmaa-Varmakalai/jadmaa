<?php
declare(strict_types=1);

namespace Jadmaa\Modules\Enrollments;

use Jadmaa\Core\Request;
use Jadmaa\Core\Response;
use Jadmaa\Core\Utils;
use Jadmaa\Config\Database;
use Jadmaa\Middleware\AuthMiddleware;
use PDO;

class EnrollmentController
{
    public function enrollFreeCourse(Request $request): void
    {
        $user = AuthMiddleware::authenticate($request);
        $body = $request->getBody();
        $courseId = trim((string)($body['courseId'] ?? ''));

        if (empty($courseId)) {
            Response::error('Course ID is required');
        }

        $pdo = Database::getPdo();

        // Retrieve course and check if it is free and published
        $stmt = $pdo->prepare('SELECT id, title, isFree, price, status FROM courses WHERE id = ? LIMIT 1');
        $stmt->execute([$courseId]);
        $course = $stmt->fetch();

        if (!$course || $course['status'] !== 'PUBLISHED') {
            Response::notFound('Course not found or not published');
        }

        if (!(bool)$course['isFree'] && (float)$course['price'] > 0) {
            Response::error('This course is not free. Please complete payment to enroll.');
        }

        // Check if already enrolled
        $enrStmt = $pdo->prepare('SELECT id, status FROM enrollments WHERE userId = ? AND courseId = ? LIMIT 1');
        $enrStmt->execute([$user['id'], $courseId]);
        $existing = $enrStmt->fetch();

        if ($existing && $existing['status'] === 'ACTIVE') {
            Response::success([
                'id' => $existing['id'],
                'courseId' => $courseId,
                'status' => 'ACTIVE',
                'message' => 'Already enrolled in this course.'
            ]);
            return;
        }

        $enrollmentId = $existing['id'] ?? Utils::generateUuid();

        $upsertStmt = $pdo->prepare('
            INSERT INTO enrollments (id, userId, courseId, status, enrolledAt, createdAt, updatedAt)
            VALUES (?, ?, ?, "ACTIVE", NOW(), NOW(), NOW())
            ON DUPLICATE KEY UPDATE status = "ACTIVE", updatedAt = NOW()
        ');
        $upsertStmt->execute([$enrollmentId, $user['id'], $courseId]);

        Response::success([
            'id' => $enrollmentId,
            'courseId' => $courseId,
            'status' => 'ACTIVE',
            'message' => 'Enrolled successfully in free course.'
        ]);
    }
}
