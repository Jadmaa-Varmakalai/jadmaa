<?php
declare(strict_types=1);

namespace Jadmaa\Modules\Products;

use Jadmaa\Core\Request;
use Jadmaa\Core\Response;
use Jadmaa\Core\Utils;
use Jadmaa\Config\Database;
use Jadmaa\Middleware\AuthMiddleware;
use PDO;

class ProductController
{
    // ==========================================
    // PUBLIC STOREFRONT
    // ==========================================

    public function getProducts(Request $request): void
    {
        $categorySlug = $request->getQuery('category');
        $search = $request->getQuery('search');

        $pdo = Database::getPdo();
        $sql = '
            SELECT p.*, c.name AS categoryName, c.slug AS categorySlug
            FROM products p
            JOIN product_categories c ON c.id = p.categoryId
            WHERE p.isActive = 1
        ';
        $params = [];

        if (!empty($categorySlug)) {
            $sql .= ' AND c.slug = ?';
            $params[] = $categorySlug;
        }

        if (!empty($search)) {
            $sql .= ' AND (p.name LIKE ? OR p.description LIKE ?)';
            $params[] = "%{$search}%";
            $params[] = "%{$search}%";
        }

        $sql .= ' ORDER BY p.createdAt DESC';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $products = $stmt->fetchAll();

        $formatted = array_map(function ($p) {
            $images = json_decode($p['images'] ?: '[]', true);
            return [
                'id' => $p['id'],
                'name' => $p['name'],
                'slug' => $p['slug'],
                'description' => $p['description'],
                'price' => (float)$p['price'],
                'compareAtPrice' => $p['compareAtPrice'] ? (float)$p['compareAtPrice'] : null,
                'images' => is_array($images) ? $images : [],
                'sku' => $p['sku'],
                'stockQuantity' => (int)$p['stockQuantity'],
                'lowStockThreshold' => (int)$p['lowStockThreshold'],
                'category' => [
                    'id' => $p['categoryId'],
                    'name' => $p['categoryName'],
                    'slug' => $p['categorySlug'],
                ]
            ];
        }, $products);

        Response::success($formatted);
    }

