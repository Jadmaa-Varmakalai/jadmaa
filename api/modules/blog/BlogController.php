<?php
declare(strict_types=1);

namespace Jadmaa\Modules\Blog;

use Jadmaa\Core\Request;
use Jadmaa\Core\Response;
use Jadmaa\Core\Utils;
use Jadmaa\Config\Database;
use Jadmaa\Middleware\AuthMiddleware;
use PDO;

class BlogController
{
    private static function formatBlog(array $b): array
    {
        $topic = $b['topic'] ?? null;
        $content = $b['content'] ?? '';
        if (preg_match('/^<!--topic:(.*?)-->\s*/', $content, $matches)) {
            $topic = $topic ?: $matches[1];
        }
        $b['topic'] = $topic;
        $b['published'] = (bool)($b['published'] ?? 0);
        return $b;
    }

    public function getBlogs(Request $request): void
    {
        $isAdminQuery = $request->getQuery('all') === 'true';
        $pdo = Database::getPdo();

        $sql = '
            SELECT b.*, u.name AS authorName, u.avatarUrl AS authorAvatar
            FROM blog_posts b
            JOIN users u ON u.id = b.authorId
        ';

        if (!$isAdminQuery) {
            $sql .= ' WHERE b.published = 1';
        }

        $sql .= ' ORDER BY b.createdAt DESC';

        $stmt = $pdo->query($sql);
        $blogs = $stmt->fetchAll();

        $result = array_map(function ($b) {
            $f = self::formatBlog($b);
            return [
                'id' => $f['id'],
                'title' => $f['title'],
                'slug' => $f['slug'],
                'content' => $f['content'],
                'excerpt' => $f['excerpt'],
                'thumbnailUrl' => $f['thumbnailUrl'],
                'topic' => $f['topic'],
                'published' => (bool)$f['published'],
                'createdAt' => $f['createdAt'],
                'author' => [
                    'name' => $f['authorName'],
                    'avatarUrl' => $f['authorAvatar'],
                ]
            ];
        }, $blogs);

        Response::success($result);
    }

    public function getBlogBySlug(Request $request): void
    {
        $slug = $request->getParam('slug');
        $pdo = Database::getPdo();

        $stmt = $pdo->prepare('
            SELECT b.*, u.name AS authorName, u.avatarUrl AS authorAvatar
            FROM blog_posts b
            JOIN users u ON u.id = b.authorId
            WHERE b.slug = ? LIMIT 1
        ');
        $stmt->execute([$slug]);
        $b = $stmt->fetch();

        if (!$b) {
            Response::notFound('Blog not found');
        }

        $f = self::formatBlog($b);
        Response::success([
            'id' => $f['id'],
            'title' => $f['title'],
            'slug' => $f['slug'],
            'content' => $f['content'],
            'excerpt' => $f['excerpt'],
            'thumbnailUrl' => $f['thumbnailUrl'],
            'topic' => $f['topic'],
            'published' => (bool)$f['published'],
            'createdAt' => $f['createdAt'],
            'author' => [
                'name' => $f['authorName'],
                'avatarUrl' => $f['authorAvatar'],
            ]
        ]);
    }

    public function createBlog(Request $request): void
    {
        $user = AuthMiddleware::authenticate($request);
        AuthMiddleware::requireAdmin($request);

        $body = $request->getBody();
        $title = trim((string)($body['title'] ?? ''));
        $content = trim((string)($body['content'] ?? ''));

        if (empty($title) || empty($content)) {
            Response::error('Title and content are required');
        }

        $slug = Utils::slugify($body['slug'] ?? ($title . '-' . time()));
        $id = Utils::generateUuid();

        $pdo = Database::getPdo();
        $stmt = $pdo->prepare('
            INSERT INTO blog_posts (id, title, slug, content, excerpt, thumbnailUrl, authorId, published, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ');
        $stmt->execute([
            $id,
            $title,
            $slug,
            $content,
            $body['excerpt'] ?? null,
            $body['thumbnailUrl'] ?? null,
            $user['id'],
            !empty($body['published']) ? 1 : 0
        ]);

        Response::success(['id' => $id, 'title' => $title, 'slug' => $slug]);
    }

    public function updateBlog(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $id = $request->getParam('id');
        $body = $request->getBody();

        $pdo = Database::getPdo();
        $fields = [];
        $params = [];

        foreach (['title', 'content', 'excerpt', 'thumbnailUrl'] as $k) {
            if (isset($body[$k])) {
                $fields[] = "`{$k}` = ?";
                $params[] = $body[$k];
            }
        }

        if (isset($body['slug'])) {
            $fields[] = '`slug` = ?';
            $params[] = Utils::slugify($body['slug']);
        }

        if (isset($body['published'])) {
            $fields[] = '`published` = ?';
            $params[] = !empty($body['published']) ? 1 : 0;
        }

        if (empty($fields)) {
            Response::success(['message' => 'No changes made']);
            return;
        }

        $params[] = $id;
        $sql = 'UPDATE blog_posts SET ' . implode(', ', $fields) . ', updatedAt = NOW() WHERE id = ?';
        $pdo->prepare($sql)->execute($params);

        Response::success(['message' => 'Blog updated successfully']);
    }

    public function deleteBlog(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $id = $request->getParam('id');
        $pdo = Database::getPdo();
        $pdo->prepare('DELETE FROM blog_posts WHERE id = ?')->execute([$id]);
        Response::success(['message' => 'Blog deleted successfully']);
    }
}
