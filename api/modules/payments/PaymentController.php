<?php
declare(strict_types=1);

namespace Jadmaa\Modules\Payments;

use Jadmaa\Core\Request;
use Jadmaa\Core\Response;
use Jadmaa\Core\Utils;
use Jadmaa\Config\Database;
use Jadmaa\Services\RazorpayService;
use Jadmaa\Services\EmailService;
use Jadmaa\Middleware\AuthMiddleware;
use PDO;

class PaymentController
{
    /**
     * 1. CREATE COURSE ORDER
     */
    public function createOrder(Request $request): void
    {
        $user = AuthMiddleware::authenticate($request);
        $body = $request->getBody();
        $courseId = trim((string)($body['courseId'] ?? ''));

        if (empty($courseId)) {
            Response::error('Course ID is required');
        }

        $pdo = Database::getPdo();

        // 1. Authoritative course info from DB
        $stmt = $pdo->prepare('SELECT id, title, price, isFree, status FROM courses WHERE id = ? LIMIT 1');
        $stmt->execute([$courseId]);
        $course = $stmt->fetch();

        if (!$course || $course['status'] !== 'PUBLISHED') {
            Response::notFound('Course not found or not published');
        }

        if ((bool)$course['isFree'] || (float)$course['price'] <= 0) {
            Response::error('This course is free. Please enroll via the free enrollment option.');
        }

        // 2. Check if user is already enrolled
        $enrStmt = $pdo->prepare('SELECT id, status FROM enrollments WHERE userId = ? AND courseId = ? LIMIT 1');
        $enrStmt->execute([$user['id'], $course['id']]);
        $existingEnrollment = $enrStmt->fetch();

        if ($existingEnrollment && $existingEnrollment['status'] === 'ACTIVE') {
            Response::error('Already enrolled in this course');
        }

        $amountInINR = (float)$course['price'];
        $amountInPaise = (int)round($amountInINR * 100);
        $receipt = 'RCP_' . time() . '_' . substr(bin2hex(random_bytes(3)), 0, 6);

        // 3. Create order on Razorpay
        $rzp = RazorpayService::getInstance();
        $rzpOrder = $rzp->createOrder($amountInPaise, $receipt, [
            'courseId' => $course['id'],
            'courseTitle' => substr($course['title'], 0, 40),
            'userId' => $user['id'],
            'userEmail' => $user['email'] ?? '',
        ]);

        $orderId = $rzpOrder['id'];
        $paymentRecordId = Utils::generateUuid();

        // 4. Store local Payment record with PENDING status
        $insStmt = $pdo->prepare('
            INSERT INTO payments (
                id, userId, courseId, gateway, merchantOrderId, amount, currency, status, paymentResponse, createdAt, updatedAt
            ) VALUES (?, ?, ?, "RAZORPAY", ?, ?, "INR", "PENDING", ?, NOW(), NOW())
        ');
        $insStmt->execute([
            $paymentRecordId,
            $user['id'],
            $course['id'],
            $orderId,
            $amountInINR,
            json_encode(['rzpOrderId' => $orderId, 'receipt' => $receipt]),
        ]);

        Response::success([
            'keyId' => $rzp->getKeyId(),
            'orderId' => $orderId,
            'amount' => $amountInPaise,
            'currency' => 'INR',
            'paymentRecordId' => $paymentRecordId,
            'course' => [
                'id' => $course['id'],
                'title' => $course['title'],
            ],
            'prefill' => [
                'name' => $user['name'] ?? '',
                'email' => $user['email'] ?? '',
                'contact' => $user['phone'] ?? '',
            ]
        ]);
    }

    /**
     * 2. VERIFY RAZORPAY PAYMENT (Client callback)
     */
    public function verifyRazorpayPayment(Request $request): void
    {
        $user = AuthMiddleware::authenticate($request);
        $body = $request->getBody();

        $orderId = (string)($body['razorpay_order_id'] ?? '');
        $paymentId = (string)($body['razorpay_payment_id'] ?? '');
        $signature = (string)($body['razorpay_signature'] ?? '');

        if (empty($orderId) || empty($paymentId) || empty($signature)) {
            Response::error('Missing required Razorpay payment credentials');
        }

        $rzp = RazorpayService::getInstance();

        // 1. Verify HMAC SHA-256 signature
        if (!$rzp->verifyPaymentSignature($orderId, $paymentId, $signature)) {
            Response::error('Invalid payment signature. Verification failed.');
        }

        $pdo = Database::getPdo();

        // 2. Fetch local Payment record
        $stmt = $pdo->prepare('
            SELECT p.*, c.title AS courseTitle, c.price AS coursePrice,
                   co.offerPrice, ob.id AS offerBookingId
            FROM payments p
            JOIN courses c ON c.id = p.courseId
            LEFT JOIN course_offers co ON co.id = p.offerId
            LEFT JOIN offer_bookings ob ON ob.paymentId = p.id
            WHERE p.merchantOrderId = ? LIMIT 1
        ');
        $stmt->execute([$orderId]);
        $payment = $stmt->fetch();

        if (!$payment) {
            Response::notFound('Payment record not found for this order.');
        }

        if ($payment['userId'] !== $user['id']) {
            Response::forbidden('Forbidden: Payment does not belong to this user.');
        }

        // Idempotency: if already SUCCESS, return success immediately
        if ($payment['status'] === 'SUCCESS') {
            Response::success([
                'paymentId' => $payment['id'],
                'orderId' => $payment['merchantOrderId'],
                'courseId' => $payment['courseId'],
                'status' => 'SUCCESS',
            ], 200, 'Payment already verified and enrollment active.');
            return;
        }

        // 3. Verify payment directly with Razorpay API
        try {
            $rzpPayment = $rzp->getPayment($paymentId);
            if (($rzpPayment['order_id'] ?? '') !== $orderId) {
                Response::error('Payment does not correspond to the specified order.');
            }

            $expectedPaise = (int)round((float)$payment['amount'] * 100);
            if ((int)$rzpPayment['amount'] !== $expectedPaise || $rzpPayment['currency'] !== 'INR') {
                Response::error('Payment amount or currency mismatch detected.');
            }
        } catch (\Throwable $e) {
            error_log('[Razorpay:verifyPayment] Direct API check note: ' . $e->getMessage());
            // Fallback continues with verified HMAC signature
        }

        // 4. Database Transaction: mark Payment SUCCESS and activate Enrollment
        $pdo->beginTransaction();
        try {
            $updatePayment = $pdo->prepare('
                UPDATE payments 
                SET status = "SUCCESS", gateway = "RAZORPAY", gatewayTransactionId = ?, paidAt = NOW(),
                    paymentResponse = ?, updatedAt = NOW()
                WHERE id = ?
            ');
            $updatePayment->execute([
                $paymentId,
                json_encode([
                    'razorpay_payment_id' => $paymentId,
                    'razorpay_order_id' => $orderId,
                    'razorpay_signature' => $signature,
                    'verifiedAt' => date('c'),
                ]),
                $payment['id']
            ]);

            // Upsert enrollment
            $upsertEnr = $pdo->prepare('
                INSERT INTO enrollments (id, userId, courseId, paymentId, status, enrolledAt, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, "ACTIVE", NOW(), NOW(), NOW())
                ON DUPLICATE KEY UPDATE status = "ACTIVE", paymentId = VALUES(paymentId), updatedAt = NOW()
            ');
            $upsertEnr->execute([
                Utils::generateUuid(),
                $payment['userId'],
                $payment['courseId'],
                $payment['id']
            ]);

            if (!empty($payment['offerBookingId'])) {
                $pdo->prepare('UPDATE offer_bookings SET status = "SUCCESS", enrollmentId = ? WHERE id = ?')
                    ->execute([$payment['id'], $payment['offerBookingId']]);
            }

            if (!empty($payment['offerId'])) {
                $pdo->prepare('UPDATE course_offers SET currentBookings = currentBookings + 1 WHERE id = ?')
                    ->execute([$payment['offerId']]);
            }

            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            error_log('[Razorpay:verifyPayment] Transaction error: ' . $e->getMessage());
            Response::serverError('Error updating database payment records');
        }

        // Async admin email notification
        EmailService::sendCoursePurchaseAdminNotification([
            'userName' => $user['name'] ?? 'Student',
            'userEmail' => $user['email'] ?? '',
            'courseTitle' => $payment['courseTitle'],
            'courseId' => $payment['courseId'],
            'amount' => (float)$payment['amount'],
            'paymentId' => $paymentId,
            'orderId' => $orderId,
        ]);

        Response::success([
            'paymentId' => $payment['id'],
            'orderId' => $orderId,
            'courseId' => $payment['courseId'],
            'status' => 'SUCCESS',
        ], 200, 'Payment verified and course unlocked successfully.');
    }

    /**
     * 3. RAZORPAY WEBHOOK HANDLER
     */
    public function razorpayWebhook(Request $request): void
    {
        $signature = $request->getHeader('x-razorpay-signature');
        if (empty($signature)) {
            Response::error('Missing x-razorpay-signature header', 400);
        }

        $rawBody = $request->getRawBody();
        $rzp = RazorpayService::getInstance();

        if (!$rzp->verifyWebhookSignature($rawBody, $signature)) {
            Response::error('Invalid webhook signature', 400);
        }

        $event = json_decode($rawBody, true);
        $eventType = $event['event'] ?? '';

        $pdo = Database::getPdo();

        if ($eventType === 'order.paid' || $eventType === 'payment.captured') {
            $paymentEntity = $event['payload']['payment']['entity'] ?? [];
            $orderId = $paymentEntity['order_id'] ?? ($event['payload']['order']['entity']['id'] ?? null);
            $paymentId = $paymentEntity['id'] ?? null;

            if ($orderId) {
                // 1. Check Course Payment
                $stmt = $pdo->prepare('SELECT * FROM payments WHERE merchantOrderId = ? LIMIT 1');
                $stmt->execute([$orderId]);
                $payment = $stmt->fetch();

                if ($payment) {
                    if ($payment['status'] !== 'SUCCESS') {
                        $pdo->beginTransaction();
                        try {
                            $pdo->prepare('
                                UPDATE payments 
                                SET status = "SUCCESS", gateway = "RAZORPAY", gatewayTransactionId = ?, paidAt = NOW(), paymentResponse = ?
                                WHERE id = ?
                            ')->execute([$paymentId, $rawBody, $payment['id']]);

                            $pdo->prepare('
                                INSERT INTO enrollments (id, userId, courseId, paymentId, status, enrolledAt, createdAt, updatedAt)
                                VALUES (?, ?, ?, ?, "ACTIVE", NOW(), NOW(), NOW())
                                ON DUPLICATE KEY UPDATE status = "ACTIVE", paymentId = VALUES(paymentId), updatedAt = NOW()
                            ')->execute([Utils::generateUuid(), $payment['userId'], $payment['courseId'], $payment['id']]);

                            $pdo->commit();
                        } catch (\Throwable $e) {
                            $pdo->rollBack();
                        }
                    }
                } else {
                    // 2. Check E-Commerce Order
                    $orderStmt = $pdo->prepare('SELECT * FROM orders WHERE merchantOrderId = ? LIMIT 1');
                    $orderStmt->execute([$orderId]);
                    $productOrder = $orderStmt->fetch();

                    if ($productOrder && $productOrder['paymentStatus'] !== 'SUCCESS') {
                        $pdo->beginTransaction();
                        try {
                            // Deduct inventory
                            $itemStmt = $pdo->prepare('SELECT productId, quantity FROM order_items WHERE orderId = ?');
                            $itemStmt->execute([$productOrder['id']]);
                            $items = $itemStmt->fetchAll();

                            foreach ($items as $item) {
                                if ($item['productId']) {
                                    $pStmt = $pdo->prepare('SELECT stockQuantity FROM products WHERE id = ?');
                                    $pStmt->execute([$item['productId']]);
                                    $prevStock = (int)$pStmt->fetchColumn();
                                    $newStock = max(0, $prevStock - (int)$item['quantity']);

                                    $pdo->prepare('UPDATE products SET stockQuantity = ? WHERE id = ?')
                                        ->execute([$newStock, $item['productId']]);

                                    $pdo->prepare('
                                        INSERT INTO inventory_transactions (id, productId, orderId, transactionType, quantityChanged, previousStock, updatedStock, reason, performedBy, createdAt)
                                        VALUES (?, ?, ?, "STOCK_DEDUCTION", ?, ?, ?, "Order payment verified via Webhook", "SYSTEM / Webhook", NOW())
                                    ')->execute([Utils::generateUuid(), $item['productId'], $productOrder['id'], -(int)$item['quantity'], $prevStock, $newStock]);
                                }
                            }

                            $pdo->prepare('
                                UPDATE orders 
                                SET paymentStatus = "SUCCESS", paymentTransactionId = ?, orderStatus = "CONFIRMED", updatedAt = NOW()
                                WHERE id = ?
                            ')->execute([$paymentId, $productOrder['id']]);

                            $pdo->commit();
                        } catch (\Throwable $e) {
                            $pdo->rollBack();
                        }
                    }
                }
            }
        } elseif ($eventType === 'payment.failed') {
            $paymentEntity = $event['payload']['payment']['entity'] ?? [];
            $orderId = $paymentEntity['order_id'] ?? null;
            $paymentId = $paymentEntity['id'] ?? null;

            if ($orderId) {
                $pdo->prepare('
                    UPDATE payments 
                    SET status = "FAILED", gatewayTransactionId = ?, paymentResponse = ?
                    WHERE merchantOrderId = ? AND status != "SUCCESS"
                ')->execute([$paymentId, $rawBody, $orderId]);
            }
        }

        Response::json(['status' => 'ok']);
    }

    /**
     * 4. CHECK PAYMENT STATUS BY ORDER ID
     */
    public function checkPaymentStatus(Request $request): void
    {
        $merchantOrderId = $request->getParam('merchantOrderId');
        if (empty($merchantOrderId)) {
            Response::error('Order ID is required');
        }

        $pdo = Database::getPdo();
        $stmt = $pdo->prepare('
            SELECT p.*, c.title AS courseTitle 
            FROM payments p
            LEFT JOIN courses c ON c.id = p.courseId
            WHERE p.merchantOrderId = ? LIMIT 1
        ');
        $stmt->execute([$merchantOrderId]);
        $payment = $stmt->fetch();

        if (!$payment) {
            Response::notFound('Payment record not found');
        }

        Response::success([
            'id' => $payment['id'],
            'merchantOrderId' => $payment['merchantOrderId'],
            'gatewayTransactionId' => $payment['gatewayTransactionId'],
            'gateway' => $payment['gateway'],
            'status' => $payment['status'],
            'amount' => (float)$payment['amount'],
            'courseId' => $payment['courseId'],
            'courseTitle' => $payment['courseTitle'],
            'paidAt' => $payment['paidAt'],
        ]);
    }
}
