<?php
declare(strict_types=1);

namespace Jadmaa\Modules\Admin;

use Jadmaa\Core\Request;
use Jadmaa\Core\Response;
use Jadmaa\Core\Utils;
use Jadmaa\Config\Database;
use Jadmaa\Middleware\AuthMiddleware;
use PDO;

class AdminController
{
    private function logAudit(Request $request, string $action, string $entityType, ?string $entityId = null, mixed $metadata = null): void
    {
        try {
            $user = $request->user;
            $pdo = Database::getPdo();
            $stmt = $pdo->prepare('
                INSERT INTO audit_logs (id, actorUserId, action, entityType, entityId, metadata, ipAddress, userAgent, createdAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ');
            $stmt->execute([
                Utils::generateUuid(),
                $user['id'] ?? null,
                $action,
                $entityType,
                $entityId,
                $metadata ? (is_string($metadata) ? $metadata : json_encode($metadata)) : null,
                $_SERVER['REMOTE_ADDR'] ?? null,
                $_SERVER['HTTP_USER_AGENT'] ?? null,
            ]);
        } catch (\Throwable) {}
    }

    // ==========================================
    // 1. DASHBOARD & STATS
    // ==========================================

    public function getDashboardStats(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $pdo = Database::getPdo();

        $totalStudents = (int)$pdo->query('SELECT COUNT(*) FROM users WHERE role = "STUDENT"')->fetchColumn();
        $activeStudents = (int)$pdo->query('SELECT COUNT(*) FROM users WHERE role = "STUDENT" AND isActive = 1')->fetchColumn();
        $totalInstructors = (int)$pdo->query('SELECT COUNT(*) FROM users WHERE role = "INSTRUCTOR"')->fetchColumn();
        $publishedCourses = (int)$pdo->query('SELECT COUNT(*) FROM courses WHERE status = "PUBLISHED"')->fetchColumn();
        $draftCourses = (int)$pdo->query('SELECT COUNT(*) FROM courses WHERE status = "DRAFT"')->fetchColumn();

        $totalEnrollments = (int)$pdo->query('SELECT COUNT(*) FROM enrollments')->fetchColumn();
        $completedCourses = (int)$pdo->query('SELECT COUNT(*) FROM enrollments WHERE status = "COMPLETED"')->fetchColumn();
        $certificatesIssued = (int)$pdo->query('SELECT COUNT(*) FROM certificates WHERE status = "ISSUED"')->fetchColumn();

        $successfulPayments = (int)$pdo->query('SELECT COUNT(*) FROM payments WHERE status = "SUCCESS"')->fetchColumn();
        $pendingPayments = (int)$pdo->query('SELECT COUNT(*) FROM payments WHERE status = "PENDING"')->fetchColumn();

        $sumSuccess = (float)($pdo->query('SELECT SUM(amount) FROM payments WHERE status = "SUCCESS"')->fetchColumn() ?: 0.0);
        $sumRefund = (float)($pdo->query('SELECT SUM(amount) FROM payments WHERE status = "REFUNDED"')->fetchColumn() ?: 0.0);
        $totalRevenue = max(0.0, $sumSuccess - $sumRefund);

        Response::success([
            'totalStudents' => $totalStudents,
            'activeStudents' => $activeStudents,
            'totalInstructors' => $totalInstructors,
            'publishedCourses' => $publishedCourses,
            'draftCourses' => $draftCourses,
            'totalEnrollments' => $totalEnrollments,
            'completedCourses' => $completedCourses,
            'certificatesIssued' => $certificatesIssued,
            'successfulPayments' => $successfulPayments,
            'pendingPayments' => $pendingPayments,
            'totalRevenue' => $totalRevenue,
        ]);
    }

    public function getAnalytics(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        Response::success([
            'enrollmentsOverTime' => [],
            'revenueOverTime' => [],
            'courseCompletionRate' => 0
        ]);
    }

    // ==========================================
    // 2. STUDENTS
    // ==========================================

    public function getStudents(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $pdo = Database::getPdo();
        $search = $request->getQuery('search');
        $status = $request->getQuery('status');

        $sql = '
            SELECT u.id, u.name, u.email, u.phone, u.role, u.isActive, u.createdAt, u.lastLoginAt,
                   COUNT(DISTINCT e.id) AS enrollmentCount
            FROM users u
            LEFT JOIN enrollments e ON e.userId = u.id
            WHERE u.role = "STUDENT"
        ';
        $params = [];

        if (!empty($search)) {
            $sql .= ' AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)';
            $params[] = "%{$search}%";
            $params[] = "%{$search}%";
            $params[] = "%{$search}%";
        }

        if ($status === 'active') {
            $sql .= ' AND u.isActive = 1';
        } elseif ($status === 'inactive') {
            $sql .= ' AND u.isActive = 0';
        }

        $sql .= ' GROUP BY u.id ORDER BY u.createdAt DESC';

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $students = $stmt->fetchAll();

        Response::success($students);
    }

    public function getStudentById(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $id = $request->getParam('id');
        $pdo = Database::getPdo();

        $stmt = $pdo->prepare('SELECT id, name, email, phone, role, isActive, createdAt, lastLoginAt FROM users WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $user = $stmt->fetch();

        if (!$user) {
            Response::notFound('Student not found');
        }

        $enrStmt = $pdo->prepare('
            SELECT e.*, c.title AS courseTitle, c.slug AS courseSlug
            FROM enrollments e
            JOIN courses c ON c.id = e.courseId
            WHERE e.userId = ?
        ');
        $enrStmt->execute([$id]);
        $user['enrollments'] = $enrStmt->fetchAll();

        Response::success($user);
    }

    public function updateStudentStatus(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $id = $request->getParam('id');
        $body = $request->getBody();
        $isActive = !empty($body['isActive']);

        $pdo = Database::getPdo();
        $pdo->prepare('UPDATE users SET isActive = ?, updatedAt = NOW() WHERE id = ?')
            ->execute([$isActive ? 1 : 0, $id]);

        $this->logAudit($request, $isActive ? 'ACTIVATE_STUDENT' : 'DEACTIVATE_STUDENT', 'User', $id);
        Response::success(['id' => $id, 'isActive' => $isActive]);
    }

    // ==========================================
    // 3. INSTRUCTORS
    // ==========================================

    public function getInstructors(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $pdo = Database::getPdo();

        $stmt = $pdo->query('
            SELECT i.*, u.name, u.email, u.phone, COUNT(DISTINCT c.id) AS courseCount
            FROM instructors i
            JOIN users u ON u.id = i.userId
            LEFT JOIN courses c ON c.instructorId = i.id
            GROUP BY i.id
            ORDER BY i.createdAt DESC
        ');
        Response::success($stmt->fetchAll());
    }

    public function getInstructorById(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $id = $request->getParam('id');
        $pdo = Database::getPdo();

        $stmt = $pdo->prepare('
            SELECT i.*, u.name, u.email, u.phone
            FROM instructors i
            JOIN users u ON u.id = i.userId
            WHERE i.id = ? LIMIT 1
        ');
        $stmt->execute([$id]);
        $inst = $stmt->fetch();

        if (!$inst) {
            Response::notFound('Instructor not found');
        }

        $crsStmt = $pdo->prepare('SELECT id, title, slug, price, status FROM courses WHERE instructorId = ?');
        $crsStmt->execute([$id]);
        $inst['courses'] = $crsStmt->fetchAll();

        Response::success($inst);
    }

    public function createInstructor(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $body = $request->getBody();

        $name = trim((string)($body['name'] ?? ''));
        $email = strtolower(trim((string)($body['email'] ?? '')));
        $password = (string)($body['password'] ?? 'Instructor@123');

        if (empty($name) || empty($email)) {
            Response::error('Name and email are required');
        }

        $pdo = Database::getPdo();

        // Check if user exists
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        $existing = $stmt->fetch();

        $userId = $existing['id'] ?? Utils::generateUuid();

        if (!$existing) {
            $hash = password_hash($password, PASSWORD_BCRYPT);
            $pdo->prepare('
                INSERT INTO users (id, name, email, phone, passwordHash, role, isActive, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, "INSTRUCTOR", 1, NOW(), NOW())
            ')->execute([$userId, $name, $email, $body['phone'] ?? null, $hash]);
        } else {
            $pdo->prepare('UPDATE users SET role = "INSTRUCTOR", updatedAt = NOW() WHERE id = ?')
                ->execute([$userId]);
        }

        $instId = Utils::generateUuid();
        $pdo->prepare('
            INSERT INTO instructors (id, userId, displayName, title, bio, specialization, experience, avatarUrl, isActive, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
            ON DUPLICATE KEY UPDATE displayName = VALUES(displayName), title = VALUES(title), updatedAt = NOW()
        ')->execute([
            $instId,
            $userId,
            $name,
            $body['title'] ?? 'Instructor',
            $body['bio'] ?? null,
            $body['specialization'] ?? null,
            $body['experience'] ?? null,
            $body['avatarUrl'] ?? null,
        ]);

        Response::success(['id' => $instId, 'userId' => $userId, 'name' => $name]);
    }

    public function updateInstructor(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $id = $request->getParam('id');
        $body = $request->getBody();

        $pdo = Database::getPdo();
        $stmt = $pdo->prepare('
            UPDATE instructors 
            SET displayName = ?, title = ?, bio = ?, specialization = ?, experience = ?, avatarUrl = ?, updatedAt = NOW()
            WHERE id = ?
        ');
        $stmt->execute([
            $body['displayName'] ?? '',
            $body['title'] ?? null,
            $body['bio'] ?? null,
            $body['specialization'] ?? null,
            $body['experience'] ?? null,
            $body['avatarUrl'] ?? null,
            $id
        ]);

        Response::success(['message' => 'Instructor updated']);
    }

    public function updateInstructorStatus(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $id = $request->getParam('id');
        $isActive = !empty($request->getBody('isActive'));

        $pdo = Database::getPdo();
        $pdo->prepare('UPDATE instructors SET isActive = ?, updatedAt = NOW() WHERE id = ?')
            ->execute([$isActive ? 1 : 0, $id]);

        Response::success(['id' => $id, 'isActive' => $isActive]);
    }

    public function getInstructorApplications(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $pdo = Database::getPdo();
        $stmt = $pdo->query('SELECT `key`, `value` FROM system_settings WHERE `key` LIKE "instructor_app_%"');
        $rows = $stmt->fetchAll();

        $apps = [];
        foreach ($rows as $r) {
            $data = json_decode($r['value'], true);
            if (is_array($data)) {
                $apps[] = $data;
            }
        }
        Response::success($apps);
    }

    public function approveInstructorApplication(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $userId = $request->getBody('userId');

        if (empty($userId)) {
            Response::error('User ID is required');
        }

        $pdo = Database::getPdo();
        $pdo->beginTransaction();
        try {
            $pdo->prepare('UPDATE users SET role = "INSTRUCTOR", updatedAt = NOW() WHERE id = ?')
                ->execute([$userId]);

            // Retrieve app details
            $appKey = "instructor_app_{$userId}";
            $appStmt = $pdo->prepare('SELECT `value` FROM system_settings WHERE `key` = ? LIMIT 1');
            $appStmt->execute([$appKey]);
            $raw = $appStmt->fetchColumn();
            $app = $raw ? json_decode($raw, true) : [];

            $instId = Utils::generateUuid();
            $pdo->prepare('
                INSERT INTO instructors (id, userId, displayName, title, bio, specialization, experience, isActive, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
                ON DUPLICATE KEY UPDATE isActive = 1, updatedAt = NOW()
            ')->execute([
                $instId,
                $userId,
                $app['name'] ?? 'Instructor',
                $app['title'] ?? 'Instructor',
                $app['bio'] ?? null,
                $app['specialization'] ?? null,
                $app['experience'] ?? null,
            ]);

            // Set notification flag
            $noticeKey = "instructor_approved_notice_{$userId}";
            $pdo->prepare('
                INSERT INTO system_settings (id, `key`, `value`, updatedAt)
                VALUES (?, ?, "UNNOTIFIED", NOW())
                ON DUPLICATE KEY UPDATE `value` = "UNNOTIFIED", updatedAt = NOW()
            ')->execute([Utils::generateUuid(), $noticeKey]);

            // Mark app approved
            if ($raw) {
                $app['status'] = 'APPROVED';
                $pdo->prepare('UPDATE system_settings SET `value` = ? WHERE `key` = ?')
                    ->execute([json_encode($app), $appKey]);
            }

            $pdo->commit();
            Response::success(['message' => 'Instructor approved successfully']);
        } catch (\Throwable $e) {
            $pdo->rollBack();
            Response::serverError('Failed to approve application');
        }
    }

    public function rejectInstructorApplication(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $userId = $request->getBody('userId');
        $reason = $request->getBody('reason');

        $pdo = Database::getPdo();
        $appKey = "instructor_app_{$userId}";
        $stmt = $pdo->prepare('SELECT `value` FROM system_settings WHERE `key` = ? LIMIT 1');
        $stmt->execute([$appKey]);
        $raw = $stmt->fetchColumn();

        if ($raw) {
            $app = json_decode($raw, true);
            $app['status'] = 'REJECTED';
            $app['rejectReason'] = $reason;
            $pdo->prepare('UPDATE system_settings SET `value` = ? WHERE `key` = ?')
                ->execute([json_encode($app), $appKey]);
        }

        Response::success(['message' => 'Application rejected']);
    }

    // ==========================================
    // 4. COURSES ADMIN
    // ==========================================

    public function getCourses(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $pdo = Database::getPdo();

        $stmt = $pdo->query('
            SELECT c.*, i.displayName AS instructorName, COUNT(DISTINCT e.id) AS enrollmentCount
            FROM courses c
            JOIN instructors i ON i.id = c.instructorId
            LEFT JOIN enrollments e ON e.courseId = c.id
            GROUP BY c.id
            ORDER BY c.createdAt DESC
        ');
        $courses = $stmt->fetchAll();

        $result = array_map(function ($c) {
            $c['price'] = (float)$c['price'];
            $c['isFree'] = (bool)$c['isFree'];
            $c['certificateEnabled'] = (bool)$c['certificateEnabled'];
            $c['enrollmentCount'] = (int)$c['enrollmentCount'];
            return $c;
        }, $courses);

        Response::success($result);
    }

    public function getCourseById(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $id = $request->getParam('id');
        $pdo = Database::getPdo();

        $stmt = $pdo->prepare('SELECT * FROM courses WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $course = $stmt->fetch();

        if (!$course) {
            Response::notFound('Course not found');
        }

        // Fetch modules with lessons
        $modStmt = $pdo->prepare('SELECT * FROM course_modules WHERE courseId = ? ORDER BY sortOrder ASC');
        $modStmt->execute([$id]);
        $modules = $modStmt->fetchAll();

        foreach ($modules as &$mod) {
            $lesStmt = $pdo->prepare('SELECT * FROM lessons WHERE moduleId = ? ORDER BY sortOrder ASC');
            $lesStmt->execute([$mod['id']]);
            $mod['lessons'] = $lesStmt->fetchAll();
        }

        $course['modules'] = $modules;
        $course['price'] = (float)$course['price'];
        $course['isFree'] = (bool)$course['isFree'];

        Response::success($course);
    }

    public function createCourse(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $body = $request->getBody();

        $title = trim((string)($body['title'] ?? ''));
        $instructorId = trim((string)($body['instructorId'] ?? ''));
        $price = (float)($body['price'] ?? 0);
        $isFree = !empty($body['isFree']) || $price <= 0;

        if (empty($title) || empty($instructorId)) {
            Response::error('Title and instructor are required');
        }

        $slug = Utils::slugify($body['slug'] ?? ($title . '-' . time()));
        $id = Utils::generateUuid();

        $pdo = Database::getPdo();
        $stmt = $pdo->prepare('
            INSERT INTO courses (
                id, title, slug, subtitle, description, longDescription, thumbnailUrl,
                category, level, duration, price, isFree, certificateEnabled, status, instructorId, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "DRAFT", ?, NOW(), NOW())
        ');
        $stmt->execute([
            $id,
            $title,
            $slug,
            $body['subtitle'] ?? null,
            $body['description'] ?? '',
            $body['longDescription'] ?? null,
            $body['thumbnailUrl'] ?? null,
            $body['category'] ?? 'Varmakalai',
            $body['level'] ?? 'Beginner',
            $body['duration'] ?? '4 Weeks',
            $price,
            $isFree ? 1 : 0,
            isset($body['certificateEnabled']) ? (!empty($body['certificateEnabled']) ? 1 : 0) : 1,
            $instructorId,
        ]);

        Response::success(['id' => $id, 'title' => $title, 'slug' => $slug]);
    }

    public function updateCourse(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $id = $request->getParam('id');
        $body = $request->getBody();

        $pdo = Database::getPdo();
        $fields = [];
        $params = [];

        foreach (['title', 'subtitle', 'description', 'longDescription', 'thumbnailUrl', 'category', 'level', 'duration', 'instructorId', 'status'] as $k) {
            if (isset($body[$k])) {
                $fields[] = "`{$k}` = ?";
                $params[] = $body[$k];
            }
        }

        if (isset($body['slug'])) {
            $fields[] = '`slug` = ?';
            $params[] = Utils::slugify($body['slug']);
        }

        if (isset($body['price'])) {
            $fields[] = '`price` = ?';
            $params[] = (float)$body['price'];
        }

        foreach (['isFree', 'certificateEnabled'] as $bk) {
            if (isset($body[$bk])) {
                $fields[] = "`{$bk}` = ?";
                $params[] = !empty($body[$bk]) ? 1 : 0;
            }
        }

        if (empty($fields)) {
            Response::success(['message' => 'No changes made']);
            return;
        }

        $params[] = $id;
        $sql = 'UPDATE courses SET ' . implode(', ', $fields) . ', updatedAt = NOW() WHERE id = ?';
        $pdo->prepare($sql)->execute($params);

        Response::success(['message' => 'Course updated successfully']);
    }

    public function deleteCourse(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $id = $request->getParam('id');
        $pdo = Database::getPdo();
        $pdo->prepare('DELETE FROM courses WHERE id = ?')->execute([$id]);
        Response::success(['message' => 'Course deleted successfully']);
    }

    public function publishCourse(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $id = $request->getParam('id');
        $pdo = Database::getPdo();
        $pdo->prepare('UPDATE courses SET status = "PUBLISHED", publishedAt = NOW(), updatedAt = NOW() WHERE id = ?')
            ->execute([$id]);
        Response::success(['message' => 'Course published successfully']);
    }

    public function unpublishCourse(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $id = $request->getParam('id');
        $pdo = Database::getPdo();
        $pdo->prepare('UPDATE courses SET status = "DRAFT", updatedAt = NOW() WHERE id = ?')
            ->execute([$id]);
        Response::success(['message' => 'Course unpublished successfully']);
    }

    public function updateCourseAvailability(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $id = $request->getParam('id');
        $isAvailable = !empty($request->getBody('isAvailable'));

        $pdo = Database::getPdo();
        $key = "course_available_{$id}";
        $pdo->prepare('
            INSERT INTO system_settings (id, `key`, `value`, updatedAt)
            VALUES (?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), updatedAt = NOW()
        ')->execute([Utils::generateUuid(), $key, $isAvailable ? 'true' : 'false']);

        Response::success(['id' => $id, 'isAvailable' => $isAvailable]);
    }

    // ==========================================
    // 5. MODULES & LESSONS
    // ==========================================

    public function createModule(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $body = $request->getBody();
        $courseId = trim((string)($body['courseId'] ?? ''));
        $title = trim((string)($body['title'] ?? ''));

        if (empty($courseId) || empty($title)) {
            Response::error('Course ID and title are required');
        }

        $id = Utils::generateUuid();
        $pdo = Database::getPdo();
        $pdo->prepare('
            INSERT INTO course_modules (id, courseId, title, description, sortOrder, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        ')->execute([$id, $courseId, $title, $body['description'] ?? null, (int)($body['sortOrder'] ?? 0)]);

        Response::success(['id' => $id, 'title' => $title]);
    }

    public function updateModule(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $id = $request->getParam('id');
        $body = $request->getBody();

        $pdo = Database::getPdo();
        $pdo->prepare('UPDATE course_modules SET title = ?, description = ?, sortOrder = ?, updatedAt = NOW() WHERE id = ?')
            ->execute([$body['title'] ?? '', $body['description'] ?? null, (int)($body['sortOrder'] ?? 0), $id]);

        Response::success(['message' => 'Module updated']);
    }

    public function deleteModule(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $id = $request->getParam('id');
        $pdo = Database::getPdo();
        $pdo->prepare('DELETE FROM course_modules WHERE id = ?')->execute([$id]);
        Response::success(['message' => 'Module deleted']);
    }

    public function createLesson(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $body = $request->getBody();
        $moduleId = trim((string)($body['moduleId'] ?? ''));
        $title = trim((string)($body['title'] ?? ''));

        if (empty($moduleId) || empty($title)) {
            Response::error('Module ID and title are required');
        }

        $id = Utils::generateUuid();
        $pdo = Database::getPdo();
        $pdo->prepare('
            INSERT INTO lessons (id, moduleId, title, description, youtubeVideoId, durationSeconds, sortOrder, isPreview, isRequired, isPublished, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ')->execute([
            $id,
            $moduleId,
            $title,
            $body['description'] ?? null,
            $body['youtubeVideoId'] ?? null,
            (int)($body['durationSeconds'] ?? 0),
            (int)($body['sortOrder'] ?? 0),
            !empty($body['isPreview']) ? 1 : 0,
            isset($body['isRequired']) ? (!empty($body['isRequired']) ? 1 : 0) : 1,
            isset($body['isPublished']) ? (!empty($body['isPublished']) ? 1 : 0) : 1,
        ]);

        Response::success(['id' => $id, 'title' => $title]);
    }

    public function updateLesson(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $id = $request->getParam('id');
        $body = $request->getBody();

        $pdo = Database::getPdo();
        $fields = [];
        $params = [];

        foreach (['title', 'description', 'youtubeVideoId'] as $k) {
            if (isset($body[$k])) {
                $fields[] = "`{$k}` = ?";
                $params[] = $body[$k];
            }
        }

        foreach (['durationSeconds', 'sortOrder'] as $ik) {
            if (isset($body[$ik])) {
                $fields[] = "`{$ik}` = ?";
                $params[] = (int)$body[$ik];
            }
        }

        foreach (['isPreview', 'isRequired', 'isPublished'] as $bk) {
            if (isset($body[$bk])) {
                $fields[] = "`{$bk}` = ?";
                $params[] = !empty($body[$bk]) ? 1 : 0;
            }
        }

        if (empty($fields)) {
            Response::success(['message' => 'No changes made']);
            return;
        }

        $params[] = $id;
        $sql = 'UPDATE lessons SET ' . implode(', ', $fields) . ', updatedAt = NOW() WHERE id = ?';
        $pdo->prepare($sql)->execute($params);

        Response::success(['message' => 'Lesson updated']);
    }

    public function deleteLesson(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $id = $request->getParam('id');
        $pdo = Database::getPdo();
        $pdo->prepare('DELETE FROM lessons WHERE id = ?')->execute([$id]);
        Response::success(['message' => 'Lesson deleted']);
    }

    // ==========================================
    // 6. ENROLLMENTS & PAYMENTS
    // ==========================================

    public function getEnrollments(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $pdo = Database::getPdo();

        $stmt = $pdo->query('
            SELECT e.*, u.name AS userName, u.email AS userEmail, c.title AS courseTitle
            FROM enrollments e
            JOIN users u ON u.id = e.userId
            JOIN courses c ON c.id = e.courseId
            ORDER BY e.enrolledAt DESC
        ');
        Response::success($stmt->fetchAll());
    }

    public function getEnrollmentById(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $id = $request->getParam('id');
        $pdo = Database::getPdo();

        $stmt = $pdo->prepare('
            SELECT e.*, u.name AS userName, u.email AS userEmail, c.title AS courseTitle
            FROM enrollments e
            JOIN users u ON u.id = e.userId
            JOIN courses c ON c.id = e.courseId
            WHERE e.id = ? LIMIT 1
        ');
        $stmt->execute([$id]);
        $enr = $stmt->fetch();

        if (!$enr) {
            Response::notFound('Enrollment not found');
        }

        Response::success($enr);
    }

    public function getPayments(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $pdo = Database::getPdo();

        $stmt = $pdo->query('
            SELECT p.*, u.name AS userName, u.email AS userEmail, c.title AS courseTitle
            FROM payments p
            JOIN users u ON u.id = p.userId
            LEFT JOIN courses c ON c.id = p.courseId
            ORDER BY p.createdAt DESC
        ');
        $payments = $stmt->fetchAll();

        $result = array_map(function ($p) {
            $p['amount'] = (float)$p['amount'];
            return $p;
        }, $payments);

        Response::success($result);
    }

    public function getPaymentById(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $id = $request->getParam('id');
        $pdo = Database::getPdo();

        $stmt = $pdo->prepare('
            SELECT p.*, u.name AS userName, u.email AS userEmail, c.title AS courseTitle
            FROM payments p
            JOIN users u ON u.id = p.userId
            LEFT JOIN courses c ON c.id = p.courseId
            WHERE p.id = ? LIMIT 1
        ');
        $stmt->execute([$id]);
        $payment = $stmt->fetch();

        if (!$payment) {
            Response::notFound('Payment not found');
        }

        $payment['amount'] = (float)$payment['amount'];
        Response::success($payment);
    }

    public function refundPayment(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $id = $request->getParam('id');
        $pdo = Database::getPdo();

        $pdo->prepare('UPDATE payments SET status = "REFUNDED", updatedAt = NOW() WHERE id = ?')
            ->execute([$id]);

        $this->logAudit($request, 'REFUND_PAYMENT', 'Payment', $id);
        Response::success(['message' => 'Payment marked as refunded']);
    }

    // ==========================================
    // 7. CERTIFICATES
    // ==========================================

    public function getCertificates(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $pdo = Database::getPdo();

        $stmt = $pdo->query('
            SELECT cert.*, u.name AS userName, u.email AS userEmail, c.title AS courseTitle
            FROM certificates cert
            JOIN users u ON u.id = cert.userId
            JOIN courses c ON c.id = cert.courseId
            ORDER BY cert.issuedAt DESC
        ');
        Response::success($stmt->fetchAll());
    }

    public function getCertificateById(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $id = $request->getParam('id');
        $pdo = Database::getPdo();

        $stmt = $pdo->prepare('
            SELECT cert.*, u.name AS userName, u.email AS userEmail, c.title AS courseTitle
            FROM certificates cert
            JOIN users u ON u.id = cert.userId
            JOIN courses c ON c.id = cert.courseId
            WHERE cert.id = ? LIMIT 1
        ');
        $stmt->execute([$id]);
        $cert = $stmt->fetch();

        if (!$cert) {
            Response::notFound('Certificate not found');
        }

        Response::success($cert);
    }

    public function revokeCertificate(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $id = $request->getParam('id');
        $pdo = Database::getPdo();

        $pdo->prepare('UPDATE certificates SET status = "REVOKED" WHERE id = ?')->execute([$id]);
        $this->logAudit($request, 'REVOKE_CERTIFICATE', 'Certificate', $id);
        Response::success(['message' => 'Certificate revoked']);
    }

    // ==========================================
    // 8. ENQUIRIES
    // ==========================================

    public function submitPublicEnquiry(Request $request): void
    {
        $body = $request->getBody();
        $name = trim((string)($body['name'] ?? ''));
        $email = trim((string)($body['email'] ?? ''));
        $message = trim((string)($body['message'] ?? ''));

        if (empty($name) || empty($email) || empty($message)) {
            Response::error('Name, email, and message are required');
        }

        $id = Utils::generateUuid();
        $pdo = Database::getPdo();
        $stmt = $pdo->prepare('
            INSERT INTO enquiries (id, name, email, phone, subject, message, status, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, "NEW", NOW(), NOW())
        ');
        $stmt->execute([
            $id,
            $name,
            $email,
            $body['phone'] ?? null,
            $body['subject'] ?? 'General Enquiry',
            $message,
        ]);

        Response::success(['id' => $id, 'message' => 'Enquiry submitted successfully']);
    }

    public function getEnquiries(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $pdo = Database::getPdo();
        $stmt = $pdo->query('SELECT * FROM enquiries ORDER BY createdAt DESC');
        Response::success($stmt->fetchAll());
    }

    public function getEnquiryById(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $id = $request->getParam('id');
        $pdo = Database::getPdo();
        $stmt = $pdo->prepare('SELECT * FROM enquiries WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $enq = $stmt->fetch();

        if (!$enq) {
            Response::notFound('Enquiry not found');
        }

        Response::success($enq);
    }

    public function updateEnquiryStatus(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $id = $request->getParam('id');
        $status = $request->getBody('status');

        $pdo = Database::getPdo();
        $pdo->prepare('UPDATE enquiries SET status = ?, updatedAt = NOW() WHERE id = ?')->execute([$status, $id]);
        Response::success(['message' => 'Status updated']);
    }

    public function deleteEnquiry(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $id = $request->getParam('id');
        $pdo = Database::getPdo();
        $pdo->prepare('DELETE FROM enquiries WHERE id = ?')->execute([$id]);
        Response::success(['message' => 'Enquiry deleted']);
    }

    // ==========================================
    // 9. ADMINISTRATORS (Super Admin)
    // ==========================================

    public function getAdministrators(Request $request): void
    {
        AuthMiddleware::requireSuperAdmin($request);
        $pdo = Database::getPdo();
        $stmt = $pdo->query('SELECT id, name, email, phone, role, isActive, isAdmin, createdAt, lastLoginAt FROM users WHERE role IN ("ADMIN", "SUPER_ADMIN")');
        Response::success($stmt->fetchAll());
    }

    public function createAdministrator(Request $request): void
    {
        AuthMiddleware::requireSuperAdmin($request);
        $body = $request->getBody();

        $name = trim((string)($body['name'] ?? ''));
        $email = strtolower(trim((string)($body['email'] ?? '')));
        $password = (string)($body['password'] ?? '');

        if (empty($name) || empty($email) || empty($password)) {
            Response::error('Name, email, and password are required');
        }

        $id = Utils::generateUuid();
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $role = ($body['role'] ?? '') === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN';

        $pdo = Database::getPdo();
        $stmt = $pdo->prepare('
            INSERT INTO users (id, name, email, phone, passwordHash, role, isActive, isAdmin, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, 1, 1, NOW(), NOW())
        ');
        $stmt->execute([$id, $name, $email, $body['phone'] ?? null, $hash, $role]);

        $this->logAudit($request, 'CREATE_ADMIN', 'User', $id);
        Response::success(['id' => $id, 'name' => $name, 'email' => $email]);
    }

    public function updateAdministrator(Request $request): void
    {
        AuthMiddleware::requireSuperAdmin($request);
        $id = $request->getParam('id');
        $body = $request->getBody();

        $pdo = Database::getPdo();
        $fields = [];
        $params = [];

        if (isset($body['name'])) {
            $fields[] = 'name = ?';
            $params[] = $body['name'];
        }
        if (isset($body['phone'])) {
            $fields[] = 'phone = ?';
            $params[] = $body['phone'];
        }
        if (isset($body['role']) && in_array($body['role'], ['ADMIN', 'SUPER_ADMIN'])) {
            $fields[] = 'role = ?';
            $params[] = $body['role'];
        }
        if (!empty($body['password'])) {
            $fields[] = 'passwordHash = ?';
            $params[] = password_hash($body['password'], PASSWORD_BCRYPT);
        }

        if (empty($fields)) {
            Response::success(['message' => 'No changes made']);
            return;
        }

        $params[] = $id;
        $sql = 'UPDATE users SET ' . implode(', ', $fields) . ', updatedAt = NOW() WHERE id = ?';
        $pdo->prepare($sql)->execute($params);

        Response::success(['message' => 'Admin updated']);
    }

    public function updateAdministratorStatus(Request $request): void
    {
        AuthMiddleware::requireSuperAdmin($request);
        $id = $request->getParam('id');
        $isActive = !empty($request->getBody('isActive'));

        $pdo = Database::getPdo();
        $pdo->prepare('UPDATE users SET isActive = ?, updatedAt = NOW() WHERE id = ?')
            ->execute([$isActive ? 1 : 0, $id]);

        Response::success(['id' => $id, 'isActive' => $isActive]);
    }

    public function getAuditLogs(Request $request): void
    {
        AuthMiddleware::requireSuperAdmin($request);
        $pdo = Database::getPdo();
        $stmt = $pdo->query('
            SELECT a.*, u.name AS actorName, u.email AS actorEmail
            FROM audit_logs a
            LEFT JOIN users u ON u.id = a.actorUserId
            ORDER BY a.createdAt DESC
            LIMIT 100
        ');
        Response::success($stmt->fetchAll());
    }

    // ==========================================
    // 10. SYSTEM SETTINGS
    // ==========================================

    public function getSettings(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $pdo = Database::getPdo();
        $stmt = $pdo->query('SELECT `key`, `value`, description FROM system_settings');
        Response::success($stmt->fetchAll());
    }

    public function updateSettings(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $body = $request->getBody();
        $pdo = Database::getPdo();

        foreach ($body as $key => $val) {
            $strVal = is_bool($val) ? ($val ? 'true' : 'false') : (string)$val;
            $stmt = $pdo->prepare('
                INSERT INTO system_settings (id, `key`, `value`, updatedAt)
                VALUES (?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), updatedAt = NOW()
            ');
            $stmt->execute([Utils::generateUuid(), $key, $strVal]);
        }

        Response::success(['message' => 'Settings updated']);
    }
}
