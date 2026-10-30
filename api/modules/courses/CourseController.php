<?php
declare(strict_types=1);

namespace Jadmaa\Modules\Courses;

use Jadmaa\Core\Request;
use Jadmaa\Core\Response;
use Jadmaa\Config\Database;
use PDO;

class CourseController
{
    public function getCourses(Request $request): void
    {
        $category = $request->getQuery('category');
        $search = $request->getQuery('search');

        $pdo = Database::getPdo();

        $sql = '
            SELECT 
                c.id, c.title, c.slug, c.subtitle, c.description, c.longDescription,
                c.thumbnailUrl, c.category, c.level, c.duration, c.price, c.isFree,
                c.certificateEnabled, c.status, c.rating, c.reviewCount, c.publishedAt,
                i.id AS instructor_id, i.displayName AS instructor_name, i.title AS instructor_title, i.avatarUrl AS instructor_avatar
            FROM courses c
            JOIN instructors i ON i.id = c.instructorId
            WHERE c.status = "PUBLISHED"
        ';

        $params = [];

        if (!empty($category)) {
            $sql .= ' AND c.category = ?';
            $params[] = $category;
        }

        if (!empty($search)) {
            $sql .= ' AND (c.title LIKE ? OR c.description LIKE ?)';
            $params[] = "%{$search}%";
            $params[] = "%{$search}%";
        }

        $sql .= ' ORDER BY c.createdAt DESC';

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $courses = $stmt->fetchAll();

        // Format course output
        $formatted = array_map(function ($c) use ($pdo) {
            // Count modules and lessons
            $cntStmt = $pdo->prepare('
                SELECT COUNT(DISTINCT m.id) AS moduleCount, COUNT(l.id) AS lessonCount
                FROM course_modules m
                LEFT JOIN lessons l ON l.moduleId = m.id AND l.isPublished = 1
                WHERE m.courseId = ?
            ');
            $cntStmt->execute([$c['id']]);
            $counts = $cntStmt->fetch() ?: ['moduleCount' => 0, 'lessonCount' => 0];

            return [
                'id' => $c['id'],
                'title' => $c['title'],
                'slug' => $c['slug'],
                'subtitle' => $c['subtitle'],
                'description' => $c['description'],
                'longDescription' => $c['longDescription'],
                'thumbnailUrl' => $c['thumbnailUrl'],
                'category' => $c['category'],
                'level' => $c['level'],
                'duration' => $c['duration'],
                'price' => (float)$c['price'],
                'isFree' => (bool)$c['isFree'],
                'certificateEnabled' => (bool)$c['certificateEnabled'],
                'status' => $c['status'],
                'rating' => (float)$c['rating'],
                'reviewCount' => (int)$c['reviewCount'],
                'moduleCount' => (int)$counts['moduleCount'],
                'lessonCount' => (int)$counts['lessonCount'],
                'instructor' => [
                    'id' => $c['instructor_id'],
                    'displayName' => $c['instructor_name'],
                    'title' => $c['instructor_title'],
                    'avatarUrl' => $c['instructor_avatar'],
                ]
            ];
        }, $courses);

        Response::success($formatted);
    }

    public function getCourseBySlug(Request $request): void
    {
        $slug = $request->getParam('slug');
        if (empty($slug)) {
            Response::error('Course slug is required');
        }

        $pdo = Database::getPdo();
        $stmt = $pdo->prepare('
            SELECT 
                c.*,
                i.id AS instructor_id, i.displayName AS instructor_name, i.title AS instructor_title,
                i.bio AS instructor_bio, i.avatarUrl AS instructor_avatar, i.specialization AS instructor_spec
            FROM courses c
            JOIN instructors i ON i.id = c.instructorId
            WHERE c.slug = ? AND c.status = "PUBLISHED"
            LIMIT 1
        ');
        $stmt->execute([$slug]);
        $course = $stmt->fetch();

        if (!$course) {
            Response::notFound('Course not found');
        }

        // Fetch modules with ordered lessons
        $modStmt = $pdo->prepare('
            SELECT id, title, description, sortOrder 
            FROM course_modules 
            WHERE courseId = ? 
            ORDER BY sortOrder ASC, createdAt ASC
        ');
        $modStmt->execute([$course['id']]);
        $modules = $modStmt->fetchAll();

        foreach ($modules as &$mod) {
            $lesStmt = $pdo->prepare('
                SELECT id, title, description, youtubeVideoId, durationSeconds, sortOrder, isPreview, isRequired
                FROM lessons 
                WHERE moduleId = ? AND isPublished = 1 
                ORDER BY sortOrder ASC, createdAt ASC
            ');
            $lesStmt->execute([$mod['id']]);
            $mod['lessons'] = array_map(function ($les) {
                return [
                    'id' => $les['id'],
                    'title' => $les['title'],
                    'description' => $les['description'],
                    'youtubeVideoId' => $les['youtubeVideoId'],
                    'durationSeconds' => (int)$les['durationSeconds'],
                    'sortOrder' => (int)$les['sortOrder'],
                    'isPreview' => (bool)$les['isPreview'],
                    'isRequired' => (bool)$les['isRequired'],
                ];
            }, $lesStmt->fetchAll());
        }

        $formatted = [
            'id' => $course['id'],
            'title' => $course['title'],
            'slug' => $course['slug'],
            'subtitle' => $course['subtitle'],
            'description' => $course['description'],
            'longDescription' => $course['longDescription'],
            'thumbnailUrl' => $course['thumbnailUrl'],
            'category' => $course['category'],
            'level' => $course['level'],
            'duration' => $course['duration'],
            'price' => (float)$course['price'],
            'isFree' => (bool)$course['isFree'],
            'certificateEnabled' => (bool)$course['certificateEnabled'],
            'status' => $course['status'],
            'rating' => (float)$course['rating'],
            'reviewCount' => (int)$course['reviewCount'],
            'modules' => $modules,
            'instructor' => [
                'id' => $course['instructor_id'],
                'displayName' => $course['instructor_name'],
                'title' => $course['instructor_title'],
                'bio' => $course['instructor_bio'],
                'avatarUrl' => $course['instructor_avatar'],
                'specialization' => $course['instructor_spec'],
            ]
        ];

        Response::success($formatted);
    }
}
