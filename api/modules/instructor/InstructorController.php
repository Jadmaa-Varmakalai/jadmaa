<?php
declare(strict_types=1);

namespace Jadmaa\Modules\Instructor;

use Jadmaa\Core\Request;
use Jadmaa\Core\Response;
use Jadmaa\Core\Utils;
use Jadmaa\Config\Database;
use Jadmaa\Middleware\AuthMiddleware;
use PDO;

class InstructorController
{
    private function getInstructor(array $user): array
    {
        $pdo = Database::getPdo();
        $stmt = $pdo->prepare('SELECT * FROM instructors WHERE userId = ? LIMIT 1');
        $stmt->execute([$user['id']]);
        $instructor = $stmt->fetch();

        if (!$instructor) {
            // Auto-create instructor record if user has INSTRUCTOR role
            $instId = Utils::generateUuid();
            $insStmt = $pdo->prepare('
                INSERT INTO instructors (id, userId, displayName, title, isActive, createdAt, updatedAt)
                VALUES (?, ?, ?, "Instructor", 1, NOW(), NOW())
            ');
            $insStmt->execute([$instId, $user['id'], $user['name']]);
            $instructor = [
                'id' => $instId,
                'userId' => $user['id'],
                'displayName' => $user['name'],
                'title' => 'Instructor',
                'isActive' => 1
            ];
        }

        return $instructor;
    }

    public function getInstructorDashboard(Request $request): void
    {
        $user = AuthMiddleware::authenticate($request);
        AuthMiddleware::requireInstructor($request);
        $instructor = $this->getInstructor($user);

        $pdo = Database::getPdo();

        // Count courses
        $crsStmt = $pdo->prepare('SELECT COUNT(*) FROM courses WHERE instructorId = ?');
        $crsStmt->execute([$instructor['id']]);
        $totalCourses = (int)$crsStmt->fetchColumn();

        // Count total enrollments across instructor courses
        $enrStmt = $pdo->prepare('
            SELECT COUNT(e.id) 
            FROM enrollments e
            JOIN courses c ON c.id = e.courseId
            WHERE c.instructorId = ?
        ');
        $enrStmt->execute([$instructor['id']]);
        $totalStudents = (int)$enrStmt->fetchColumn();

        // Calculate earnings
        $earnStmt = $pdo->prepare('
            SELECT SUM(p.amount)
            FROM payments p
            JOIN courses c ON c.id = p.courseId
            WHERE c.instructorId = ? AND p.status = "SUCCESS"
        ');
        $earnStmt->execute([$instructor['id']]);
        $totalRevenue = (float)($earnStmt->fetchColumn() ?: 0.0);

        Response::success([
            'instructor' => $instructor,
            'stats' => [
                'totalCourses' => $totalCourses,
                'totalStudents' => $totalStudents,
                'totalRevenue' => $totalRevenue,
            ]
        ]);
    }

    public function getInstructorCourses(Request $request): void
    {
        $user = AuthMiddleware::authenticate($request);
        AuthMiddleware::requireInstructor($request);
        $instructor = $this->getInstructor($user);

        $pdo = Database::getPdo();
        $stmt = $pdo->prepare('
            SELECT c.*, COUNT(DISTINCT e.id) AS enrollmentCount
            FROM courses c
            LEFT JOIN enrollments e ON e.courseId = c.id
            WHERE c.instructorId = ?
            GROUP BY c.id
            ORDER BY c.createdAt DESC
        ');
        $stmt->execute([$instructor['id']]);
        $courses = $stmt->fetchAll();

        Response::success($courses);
    }

    public function createInstructorCourse(Request $request): void
    {
        $user = AuthMiddleware::authenticate($request);
        AuthMiddleware::requireInstructor($request);
        $instructor = $this->getInstructor($user);

        $body = $request->getBody();
        $title = trim((string)($body['title'] ?? ''));
        $category = trim((string)($body['category'] ?? 'Varmakalai'));
        $level = trim((string)($body['level'] ?? 'Beginner'));
        $price = (float)($body['price'] ?? 0);
        $isFree = !empty($body['isFree']) || $price <= 0;
        $description = trim((string)($body['description'] ?? ''));
        $slug = Utils::slugify($title ?: 'course-' . time());

        if (empty($title)) {
            Response::error('Title is required');
        }

        $courseId = Utils::generateUuid();
        $pdo = Database::getPdo();

        $stmt = $pdo->prepare('
            INSERT INTO courses (
                id, title, slug, subtitle, description, longDescription, thumbnailUrl,
                category, level, duration, price, isFree, certificateEnabled, status, instructorId, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, "DRAFT", ?, NOW(), NOW())
        ');
        $stmt->execute([
            $courseId,
            $title,
            $slug,
            $body['subtitle'] ?? null,
            $description,
            $body['longDescription'] ?? null,
            $body['thumbnailUrl'] ?? null,
            $category,
            $level,
            $body['duration'] ?? '4 Weeks',
            $price,
            $isFree ? 1 : 0,
            $instructor['id'],
        ]);

        Response::success(['id' => $courseId, 'title' => $title, 'slug' => $slug]);
    }

    public function updateInstructorCourse(Request $request): void
    {
        $user = AuthMiddleware::authenticate($request);
        AuthMiddleware::requireInstructor($request);
        $instructor = $this->getInstructor($user);
        $courseId = $request->getParam('id');

        $pdo = Database::getPdo();
        $checkStmt = $pdo->prepare('SELECT id FROM courses WHERE id = ? AND instructorId = ? LIMIT 1');
        $checkStmt->execute([$courseId, $instructor['id']]);
        if (!$checkStmt->fetch()) {
            Response::notFound('Course not found or permission denied');
        }

        $body = $request->getBody();
        $fields = [];
        $params = [];

        foreach (['title', 'subtitle', 'description', 'longDescription', 'thumbnailUrl', 'category', 'level', 'duration', 'status'] as $key) {
            if (isset($body[$key])) {
                $fields[] = "`{$key}` = ?";
                $params[] = $body[$key];
            }
        }

        if (isset($body['price'])) {
            $fields[] = '`price` = ?';
            $params[] = (float)$body['price'];
        }

        if (isset($body['isFree'])) {
            $fields[] = '`isFree` = ?';
            $params[] = !empty($body['isFree']) ? 1 : 0;
        }

        if (empty($fields)) {
            Response::success(['message' => 'No fields to update']);
            return;
        }

        $params[] = $courseId;
        $sql = 'UPDATE courses SET ' . implode(', ', $fields) . ', updatedAt = NOW() WHERE id = ?';
        $pdo->prepare($sql)->execute($params);

        Response::success(['message' => 'Course updated successfully']);
    }

    public function deleteInstructorCourse(Request $request): void
    {
        $user = AuthMiddleware::authenticate($request);
        AuthMiddleware::requireInstructor($request);
        $instructor = $this->getInstructor($user);
        $courseId = $request->getParam('id');

        $pdo = Database::getPdo();
        $stmt = $pdo->prepare('DELETE FROM courses WHERE id = ? AND instructorId = ?');
        $stmt->execute([$courseId, $instructor['id']]);

        Response::success(['message' => 'Course deleted successfully']);
    }

    public function getInstructorStudents(Request $request): void
    {
        $user = AuthMiddleware::authenticate($request);
        AuthMiddleware::requireInstructor($request);
        $instructor = $this->getInstructor($user);

        $pdo = Database::getPdo();
        $stmt = $pdo->prepare('
            SELECT 
                u.id AS userId, u.name, u.email, u.phone,
                e.id AS enrollmentId, e.status AS enrollmentStatus, e.enrolledAt, e.completedAt,
                c.id AS courseId, c.title AS courseTitle
            FROM enrollments e
            JOIN courses c ON c.id = e.courseId
            JOIN users u ON u.id = e.userId
            WHERE c.instructorId = ?
            ORDER BY e.enrolledAt DESC
        ');
        $stmt->execute([$instructor['id']]);
        $students = $stmt->fetchAll();

        Response::success($students);
    }

    public function updateInstructorStudentStatus(Request $request): void
    {
        $user = AuthMiddleware::authenticate($request);
        AuthMiddleware::requireInstructor($request);
        $instructor = $this->getInstructor($user);
        $enrollmentId = $request->getParam('id');
        $status = $request->getBody('status');

        if (!in_array($status, ['ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED'], true)) {
            Response::error('Invalid enrollment status');
        }

        $pdo = Database::getPdo();
        $stmt = $pdo->prepare('
            UPDATE enrollments e
            JOIN courses c ON c.id = e.courseId
            SET e.status = ?, e.updatedAt = NOW()
            WHERE e.id = ? AND c.instructorId = ?
        ');
        $stmt->execute([$status, $enrollmentId, $instructor['id']]);

        Response::success(['message' => 'Student status updated']);
    }
}
