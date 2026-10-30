<?php
declare(strict_types=1);

namespace Jadmaa\Modules\Offers;

use Jadmaa\Core\Request;
use Jadmaa\Core\Response;
use Jadmaa\Core\Utils;
use Jadmaa\Config\Database;
use Jadmaa\Services\RazorpayService;
use Jadmaa\Services\EmailService;
use Jadmaa\Middleware\AuthMiddleware;
use PDO;

class OfferController
{
    /**
     * 1. GET ACTIVE POPUP OFFER
     */
    public function getActivePopupOffer(Request $request): void
    {
        $pdo = Database::getPdo();

        // Check if global offer popup is disabled via SystemSetting
        $popStmt = $pdo->prepare('SELECT `value` FROM system_settings WHERE `key` = "offer_popup_enabled" LIMIT 1');
        $popStmt->execute();
        $popupVal = $popStmt->fetchColumn();

        if ($popupVal === 'false') {
            Response::success(null);
            return;
        }

        $stmt = $pdo->query('
            SELECT o.*, c.title AS courseTitle, c.thumbnailUrl AS courseThumbnail, c.price AS coursePrice, c.status AS courseStatus
            FROM course_offers o
            LEFT JOIN courses c ON c.id = o.courseId
            WHERE o.isEnabled = 1 AND o.showPopup = 1 AND o.status IN ("PUBLISHED", "SCHEDULED")
            ORDER BY o.popupPriority DESC, o.createdAt DESC
            LIMIT 10
        ');
        $candidates = $stmt->fetchAll();

        $now = time();
        $validOffer = null;

        foreach ($candidates as $cand) {
            // Check dates
            if (!empty($cand['startAt']) && strtotime($cand['startAt']) > $now) {
                continue;
            }
            if (!empty($cand['expiresAt']) && strtotime($cand['expiresAt']) < $now) {
                continue;
            }
            if (!empty($cand['courseId']) && ($cand['courseStatus'] ?? '') !== 'PUBLISHED') {
                continue;
            }
            $validOffer = $cand;
            break;
        }

        if (!$validOffer) {
            Response::success(null);
            return;
        }

        $discountAmount = max(0, (float)$validOffer['originalPrice'] - (float)$validOffer['offerPrice']);
        $discountPercent = (float)$validOffer['originalPrice'] > 0
            ? (int)round(($discountAmount / (float)$validOffer['originalPrice']) * 100)
            : 0;

        Response::success([
            'id' => $validOffer['id'],
            'slug' => $validOffer['slug'],
            'title' => $validOffer['title'],
            'shortDescription' => $validOffer['shortDescription'],
            'bannerImageUrl' => $validOffer['bannerImageUrl'] ?: ($validOffer['courseThumbnail'] ?? '/images/hero-kick-action-transparent.png'),
            'popupImageUrl' => $validOffer['popupImageUrl'] ?: ($validOffer['bannerImageUrl'] ?: ($validOffer['courseThumbnail'] ?? '/images/hero-kick-action-transparent.png')),
            'mobileImageUrl' => $validOffer['mobileImageUrl'] ?: null,
            'category' => $validOffer['category'],
            'customCategory' => $validOffer['customCategory'],
            'originalPrice' => (float)$validOffer['originalPrice'],
            'offerPrice' => (float)$validOffer['offerPrice'],
            'discountPercent' => $discountPercent,
            'ctaText' => $validOffer['ctaText'] ?: 'Claim Offer Now',
            'ctaUrl' => $validOffer['ctaUrl'] ?: "/offers/{$validOffer['slug']}",
            'expiresAt' => $validOffer['expiresAt'],
            'countdownEnabled' => (bool)$validOffer['countdownEnabled'],
        ]);
    }

    /**
     * 2. GET OFFER BY SLUG
     */
    public function getOfferBySlug(Request $request): void
    {
        $slug = $request->getParam('slug');
        if (empty($slug)) {
            Response::error('Slug is required');
        }

        $pdo = Database::getPdo();
        $stmt = $pdo->prepare('
            SELECT o.*, c.title AS courseTitle, c.slug AS courseSlug, c.thumbnailUrl AS courseThumbnail, c.price AS coursePrice
            FROM course_offers o
            LEFT JOIN courses c ON c.id = o.courseId
            WHERE LOWER(o.slug) = LOWER(?) LIMIT 1
        ');
        $stmt->execute([$slug]);
        $offer = $stmt->fetch();

        if (!$offer) {
            Response::notFound('Offer not found');
        }

        $offer['galleryImages'] = json_decode($offer['galleryImages'] ?: '[]', true);
        $offer['originalPrice'] = (float)$offer['originalPrice'];
        $offer['offerPrice'] = (float)$offer['offerPrice'];
        $offer['currentBookings'] = (int)$offer['currentBookings'];
        $offer['bookingLimit'] = $offer['bookingLimit'] !== null ? (int)$offer['bookingLimit'] : null;

        Response::success($offer);
    }

    /**
     * 3. INITIATE OFFER BOOKING
     */
    public function initiateOfferBooking(Request $request): void
    {
        $user = AuthMiddleware::authenticate($request);
        $slug = $request->getParam('slug');
        $body = $request->getBody();

        $pdo = Database::getPdo();
        $stmt = $pdo->prepare('SELECT * FROM course_offers WHERE LOWER(slug) = LOWER(?) LIMIT 1');
        $stmt->execute([$slug]);
        $offer = $stmt->fetch();

        if (!$offer || !(bool)$offer['isEnabled']) {
            Response::notFound('Offer not found or unavailable');
        }

        // Check booking limit
        if ($offer['bookingLimit'] !== null && (int)$offer['currentBookings'] >= (int)$offer['bookingLimit']) {
            Response::error('This offer has reached its maximum booking capacity');
        }

        $amountInINR = (float)$offer['offerPrice'];
        $amountInPaise = (int)round($amountInINR * 100);
        $bookingNumber = 'BK-' . date('Ymd') . '-' . rand(1000, 9999);
        $bookingId = Utils::generateUuid();
        $paymentRecordId = Utils::generateUuid();

        $rzp = RazorpayService::getInstance();
        $receipt = 'OFFER_' . time() . '_' . substr(bin2hex(random_bytes(3)), 0, 6);

        $rzpOrder = $rzp->createOrder($amountInPaise, $receipt, [
            'offerSlug' => $offer['slug'],
            'offerTitle' => substr($offer['title'], 0, 40),
            'userId' => $user['id'],
            'bookingNumber' => $bookingNumber,
        ]);

        $rzpOrderId = $rzpOrder['id'];

        $pdo->beginTransaction();
        try {
            // Create local Payment
            $pdo->prepare('
                INSERT INTO payments (id, userId, courseId, gateway, merchantOrderId, amount, currency, status, offerId, createdAt, updatedAt)
                VALUES (?, ?, ?, "RAZORPAY", ?, ?, "INR", "PENDING", ?, NOW(), NOW())
            ')->execute([$paymentRecordId, $user['id'], $offer['courseId'] ?: 'OFFER_BOOKING', $rzpOrderId, $amountInINR, $offer['id']]);

            // Create OfferBooking
            $pdo->prepare('
                INSERT INTO offer_bookings (id, bookingNumber, offerId, courseId, userId, paymentId, amount, currency, status, customerName, customerEmail, customerPhone, category, notes, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, "INR", "PENDING", ?, ?, ?, ?, ?, NOW(), NOW())
            ')->execute([
                $bookingId,
                $bookingNumber,
                $offer['id'],
                $offer['courseId'],
                $user['id'],
                $paymentRecordId,
                $amountInINR,
                $user['name'] ?? '',
                $user['email'] ?? '',
                $body['phone'] ?? ($user['phone'] ?? ''),
                $offer['category'],
                $body['notes'] ?? null,
            ]);

            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            error_log('[OfferBooking] DB insert error: ' . $e->getMessage());
            Response::serverError('Failed to initiate offer booking');
        }

        Response::success([
            'keyId' => $rzp->getKeyId(),
            'orderId' => $rzpOrderId,
            'bookingNumber' => $bookingNumber,
            'amount' => $amountInPaise,
            'currency' => 'INR',
            'offer' => [
                'id' => $offer['id'],
                'title' => $offer['title'],
                'slug' => $offer['slug'],
            ],
            'prefill' => [
                'name' => $user['name'] ?? '',
                'email' => $user['email'] ?? '',
                'contact' => $user['phone'] ?? '',
            ]
        ]);
    }

    /**
     * 4. VERIFY OFFER PAYMENT
     */
    public function verifyOfferPayment(Request $request): void
    {
        $user = AuthMiddleware::authenticate($request);
        $body = $request->getBody();

        $orderId = (string)($body['razorpay_order_id'] ?? '');
        $paymentId = (string)($body['razorpay_payment_id'] ?? '');
        $signature = (string)($body['razorpay_signature'] ?? '');

        if (empty($orderId) || empty($paymentId) || empty($signature)) {
            Response::error('Missing required payment credentials');
        }

        $rzp = RazorpayService::getInstance();
        if (!$rzp->verifyPaymentSignature($orderId, $paymentId, $signature)) {
            Response::error('Invalid signature');
        }

        $pdo = Database::getPdo();
        $stmt = $pdo->prepare('
            SELECT p.*, ob.id AS bookingId, ob.bookingNumber, o.title AS offerTitle, o.id AS offerId, o.courseId AS offerCourseId
            FROM payments p
            JOIN offer_bookings ob ON ob.paymentId = p.id
            JOIN course_offers o ON o.id = p.offerId
            WHERE p.merchantOrderId = ? LIMIT 1
        ');
        $stmt->execute([$orderId]);
        $record = $stmt->fetch();

        if (!$record) {
            Response::notFound('Offer payment record not found');
        }

        if ($record['status'] === 'SUCCESS') {
            Response::success(['message' => 'Payment already verified', 'status' => 'SUCCESS']);
            return;
        }

        $pdo->beginTransaction();
        try {
            $pdo->prepare('
                UPDATE payments 
                SET status = "SUCCESS", gatewayTransactionId = ?, paidAt = NOW(), updatedAt = NOW()
                WHERE id = ?
            ')->execute([$paymentId, $record['id']]);

            $pdo->prepare('UPDATE offer_bookings SET status = "SUCCESS", updatedAt = NOW() WHERE id = ?')
                ->execute([$record['bookingId']]);

            $pdo->prepare('UPDATE course_offers SET currentBookings = currentBookings + 1 WHERE id = ?')
                ->execute([$record['offerId']]);

            // If offer is linked to an online course, activate student enrollment
            if (!empty($record['offerCourseId'])) {
                $pdo->prepare('
                    INSERT INTO enrollments (id, userId, courseId, paymentId, status, enrolledAt, createdAt, updatedAt)
                    VALUES (?, ?, ?, ?, "ACTIVE", NOW(), NOW(), NOW())
                    ON DUPLICATE KEY UPDATE status = "ACTIVE", paymentId = VALUES(paymentId), updatedAt = NOW()
                ')->execute([Utils::generateUuid(), $record['userId'], $record['offerCourseId'], $record['id']]);
            }

            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            Response::serverError('Database update error');
        }

        Response::success([
            'status' => 'SUCCESS',
            'bookingNumber' => $record['bookingNumber'],
            'orderId' => $orderId,
            'paymentId' => $paymentId,
        ]);
    }

    /**
     * 5. SUBMIT OFFER ENQUIRY
     */
    public function submitOfferEnquiry(Request $request): void
    {
        $body = $request->getBody();
        $name = trim((string)($body['name'] ?? ''));
        $email = trim((string)($body['email'] ?? ''));
        $phone = trim((string)($body['phone'] ?? ''));
        $message = trim((string)($body['message'] ?? ''));

        if (empty($name) || empty($email) || empty($message)) {
            Response::error('Name, email, and message are required');
        }

        $pdo = Database::getPdo();
        $stmt = $pdo->prepare('
            INSERT INTO enquiries (id, name, email, phone, subject, message, status, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, "Offer Consultation Request", ?, "NEW", NOW(), NOW())
        ');
        $stmt->execute([Utils::generateUuid(), $name, $email, $phone, $message]);

        Response::success(['message' => 'Thank you for your enquiry. Our team will contact you shortly.']);
    }
}
