<?php
declare(strict_types=1);

namespace Jadmaa\Modules\Progress;

use Jadmaa\Core\Request;
use Jadmaa\Core\Response;
use Jadmaa\Core\Utils;
use Jadmaa\Config\Database;
use Jadmaa\Middleware\AuthMiddleware;
use PDO;

class ProgressController
{
    public function getDashboard(Request $request): void
    {
        $user = AuthMiddleware::authenticate($request);
        $pdo = Database::getPdo();

        // Fetch enrollments with course details
        $stmt = $pdo->prepare('
            SELECT 
                e.id AS enrollmentId, e.status AS enrollmentStatus, e.enrolledAt, e.completedAt,
                c.id AS courseId, c.title, c.slug, c.thumbnailUrl, c.category, c.level, c.duration
            FROM enrollments e
            JOIN courses c ON c.id = e.courseId
            WHERE e.userId = ? AND e.status = "ACTIVE"
            ORDER BY e.enrolledAt DESC
        ');
        $stmt->execute([$user['id']]);
        $enrollments = $stmt->fetchAll();

        $enrolledData = [];
        $completedCoursesCount = 0;

        foreach ($enrollments as $enr) {
            // Count total and completed lessons
            $progStmt = $pdo->prepare('
                SELECT 
                    COUNT(l.id) AS totalLessons,
                    SUM(CASE WHEN lp.completed = 1 THEN 1 ELSE 0 END) AS completedLessons
                FROM course_modules m
                JOIN lessons l ON l.moduleId = m.id AND l.isPublished = 1
                LEFT JOIN lesson_progress lp ON lp.lessonId = l.id AND lp.userId = ?
                WHERE m.courseId = ?
            ');
            $progStmt->execute([$user['id'], $enr['courseId']]);
            $counts = $progStmt->fetch() ?: ['totalLessons' => 0, 'completedLessons' => 0];

            $total = (int)$counts['totalLessons'];
            $completed = (int)($counts['completedLessons'] ?? 0);
            $percentage = $total > 0 ? (int)round(($completed / $total) * 100) : 0;

            if ($percentage === 100) {
                $completedCoursesCount++;
            }

            $enrolledData[] = [
                'enrollmentId' => $enr['enrollmentId'],
                'enrolledAt' => $enr['enrolledAt'],
                'course' => [
                    'id' => $enr['courseId'],
                    'title' => $enr['title'],
                    'slug' => $enr['slug'],
                    'thumbnailUrl' => $enr['thumbnailUrl'],
                    'category' => $enr['category'],
                    'level' => $enr['level'],
                    'duration' => $enr['duration'],
                ],
                'progress' => [
                    'totalLessons' => $total,
                    'completedLessons' => $completed,
                    'percentage' => $percentage,
                ]
            ];
        }

        // Fetch certificates count
        $certStmt = $pdo->prepare('SELECT COUNT(*) FROM certificates WHERE userId = ? AND status = "ISSUED"');
        $certStmt->execute([$user['id']]);
        $certCount = (int)$certStmt->fetchColumn();

        Response::success([
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'avatarUrl' => $user['avatarUrl'],
            ],
            'stats' => [
                'activeEnrollments' => count($enrolledData),
                'completedCourses' => $completedCoursesCount,
                'certificates' => $certCount,
            ],
            'enrollments' => $enrolledData,
        ]);
    }

    public function getMyEnrollments(Request $request): void
    {
        $user = AuthMiddleware::authenticate($request);
        $pdo = Database::getPdo();

        $stmt = $pdo->prepare('
            SELECT 
                e.id AS enrollmentId, e.status AS enrollmentStatus, e.enrolledAt, e.completedAt,
                c.id AS courseId, c.title, c.slug, c.thumbnailUrl, c.category, c.level, c.duration
            FROM enrollments e
            JOIN courses c ON c.id = e.courseId
            WHERE e.userId = ? AND e.status = "ACTIVE"
            ORDER BY e.enrolledAt DESC
        ');
        $stmt->execute([$user['id']]);
        $rows = $stmt->fetchAll();

        $result = array_map(function ($r) use ($pdo, $user) {
            $progStmt = $pdo->prepare('
                SELECT 
                    COUNT(l.id) AS totalLessons,
                    SUM(CASE WHEN lp.completed = 1 THEN 1 ELSE 0 END) AS completedLessons
                FROM course_modules m
                JOIN lessons l ON l.moduleId = m.id AND l.isPublished = 1
                LEFT JOIN lesson_progress lp ON lp.lessonId = l.id AND lp.userId = ?
                WHERE m.courseId = ?
            ');
            $progStmt->execute([$user['id'], $r['courseId']]);
            $counts = $progStmt->fetch() ?: ['totalLessons' => 0, 'completedLessons' => 0];

            $total = (int)$counts['totalLessons'];
            $completed = (int)($counts['completedLessons'] ?? 0);
            $percentage = $total > 0 ? (int)round(($completed / $total) * 100) : 0;

            return [
                'id' => $r['enrollmentId'],
                'status' => $r['enrollmentStatus'],
                'enrolledAt' => $r['enrolledAt'],
                'completedAt' => $r['completedAt'],
                'course' => [
                    'id' => $r['courseId'],
                    'title' => $r['title'],
                    'slug' => $r['slug'],
                    'thumbnailUrl' => $r['thumbnailUrl'],
                    'category' => $r['category'],
                    'level' => $r['level'],
                    'duration' => $r['duration'],
                ],
                'progress' => [
                    'totalLessons' => $total,
                    'completedLessons' => $completed,
                    'percentage' => $percentage,
                ]
            ];
        }, $rows);

        Response::success($result);
    }

    public function getCourseProgress(Request $request): void
    {
        $user = AuthMiddleware::authenticate($request);
        $courseId = $request->getParam('courseId');

        if (empty($courseId)) {
            Response::error('Course ID is required');
        }

        $pdo = Database::getPdo();

        // Verify active enrollment or user is admin
        $enrStmt = $pdo->prepare('SELECT id, status FROM enrollments WHERE userId = ? AND courseId = ? LIMIT 1');
        $enrStmt->execute([$user['id'], $courseId]);
        $enrollment = $enrStmt->fetch();

        $isAdmin = (bool)($user['isAdmin'] ?? false) || in_array($user['role'], ['ADMIN', 'SUPER_ADMIN']);
        if (!$enrollment && !$isAdmin) {
            Response::forbidden('You are not enrolled in this course');
        }

        // Fetch lesson progresses
        $stmt = $pdo->prepare('
            SELECT lessonId, watchedSeconds, completed, completedAt, lastWatchedAt
            FROM lesson_progress
            WHERE userId = ? AND courseId = ?
        ');
        $stmt->execute([$user['id'], $courseId]);
        $progressRecords = $stmt->fetchAll();

        $progressMap = [];
        foreach ($progressRecords as $p) {
            $progressMap[$p['lessonId']] = [
                'watchedSeconds' => (int)$p['watchedSeconds'],
                'completed' => (bool)$p['completed'],
                'completedAt' => $p['completedAt'],
                'lastWatchedAt' => $p['lastWatchedAt'],
            ];
        }

        Response::success(['lessons' => $progressMap]);
    }

    public function updateLessonProgress(Request $request): void
    {
        $user = AuthMiddleware::authenticate($request);
        $lessonId = $request->getParam('lessonId');
        $body = $request->getBody();

        if (empty($lessonId)) {
            Response::error('Lesson ID is required');
        }

        $watchedSeconds = (int)($body['watchedSeconds'] ?? 0);
        $completed = !empty($body['completed']);

        $pdo = Database::getPdo();

        // Find lesson and parent course
        $stmt = $pdo->prepare('
            SELECT l.id, l.durationSeconds, m.courseId, c.certificateEnabled, c.title AS courseTitle
            FROM lessons l
            JOIN course_modules m ON m.id = l.moduleId
            JOIN courses c ON c.id = m.courseId
            WHERE l.id = ? LIMIT 1
        ');
        $stmt->execute([$lessonId]);
        $lesson = $stmt->fetch();

        if (!$lesson) {
            Response::notFound('Lesson not found');
        }

        $courseId = $lesson['courseId'];

        // Upsert lesson progress
        $upsertStmt = $pdo->prepare('
            INSERT INTO lesson_progress (id, userId, courseId, lessonId, watchedSeconds, completed, completedAt, lastWatchedAt, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())
            ON DUPLICATE KEY UPDATE 
                watchedSeconds = GREATEST(watchedSeconds, VALUES(watchedSeconds)),
                completed = IF(VALUES(completed) = 1, 1, completed),
                completedAt = IF(completedAt IS NULL AND VALUES(completed) = 1, NOW(), completedAt),
                lastWatchedAt = NOW(),
                updatedAt = NOW()
        ');
        $completedAt = $completed ? date('Y-m-d H:i:s') : null;
        $upsertStmt->execute([
            Utils::generateUuid(),
            $user['id'],
            $courseId,
            $lessonId,
            $watchedSeconds,
            $completed ? 1 : 0,
            $completedAt,
        ]);

        // Check if all required lessons are now completed
        $checkStmt = $pdo->prepare('
            SELECT 
                COUNT(l.id) AS totalRequired,
                SUM(CASE WHEN lp.completed = 1 THEN 1 ELSE 0 END) AS completedRequired
            FROM course_modules m
            JOIN lessons l ON l.moduleId = m.id AND l.isPublished = 1 AND l.isRequired = 1
            LEFT JOIN lesson_progress lp ON lp.lessonId = l.id AND lp.userId = ?
            WHERE m.courseId = ?
        ');
        $checkStmt->execute([$user['id'], $courseId]);
        $check = $checkStmt->fetch();

        $totalReq = (int)($check['totalRequired'] ?? 0);
        $compReq = (int)($check['completedRequired'] ?? 0);
        $isCourseCompleted = $totalReq > 0 && $compReq >= $totalReq;

        $certificate = null;

        if ($isCourseCompleted) {
            // Update enrollment status to COMPLETED
            $pdo->prepare('UPDATE enrollments SET status = "COMPLETED", completedAt = NOW() WHERE userId = ? AND courseId = ?')
                ->execute([$user['id'], $courseId]);

            // Issue Certificate if enabled
            if ((bool)$lesson['certificateEnabled']) {
                $certCheck = $pdo->prepare('SELECT id, certificateNumber, verificationCode FROM certificates WHERE userId = ? AND courseId = ? LIMIT 1');
                $certCheck->execute([$user['id'], $courseId]);
                $certificate = $certCheck->fetch();

                if (!$certificate) {
                    $certNum = 'JAD-' . date('Y') . '-' . strtoupper(substr(bin2hex(random_bytes(4)), 0, 8));
                    $verifyCode = strtoupper(bin2hex(random_bytes(6)));
                    $certId = Utils::generateUuid();

                    $insCert = $pdo->prepare('
                        INSERT INTO certificates (id, certificateNumber, verificationCode, userId, courseId, issuedAt, status, createdAt)
                        VALUES (?, ?, ?, ?, ?, NOW(), "ISSUED", NOW())
                    ');
                    $insCert->execute([$certId, $certNum, $verifyCode, $user['id'], $courseId]);

                    $certificate = [
                        'id' => $certId,
                        'certificateNumber' => $certNum,
                        'verificationCode' => $verifyCode,
                    ];
                }
            }
        }

        Response::success([
            'lessonId' => $lessonId,
            'completed' => $completed,
            'watchedSeconds' => $watchedSeconds,
            'courseCompleted' => $isCourseCompleted,
            'certificate' => $certificate,
        ]);
    }

    public function getCertificates(Request $request): void
    {
        $user = AuthMiddleware::authenticate($request);
        $pdo = Database::getPdo();

        $stmt = $pdo->prepare('
            SELECT 
                cert.id, cert.certificateNumber, cert.verificationCode, cert.issuedAt, cert.status, cert.certificateUrl,
                c.id AS courseId, c.title AS courseTitle, c.slug AS courseSlug
            FROM certificates cert
            JOIN courses c ON c.id = cert.courseId
            WHERE cert.userId = ? AND cert.status = "ISSUED"
            ORDER BY cert.issuedAt DESC
        ');
        $stmt->execute([$user['id']]);
        $rows = $stmt->fetchAll();

        Response::success($rows);
    }
}