    public function getProductBySlug(Request $request): void
    {
        $slug = $request->getParam('slug');
        if (empty($slug)) {
            Response::error('Slug is required');
        }

        $pdo = Database::getPdo();
        $stmt = $pdo->prepare('
            SELECT p.*, c.name AS categoryName, c.slug AS categorySlug
            FROM products p
            JOIN product_categories c ON c.id = p.categoryId
            WHERE p.slug = ? AND p.isActive = 1 LIMIT 1
        ');
        $stmt->execute([$slug]);
        $p = $stmt->fetch();

        if (!$p) {
            Response::notFound('Product not found');
        }

        $images = json_decode($p['images'] ?: '[]', true);

        Response::success([
            'id' => $p['id'],
            'name' => $p['name'],
            'slug' => $p['slug'],
            'description' => $p['description'],
            'price' => (float)$p['price'],
            'compareAtPrice' => $p['compareAtPrice'] ? (float)$p['compareAtPrice'] : null,
            'images' => is_array($images) ? $images : [],
            'sku' => $p['sku'],
            'stockQuantity' => (int)$p['stockQuantity'],
            'lowStockThreshold' => (int)$p['lowStockThreshold'],
            'category' => [
                'id' => $p['categoryId'],
                'name' => $p['categoryName'],
                'slug' => $p['categorySlug'],
            ]
        ]);
    }

    public function getCategories(Request $request): void
    {
        $pdo = Database::getPdo();
        $stmt = $pdo->query('
            SELECT c.*, COUNT(p.id) AS productCount
            FROM product_categories c
            LEFT JOIN products p ON p.categoryId = c.id AND p.isActive = 1
            WHERE c.isActive = 1
            GROUP BY c.id
            ORDER BY c.name ASC
        ');
        $cats = $stmt->fetchAll();

        Response::success($cats);
    }

    public function getCategoryBySlug(Request $request): void
    {
        $slug = $request->getParam('slug');
        $pdo = Database::getPdo();
        $stmt = $pdo->prepare('SELECT * FROM product_categories WHERE slug = ? AND isActive = 1 LIMIT 1');
        $stmt->execute([$slug]);
        $cat = $stmt->fetch();

        if (!$cat) {
            Response::notFound('Category not found');
        }

        Response::success($cat);
    }

    // ==========================================
    // ADMIN PRODUCT & CATEGORY MANAGEMENT
    // ==========================================

    public function adminGetProducts(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $pdo = Database::getPdo();
        $stmt = $pdo->query('
            SELECT p.*, c.name AS categoryName 
            FROM products p
            JOIN product_categories c ON c.id = p.categoryId
            ORDER BY p.createdAt DESC
        ');
        $rows = $stmt->fetchAll();

        $result = array_map(function ($p) {
            $p['images'] = json_decode($p['images'] ?: '[]', true);
            $p['price'] = (float)$p['price'];
            $p['stockQuantity'] = (int)$p['stockQuantity'];
            $p['isActive'] = (bool)$p['isActive'];
            return $p;
        }, $rows);

        Response::success($result);
    }

    public function adminGetProductById(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $id = $request->getParam('id');
        $pdo = Database::getPdo();
        $stmt = $pdo->prepare('SELECT * FROM products WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $prod = $stmt->fetch();

        if (!$prod) {
            Response::notFound('Product not found');
        }

        $prod['images'] = json_decode($prod['images'] ?: '[]', true);
        Response::success($prod);
    }

    public function createProduct(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $body = $request->getBody();

        $name = trim((string)($body['name'] ?? ''));
        $categoryId = trim((string)($body['categoryId'] ?? ''));
        $price = (float)($body['price'] ?? 0);
        $sku = trim((string)($body['sku'] ?? ('SKU-' . time())));
        $stockQuantity = (int)($body['stockQuantity'] ?? 0);

        if (empty($name) || empty($categoryId) || $price <= 0) {
            Response::error('Name, valid category, and positive price are required');
        }

        $slug = Utils::slugify($name . '-' . time());
        $prodId = Utils::generateUuid();
        $images = json_encode($body['images'] ?? [], JSON_UNESCAPED_SLASHES);

        $pdo = Database::getPdo();
        $stmt = $pdo->prepare('
            INSERT INTO products (
                id, name, slug, description, categoryId, price, compareAtPrice, images, sku,
                stockQuantity, lowStockThreshold, isActive, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ');
        $stmt->execute([
            $prodId,
            $name,
            $slug,
            $body['description'] ?? '',
            $categoryId,
            $price,
            isset($body['compareAtPrice']) ? (float)$body['compareAtPrice'] : null,
            $images,
            $sku,
            $stockQuantity,
            (int)($body['lowStockThreshold'] ?? 5),
            isset($body['isActive']) ? ((bool)$body['isActive'] ? 1 : 0) : 1,
        ]);

        Response::success(['id' => $prodId, 'name' => $name, 'slug' => $slug]);
    }

    public function updateProduct(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $id = $request->getParam('id');
        $body = $request->getBody();

        $pdo = Database::getPdo();
        $fields = [];
        $params = [];

        foreach (['name', 'description', 'categoryId', 'sku'] as $k) {
            if (isset($body[$k])) {
                $fields[] = "`{$k}` = ?";
                $params[] = $body[$k];
            }
        }

        if (isset($body['price'])) {
            $fields[] = '`price` = ?';
            $params[] = (float)$body['price'];
        }

        if (isset($body['compareAtPrice'])) {
            $fields[] = '`compareAtPrice` = ?';
            $params[] = $body['compareAtPrice'] !== null ? (float)$body['compareAtPrice'] : null;
        }

        if (isset($body['images'])) {
            $fields[] = '`images` = ?';
            $params[] = json_encode($body['images'], JSON_UNESCAPED_SLASHES);
        }

        if (isset($body['stockQuantity'])) {
            $fields[] = '`stockQuantity` = ?';
            $params[] = (int)$body['stockQuantity'];
        }

        if (isset($body['isActive'])) {
            $fields[] = '`isActive` = ?';
            $params[] = !empty($body['isActive']) ? 1 : 0;
        }

        if (empty($fields)) {
            Response::success(['message' => 'No changes made']);
            return;
        }

        $params[] = $id;
        $sql = 'UPDATE products SET ' . implode(', ', $fields) . ', updatedAt = NOW() WHERE id = ?';
        $pdo->prepare($sql)->execute($params);

        Response::success(['message' => 'Product updated successfully']);
    }

    public function deleteProduct(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $id = $request->getParam('id');
        $pdo = Database::getPdo();
        $pdo->prepare('DELETE FROM products WHERE id = ?')->execute([$id]);
        Response::success(['message' => 'Product deleted successfully']);
    }

    // Category CRUD
    public function createCategory(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $body = $request->getBody();
        $name = trim((string)($body['name'] ?? ''));
        if (empty($name)) {
            Response::error('Category name is required');
        }

        $slug = Utils::slugify($name);
        $catId = Utils::generateUuid();

        $pdo = Database::getPdo();
        $stmt = $pdo->prepare('
            INSERT INTO product_categories (id, name, slug, description, image, isActive, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())
        ');
        $stmt->execute([$catId, $name, $slug, $body['description'] ?? null, $body['image'] ?? null]);

        Response::success(['id' => $catId, 'name' => $name, 'slug' => $slug]);
    }

    public function updateCategory(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $id = $request->getParam('id');
        $body = $request->getBody();

        $pdo = Database::getPdo();
        $stmt = $pdo->prepare('UPDATE product_categories SET name = ?, description = ?, image = ?, updatedAt = NOW() WHERE id = ?');
        $stmt->execute([$body['name'] ?? '', $body['description'] ?? null, $body['image'] ?? null, $id]);

        Response::success(['message' => 'Category updated successfully']);
    }

    public function deleteCategory(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $id = $request->getParam('id');
        $pdo = Database::getPdo();
        $pdo->prepare('DELETE FROM product_categories WHERE id = ?')->execute([$id]);
        Response::success(['message' => 'Category deleted successfully']);
    }

    // Inventory
    public function getInventoryLogs(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $pdo = Database::getPdo();
        $stmt = $pdo->query('
            SELECT inv.*, p.name AS productName, p.sku
            FROM inventory_transactions inv
            JOIN products p ON p.id = inv.productId
            ORDER BY inv.createdAt DESC
            LIMIT 100
        ');
        Response::success($stmt->fetchAll());
    }

    public function adjustStock(Request $request): void
    {
        $user = AuthMiddleware::authenticate($request);
        AuthMiddleware::requireAdmin($request);

        $body = $request->getBody();
        $productId = trim((string)($body['productId'] ?? ''));
        $quantityChanged = (int)($body['quantityChanged'] ?? 0);
        $reason = trim((string)($body['reason'] ?? 'Manual stock adjustment'));

        if (empty($productId) || $quantityChanged === 0) {
            Response::error('Product ID and non-zero quantity are required');
        }

        $pdo = Database::getPdo();
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare('SELECT stockQuantity FROM products WHERE id = ? LIMIT 1');
            $stmt->execute([$productId]);
            $prevStock = (int)$stmt->fetchColumn();

            $newStock = max(0, $prevStock + $quantityChanged);
            $pdo->prepare('UPDATE products SET stockQuantity = ?, updatedAt = NOW() WHERE id = ?')
                ->execute([$newStock, $productId]);

            $pdo->prepare('
                INSERT INTO inventory_transactions (id, productId, transactionType, quantityChanged, previousStock, updatedStock, reason, performedBy, createdAt)
                VALUES (?, ?, "MANUAL_ADJUSTMENT", ?, ?, ?, ?, ?, NOW())
            ')->execute([Utils::generateUuid(), $productId, $quantityChanged, $prevStock, $newStock, $reason, $user['name']]);

            $pdo->commit();
            Response::success(['productId' => $productId, 'previousStock' => $prevStock, 'updatedStock' => $newStock]);
        } catch (\Throwable $e) {
            $pdo->rollBack();
            Response::serverError('Failed to adjust stock');
        }
    }

    public function getLowStockAlerts(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $pdo = Database::getPdo();
        $stmt = $pdo->query('
            SELECT p.*, c.name AS categoryName
            FROM products p
            JOIN product_categories c ON c.id = p.categoryId
            WHERE p.stockQuantity <= p.lowStockThreshold AND p.isActive = 1
            ORDER BY p.stockQuantity ASC
        ');
        Response::success($stmt->fetchAll());
    }
}
