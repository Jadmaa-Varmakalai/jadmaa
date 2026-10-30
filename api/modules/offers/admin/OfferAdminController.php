<?php
declare(strict_types=1);

namespace Jadmaa\Modules\Offers\Admin;

use Jadmaa\Core\Request;
use Jadmaa\Core\Response;
use Jadmaa\Core\Utils;
use Jadmaa\Config\Database;
use Jadmaa\Middleware\AuthMiddleware;
use PDO;

class OfferAdminController
{
    public function getAdminOffers(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $pdo = Database::getPdo();

        $stmt = $pdo->query('
            SELECT o.*, c.title AS courseTitle, COUNT(DISTINCT ob.id) AS bookingCount
            FROM course_offers o
            LEFT JOIN courses c ON c.id = o.courseId
            LEFT JOIN offer_bookings ob ON ob.offerId = o.id
            GROUP BY o.id
            ORDER BY o.createdAt DESC
        ');
        $rows = $stmt->fetchAll();

        $result = array_map(function ($o) {
            $o['galleryImages'] = json_decode($o['galleryImages'] ?: '[]', true);
            $o['originalPrice'] = (float)$o['originalPrice'];
            $o['offerPrice'] = (float)$o['offerPrice'];
            $o['isEnabled'] = (bool)$o['isEnabled'];
            $o['showPopup'] = (bool)$o['showPopup'];
            $o['countdownEnabled'] = (bool)$o['countdownEnabled'];
            return $o;
        }, $rows);

        Response::success($result);
    }

    public function getAdminOfferById(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $id = $request->getParam('id');

        $pdo = Database::getPdo();
        $stmt = $pdo->prepare('SELECT * FROM course_offers WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $offer = $stmt->fetch();

        if (!$offer) {
            Response::notFound('Offer not found');
        }

        $offer['galleryImages'] = json_decode($offer['galleryImages'] ?: '[]', true);
        $offer['originalPrice'] = (float)$offer['originalPrice'];
        $offer['offerPrice'] = (float)$offer['offerPrice'];
        $offer['isEnabled'] = (bool)$offer['isEnabled'];
        $offer['showPopup'] = (bool)$offer['showPopup'];

        Response::success($offer);
    }

    public function createOffer(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $body = $request->getBody();

        $title = trim((string)($body['title'] ?? ''));
        $shortDescription = trim((string)($body['shortDescription'] ?? ''));
        $description = trim((string)($body['description'] ?? ''));
        $originalPrice = (float)($body['originalPrice'] ?? 0);
        $offerPrice = (float)($body['offerPrice'] ?? 0);

        if (empty($title)) {
            Response::error('Offer title is required');
        }

        $slug = Utils::slugify($body['slug'] ?? ($title . '-' . time()));
        $id = Utils::generateUuid();
        $gallery = json_encode($body['galleryImages'] ?? [], JSON_UNESCAPED_SLASHES);

        $pdo = Database::getPdo();
        $stmt = $pdo->prepare('
            INSERT INTO course_offers (
                id, title, slug, shortDescription, description, bannerImageUrl, popupImageUrl,
                mobileImageUrl, galleryImages, category, customCategory, targetAudience,
                branchLocation, courseId, pricingType, discountPercent, originalPrice, offerPrice,
                currency, theme, primaryColor, secondaryColor, ctaType, ctaText, ctaUrl,
                secondaryCtaText, secondaryCtaUrl, termsAndConditions, supportEmail, supportPhone,
                status, isEnabled, showPopup, popupPriority, startAt, expiresAt, countdownEnabled,
                bookingLimit, currentBookings, createdAt, updatedAt
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                "INR", ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?,
                ?, 0, NOW(), NOW()
            )
        ');
        $stmt->execute([
            $id,
            $title,
            $slug,
            $shortDescription,
            $description,
            $body['bannerImageUrl'] ?? null,
            $body['popupImageUrl'] ?? null,
            $body['mobileImageUrl'] ?? null,
            $gallery,
            $body['category'] ?? 'ONLINE_COURSE',
            $body['customCategory'] ?? null,
            $body['targetAudience'] ?? null,
            $body['branchLocation'] ?? null,
            !empty($body['courseId']) ? $body['courseId'] : null,
            $body['pricingType'] ?? 'FIXED_PRICE',
            isset($body['discountPercent']) ? (float)$body['discountPercent'] : null,
            $originalPrice,
            $offerPrice,
            $body['theme'] ?? 'light',
            $body['primaryColor'] ?? '#991B1B',
            $body['secondaryColor'] ?? '#141416',
            $body['ctaType'] ?? 'ENROLL_COURSE',
            $body['ctaText'] ?? null,
            $body['ctaUrl'] ?? null,
            $body['secondaryCtaText'] ?? null,
            $body['secondaryCtaUrl'] ?? null,
            $body['termsAndConditions'] ?? null,
            $body['supportEmail'] ?? 'info@jadmaa.com',
            $body['supportPhone'] ?? '+91 94431 58874',
            $body['status'] ?? 'DRAFT',
            !empty($body['isEnabled']) ? 1 : 0,
            !empty($body['showPopup']) ? 1 : 0,
            (int)($body['popupPriority'] ?? 0),
            Utils::toSqlDateTime($body['startAt'] ?? null),
            Utils::toSqlDateTime($body['expiresAt'] ?? null),
            !empty($body['countdownEnabled']) ? 1 : 0,
            isset($body['bookingLimit']) ? (int)$body['bookingLimit'] : null,
        ]);

        Response::success(['id' => $id, 'title' => $title, 'slug' => $slug]);
    }

    public function updateOffer(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $id = $request->getParam('id');
        $body = $request->getBody();

        $pdo = Database::getPdo();
        $fields = [];
        $params = [];

        $allowedKeys = [
            'title', 'shortDescription', 'description', 'bannerImageUrl', 'popupImageUrl',
            'mobileImageUrl', 'category', 'customCategory', 'targetAudience', 'branchLocation',
            'pricingType', 'theme', 'primaryColor', 'secondaryColor', 'ctaType', 'ctaText',
            'ctaUrl', 'secondaryCtaText', 'secondaryCtaUrl', 'termsAndConditions',
            'supportEmail', 'supportPhone', 'status'
        ];

        foreach ($allowedKeys as $k) {
            if (isset($body[$k])) {
                $fields[] = "`{$k}` = ?";
                $params[] = $body[$k];
            }
        }

        if (isset($body['slug'])) {
            $fields[] = '`slug` = ?';
            $params[] = Utils::slugify($body['slug']);
        }

        if (array_key_exists('courseId', $body)) {
            $fields[] = '`courseId` = ?';
            $params[] = !empty($body['courseId']) ? $body['courseId'] : null;
        }

        if (isset($body['originalPrice'])) {
            $fields[] = '`originalPrice` = ?';
            $params[] = (float)$body['originalPrice'];
        }

        if (isset($body['offerPrice'])) {
            $fields[] = '`offerPrice` = ?';
            $params[] = (float)$body['offerPrice'];
        }

        if (isset($body['discountPercent'])) {
            $fields[] = '`discountPercent` = ?';
            $params[] = (float)$body['discountPercent'];
        }

        if (isset($body['galleryImages'])) {
            $fields[] = '`galleryImages` = ?';
            $params[] = json_encode($body['galleryImages'], JSON_UNESCAPED_SLASHES);
        }

        foreach (['isEnabled', 'showPopup', 'countdownEnabled'] as $boolKey) {
            if (isset($body[$boolKey])) {
                $fields[] = "`{$boolKey}` = ?";
                $params[] = !empty($body[$boolKey]) ? 1 : 0;
            }
        }

        if (isset($body['popupPriority'])) {
            $fields[] = '`popupPriority` = ?';
            $params[] = (int)$body['popupPriority'];
        }

        if (array_key_exists('bookingLimit', $body)) {
            $fields[] = '`bookingLimit` = ?';
            $params[] = $body['bookingLimit'] !== null ? (int)$body['bookingLimit'] : null;
        }

        if (array_key_exists('startAt', $body)) {
            $fields[] = '`startAt` = ?';
            $params[] = Utils::toSqlDateTime($body['startAt']);
        }

        if (array_key_exists('expiresAt', $body)) {
            $fields[] = '`expiresAt` = ?';
            $params[] = Utils::toSqlDateTime($body['expiresAt']);
        }

        if (empty($fields)) {
            Response::success(['message' => 'No changes made']);
            return;
        }

        $params[] = $id;
        $sql = 'UPDATE course_offers SET ' . implode(', ', $fields) . ', updatedAt = NOW() WHERE id = ?';
        $pdo->prepare($sql)->execute($params);

        Response::success(['message' => 'Offer updated successfully']);
    }

    public function toggleOffer(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $id = $request->getParam('id');
        $pdo = Database::getPdo();

        $stmt = $pdo->prepare('SELECT isEnabled FROM course_offers WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $current = $stmt->fetchColumn();

        $newState = $current ? 0 : 1;
        $pdo->prepare('UPDATE course_offers SET isEnabled = ?, updatedAt = NOW() WHERE id = ?')
            ->execute([$newState, $id]);

        Response::success(['id' => $id, 'isEnabled' => (bool)$newState]);
    }

    public function duplicateOffer(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $id = $request->getParam('id');
        $pdo = Database::getPdo();

        $stmt = $pdo->prepare('SELECT * FROM course_offers WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $orig = $stmt->fetch();

        if (!$orig) {
            Response::notFound('Offer not found');
        }

        $newId = Utils::generateUuid();
        $newTitle = $orig['title'] . ' (Copy)';
        $newSlug = Utils::slugify($newTitle . '-' . time());

        $ins = $pdo->prepare('
            INSERT INTO course_offers (
                id, title, slug, shortDescription, description, bannerImageUrl, popupImageUrl,
                mobileImageUrl, galleryImages, category, customCategory, targetAudience,
                branchLocation, courseId, pricingType, discountPercent, originalPrice, offerPrice,
                currency, theme, primaryColor, secondaryColor, ctaType, ctaText, ctaUrl,
                secondaryCtaText, secondaryCtaUrl, termsAndConditions, supportEmail, supportPhone,
                status, isEnabled, showPopup, popupPriority, startAt, expiresAt, countdownEnabled,
                bookingLimit, currentBookings, createdAt, updatedAt
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?,
                "DRAFT", 0, 0, ?, ?, ?, ?,
                ?, 0, NOW(), NOW()
            )
        ');
        $ins->execute([
            $newId, $newTitle, $newSlug, $orig['shortDescription'], $orig['description'],
            $orig['bannerImageUrl'], $orig['popupImageUrl'], $orig['mobileImageUrl'],
            $orig['galleryImages'], $orig['category'], $orig['customCategory'], $orig['targetAudience'],
            $orig['branchLocation'], $orig['courseId'], $orig['pricingType'], $orig['discountPercent'],
            $orig['originalPrice'], $orig['offerPrice'], $orig['currency'], $orig['theme'],
            $orig['primaryColor'], $orig['secondaryColor'], $orig['ctaType'], $orig['ctaText'],
            $orig['ctaUrl'], $orig['secondaryCtaText'], $orig['secondaryCtaUrl'], $orig['termsAndConditions'],
            $orig['supportEmail'], $orig['supportPhone'], $orig['popupPriority'],
            $orig['startAt'], $orig['expiresAt'], $orig['countdownEnabled'], $orig['bookingLimit']
        ]);

        Response::success(['id' => $newId, 'title' => $newTitle, 'slug' => $newSlug]);
    }

    public function deleteOffer(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $id = $request->getParam('id');
        $pdo = Database::getPdo();
        $pdo->prepare('DELETE FROM course_offers WHERE id = ?')->execute([$id]);
        Response::success(['message' => 'Offer deleted successfully']);
    }

    public function getOfferSettings(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $pdo = Database::getPdo();
        $stmt = $pdo->query('SELECT `key`, `value` FROM system_settings WHERE `key` LIKE "offer_%"');
        $rows = $stmt->fetchAll();

        $settings = [];
        foreach ($rows as $r) {
            $settings[$r['key']] = $r['value'];
        }

        Response::success($settings);
    }

    public function updateOfferSettings(Request $request): void
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

        Response::success(['message' => 'Offer settings saved']);
    }

    public function getOfferBookings(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $pdo = Database::getPdo();

        $stmt = $pdo->query('
            SELECT b.*, o.title AS offerTitle
            FROM offer_bookings b
            JOIN course_offers o ON o.id = b.offerId
            ORDER BY b.createdAt DESC
        ');
        Response::success($stmt->fetchAll());
    }
}
