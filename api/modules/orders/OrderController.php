<?php
declare(strict_types=1);

namespace Jadmaa\Modules\Orders;

use Jadmaa\Core\Request;
use Jadmaa\Core\Response;
use Jadmaa\Core\Utils;
use Jadmaa\Config\Database;
use Jadmaa\Services\RazorpayService;
use Jadmaa\Services\EmailService;
use Jadmaa\Middleware\AuthMiddleware;
use PDO;

class OrderController
{
    private function generateOrderNumber(): string
    {
        $dateStr = date('Ymd');
        $random = rand(1000, 9999);
        return "JAD-{$dateStr}-{$random}";
    }

    /**
     * 1. INITIATE PRODUCT CHECKOUT
     */
    public function createOrder(Request $request): void
    {
        $user = AuthMiddleware::authenticate($request);
        $body = $request->getBody();

        $items = $body['items'] ?? [];
        $shippingAddress = trim((string)($body['shippingAddress'] ?? ''));
        $shippingPincode = trim((string)($body['shippingPincode'] ?? ''));
        $customerPhone = trim((string)($body['customerPhone'] ?? ($user['phone'] ?? '')));
        $notes = $body['notes'] ?? null;

        if (!is_array($items) || count($items) === 0) {
            Response::error('Cart items are required');
        }

        if (strlen($shippingAddress) < 5) {
            Response::error('Please provide a valid delivery address');
        }

        if (!preg_match('/^\d{6}$/', $shippingPincode)) {
            Response::error('Please provide a valid 6-digit delivery pincode');
        }

        if (empty($customerPhone)) {
            Response::error('Contact phone number is required for shipping');
        }

        $pdo = Database::getPdo();

        // 1. Authoritative product lookup and stock validation
        $productMap = [];
        $subtotal = 0.0;
        $orderItemSnapshots = [];

        foreach ($items as $item) {
            $prodId = $item['productId'] ?? null;
            $qty = (int)($item['quantity'] ?? 0);

            if (!$prodId || $qty <= 0) {
                Response::error('Invalid product or quantity in cart');
            }

            $stmt = $pdo->prepare('SELECT * FROM products WHERE id = ? AND isActive = 1 LIMIT 1');
            $stmt->execute([$prodId]);
            $prod = $stmt->fetch();

            if (!$prod) {
                Response::error('One or more selected products are no longer available.');
            }

            if ((int)$prod['stockQuantity'] < $qty) {
                Response::error("Insufficient stock for product '{$prod['name']}'. Available: {$prod['stockQuantity']}");
            }

            $unitPrice = (float)$prod['price'];
            $lineTotal = $unitPrice * $qty;
            $subtotal += $lineTotal;

            $images = json_decode($prod['images'] ?: '[]', true);
            $firstImage = is_array($images) && count($images) > 0 ? $images[0] : null;

            $orderItemSnapshots[] = [
                'id' => Utils::generateUuid(),
                'productId' => $prod['id'],
                'productName' => $prod['name'],
                'sku' => $prod['sku'],
                'image' => $firstImage,
                'unitPrice' => $unitPrice,
                'quantity' => $qty,
                'lineTotal' => $lineTotal,
            ];
        }

        $shippingCharge = 0.0; // Free shipping or configurable
        $discountAmount = 0.0;
        $totalAmount = $subtotal + $shippingCharge - $discountAmount;
        $amountInPaise = (int)round($totalAmount * 100);

        $orderNumber = $this->generateOrderNumber();
        $orderId = Utils::generateUuid();

        // 2. Create Razorpay order
        $rzp = RazorpayService::getInstance();
        $receipt = 'ORD_' . time() . '_' . substr(bin2hex(random_bytes(3)), 0, 6);

        $rzpOrder = $rzp->createOrder($amountInPaise, $receipt, [
            'orderNumber' => $orderNumber,
            'userId' => $user['id'],
            'customerName' => $user['name'] ?? '',
        ]);

        $rzpOrderId = $rzpOrder['id'];

        // 3. Insert Order & Order Items in Transaction
        $pdo->beginTransaction();
        try {
            $insOrder = $pdo->prepare('
                INSERT INTO orders (
                    id, orderNumber, userId, subtotal, shippingCharge, discountAmount, totalAmount,
                    shippingAddress, shippingPincode, customerName, customerPhone, paymentMethod,
                    paymentStatus, merchantOrderId, orderStatus, notes, createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "RAZORPAY", "PENDING", ?, "PENDING", ?, NOW(), NOW())
            ');
            $insOrder->execute([
                $orderId,
                $orderNumber,
                $user['id'],
                $subtotal,
                $shippingCharge,
                $discountAmount,
                $totalAmount,
                $shippingAddress,
                $shippingPincode,
                $user['name'] ?? 'Customer',
                $customerPhone,
                $rzpOrderId,
                $notes,
            ]);

            $insItem = $pdo->prepare('
                INSERT INTO order_items (id, orderId, productId, productName, sku, image, unitPrice, quantity, lineTotal, createdAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ');
            foreach ($orderItemSnapshots as $oi) {
                $insItem->execute([
                    $oi['id'],
                    $orderId,
                    $oi['productId'],
                    $oi['productName'],
                    $oi['sku'],
                    $oi['image'],
                    $oi['unitPrice'],
                    $oi['quantity'],
                    $oi['lineTotal'],
                ]);
            }

            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            error_log('[OrderController:createOrder] DB insert failed: ' . $e->getMessage());
            Response::serverError('Failed to record order details in database');
        }

        Response::success([
            'keyId' => $rzp->getKeyId(),
            'orderId' => $rzpOrderId,
            'localOrderId' => $orderId,
            'orderNumber' => $orderNumber,
            'amount' => $amountInPaise,
            'currency' => 'INR',
            'prefill' => [
                'name' => $user['name'] ?? '',
                'email' => $user['email'] ?? '',
                'contact' => $customerPhone,
            ]
        ]);
    }

    /**
     * 2. VERIFY PRODUCT ORDER PAYMENT (Client callback)
     */
    public function verifyOrderPayment(Request $request): void
    {
        $user = AuthMiddleware::authenticate($request);
        $body = $request->getBody();

        $orderId = (string)($body['razorpay_order_id'] ?? '');
        $paymentId = (string)($body['razorpay_payment_id'] ?? '');
        $signature = (string)($body['razorpay_signature'] ?? '');

        if (empty($orderId) || empty($paymentId) || empty($signature)) {
            Response::error('Missing required Razorpay credentials');
        }

        $rzp = RazorpayService::getInstance();

        if (!$rzp->verifyPaymentSignature($orderId, $paymentId, $signature)) {
            Response::error('Invalid payment signature');
        }

        $pdo = Database::getPdo();

        $stmt = $pdo->prepare('SELECT * FROM orders WHERE merchantOrderId = ? LIMIT 1');
        $stmt->execute([$orderId]);
        $order = $stmt->fetch();

        if (!$order) {
            Response::notFound('Order record not found');
        }

        if ($order['userId'] !== $user['id']) {
            Response::forbidden('Forbidden: Order does not belong to you');
        }

        if ($order['paymentStatus'] === 'SUCCESS') {
            Response::success([
                'orderId' => $order['id'],
                'orderNumber' => $order['orderNumber'],
                'status' => 'SUCCESS',
            ], 200, 'Order payment already verified.');
            return;
        }

        // Deduct inventory and confirm order
        $pdo->beginTransaction();
        try {
            $itemsStmt = $pdo->prepare('SELECT productId, quantity, productName FROM order_items WHERE orderId = ?');
            $itemsStmt->execute([$order['id']]);
            $items = $itemsStmt->fetchAll();

            foreach ($items as $item) {
                if ($item['productId']) {
                    $pStmt = $pdo->prepare('SELECT stockQuantity FROM products WHERE id = ? LIMIT 1');
                    $pStmt->execute([$item['productId']]);
                    $prev = (int)$pStmt->fetchColumn();
                    $newStock = max(0, $prev - (int)$item['quantity']);

                    $pdo->prepare('UPDATE products SET stockQuantity = ? WHERE id = ?')
                        ->execute([$newStock, $item['productId']]);

                    $pdo->prepare('
                        INSERT INTO inventory_transactions (id, productId, orderId, transactionType, quantityChanged, previousStock, updatedStock, reason, performedBy, createdAt)
                        VALUES (?, ?, ?, "STOCK_DEDUCTION", ?, ?, ?, ?, "SYSTEM / Order Payment", NOW())
                    ')->execute([
                        Utils::generateUuid(),
                        $item['productId'],
                        $order['id'],
                        -(int)$item['quantity'],
                        $prev,
                        $newStock,
                        "Order #{$order['orderNumber']} payment verified",
                    ]);
                }
            }

            $updateOrder = $pdo->prepare('
                UPDATE orders 
                SET paymentStatus = "SUCCESS", paymentTransactionId = ?, orderStatus = "CONFIRMED", updatedAt = NOW()
                WHERE id = ?
            ');
            $updateOrder->execute([$paymentId, $order['id']]);

            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            error_log('[OrderController:verifyOrderPayment] Transaction error: ' . $e->getMessage());
            Response::serverError('Database update failed');
        }

        // Async admin email
        EmailService::sendProductOrderAdminNotification([
            'orderNumber' => $order['orderNumber'],
            'userName' => $order['customerName'],
            'userEmail' => $user['email'] ?? '',
            'userPhone' => $order['customerPhone'],
            'deliveryAddress' => $order['shippingAddress'],
            'deliveryPincode' => $order['shippingPincode'],
            'totalAmount' => (float)$order['totalAmount'],
        ]);

        Response::success([
            'orderId' => $order['id'],
            'orderNumber' => $order['orderNumber'],
            'status' => 'SUCCESS',
        ], 200, 'Order payment verified and order confirmed successfully.');
    }

    public function getUserOrders(Request $request): void
    {
        $user = AuthMiddleware::authenticate($request);
        $pdo = Database::getPdo();

        $stmt = $pdo->prepare('
            SELECT * FROM orders 
            WHERE userId = ? 
            ORDER BY createdAt DESC
        ');
        $stmt->execute([$user['id']]);
        $orders = $stmt->fetchAll();

        $result = array_map(function ($ord) use ($pdo) {
            $itStmt = $pdo->prepare('SELECT * FROM order_items WHERE orderId = ?');
            $itStmt->execute([$ord['id']]);
            $ord['items'] = $itStmt->fetchAll();
            $ord['totalAmount'] = (float)$ord['totalAmount'];
            return $ord;
        }, $orders);

        Response::success($result);
    }

    public function getUserOrderById(Request $request): void
    {
        $user = AuthMiddleware::authenticate($request);
        $orderId = $request->getParam('id');

        $pdo = Database::getPdo();
        $stmt = $pdo->prepare('SELECT * FROM orders WHERE id = ? AND userId = ? LIMIT 1');
        $stmt->execute([$orderId, $user['id']]);
        $ord = $stmt->fetch();

        if (!$ord) {
            Response::notFound('Order not found');
        }

        $itStmt = $pdo->prepare('SELECT * FROM order_items WHERE orderId = ?');
        $itStmt->execute([$ord['id']]);
        $ord['items'] = $itStmt->fetchAll();
        $ord['totalAmount'] = (float)$ord['totalAmount'];

        Response::success($ord);
    }

    // ==========================================
    // ADMIN ORDER MANAGEMENT
    // ==========================================

    public function adminGetOrders(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $pdo = Database::getPdo();

        $stmt = $pdo->query('
            SELECT o.*, u.name AS userName, u.email AS userEmail
            FROM orders o
            JOIN users u ON u.id = o.userId
            ORDER BY o.createdAt DESC
        ');
        $orders = $stmt->fetchAll();

        $result = array_map(function ($ord) use ($pdo) {
            $itStmt = $pdo->prepare('SELECT COUNT(*) FROM order_items WHERE orderId = ?');
            $itStmt->execute([$ord['id']]);
            $ord['itemCount'] = (int)$itStmt->fetchColumn();
            $ord['totalAmount'] = (float)$ord['totalAmount'];
            return $ord;
        }, $orders);

        Response::success($result);
    }

    public function adminGetOrderById(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $id = $request->getParam('id');
        $pdo = Database::getPdo();

        $stmt = $pdo->prepare('
            SELECT o.*, u.name AS userName, u.email AS userEmail
            FROM orders o
            JOIN users u ON u.id = o.userId
            WHERE o.id = ? LIMIT 1
        ');
        $stmt->execute([$id]);
        $ord = $stmt->fetch();

        if (!$ord) {
            Response::notFound('Order not found');
        }

        $itStmt = $pdo->prepare('SELECT * FROM order_items WHERE orderId = ?');
        $itStmt->execute([$ord['id']]);
        $ord['items'] = $itStmt->fetchAll();

        Response::success($ord);
    }

    public function adminUpdateOrderStatus(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $id = $request->getParam('id');
        $body = $request->getBody();

        $orderStatus = $body['orderStatus'] ?? null;
        $trackingNumber = $body['trackingNumber'] ?? null;

        $pdo = Database::getPdo();
        $fields = [];
        $params = [];

        if ($orderStatus) {
            $fields[] = 'orderStatus = ?';
            $params[] = $orderStatus;
        }

        if ($trackingNumber !== null) {
            $fields[] = 'trackingNumber = ?';
            $params[] = $trackingNumber;
        }

        if (empty($fields)) {
            Response::error('Nothing to update');
        }

        $params[] = $id;
        $sql = 'UPDATE orders SET ' . implode(', ', $fields) . ', updatedAt = NOW() WHERE id = ?';
        $pdo->prepare($sql)->execute($params);

        Response::success(['message' => 'Order status updated']);
    }
}
