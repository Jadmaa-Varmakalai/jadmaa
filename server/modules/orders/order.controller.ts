import { Request, Response } from 'express';
import { prisma } from '../../db.js';
import { razorpayService } from '../payments/razorpay.service.js';
import {
  sendProductOrderAdminNotificationEmail,
  sendProductOrderCustomerConfirmationEmail,
} from '../../services/email/email.service.js';

/**
 * Helper to generate order numbers like JAD-20261021-9876
 */
const generateOrderNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `JAD-${dateStr}-${randomSuffix}`;
};

/**
 * 1. Checkout Initiation
 * Validates stock, calculates server-side totals, creates Razorpay order & local pending order
 */
export const createOrder = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) {
      return res.status(401).json({ success: false, error: { message: 'Authentication required' } });
    }

    const { items, shippingAddress, shippingPincode, customerPhone, notes } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: { message: 'Cart items are required' } });
    }

    if (!shippingAddress || typeof shippingAddress !== 'string' || shippingAddress.trim().length < 5) {
      return res.status(400).json({ success: false, error: { message: 'Please provide a valid delivery address' } });
    }

    const cleanPincode = (shippingPincode || '').toString().trim();
    if (!/^\d{6}$/.test(cleanPincode)) {
      return res.status(400).json({ success: false, error: { message: 'Please provide a valid 6-digit delivery pincode' } });
    }

    const finalPhone = (customerPhone || user.phone || '').trim();
    if (!finalPhone) {
      return res.status(400).json({ success: false, error: { message: 'Contact phone number is required for shipping' } });
    }

    // Extract product IDs and requested quantities
    const productRequests = new Map<string, number>();
    for (const item of items) {
      if (!item.productId || typeof item.productId !== 'string') {
        return res.status(400).json({ success: false, error: { message: 'Invalid product in cart' } });
      }
      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({ success: false, error: { message: 'Quantity must be at least 1' } });
      }
      const currentQty = productRequests.get(item.productId) || 0;
      productRequests.set(item.productId, currentQty + qty);
    }

    const productIds = Array.from(productRequests.keys());

    // Fetch authoritative product data from database
    const dbProducts = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
      },
    });

    if (dbProducts.length !== productIds.length) {
      return res.status(400).json({
        success: false,
        error: { message: 'One or more selected products are no longer available.' },
      });
    }

    // Verify stock availability and compute authoritative amounts
    let subtotal = 0;
    const orderItemSnapshots: any[] = [];

    for (const product of dbProducts) {
      const requestedQty = productRequests.get(product.id) || 0;

      if (product.stockQuantity < requestedQty) {
        return res.status(400).json({
          success: false,
          error: {
            message: `Insufficient stock for "${product.name}". Available: ${product.stockQuantity}, Requested: ${requestedQty}`,
          },
        });
      }

      const unitPrice = product.price;
      const lineTotal = Math.round(unitPrice * requestedQty * 100) / 100;
      subtotal += lineTotal;

      orderItemSnapshots.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        image: product.images && product.images.length > 0 ? product.images[0] : null,
        unitPrice,
        quantity: requestedQty,
        lineTotal,
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;
    // Free shipping above ₹999, else flat ₹50
    const shippingCharge = subtotal >= 999 ? 0 : 50;
    const discountAmount = 0;
    const totalAmount = Math.round((subtotal + shippingCharge - discountAmount) * 100) / 100;

    const orderNumber = generateOrderNumber();
    const amountInPaise = Math.round(totalAmount * 100);

    // Create order on Razorpay
    const rzpOrder = await razorpayService.createOrder({
      amountInPaise,
      currency: 'INR',
      receipt: orderNumber,
      notes: {
        orderNumber,
        userId: user.id,
        userEmail: user.email || '',
        customerName: user.name || '',
      },
    });

    // Create pending Order and OrderItems in database
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        subtotal,
        shippingCharge,
        discountAmount,
        totalAmount,
        shippingAddress: shippingAddress.trim(),
        shippingPincode: cleanPincode,
        customerName: user.name || 'Valued Customer',
        customerPhone: finalPhone,
        paymentMethod: 'RAZORPAY',
        paymentStatus: 'PENDING',
        merchantOrderId: rzpOrder.id,
        orderStatus: 'PENDING',
        notes: notes?.trim() || null,
        items: {
          create: orderItemSnapshots,
        },
      },
      include: {
        items: true,
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        subtotal: order.subtotal,
        shippingCharge: order.shippingCharge,
        totalAmount: order.totalAmount,
        currency: 'INR',
        razorpayOrderId: rzpOrder.id,
        keyId: razorpayService.getKeyId(),
        customer: {
          name: user.name,
          email: user.email,
          phone: finalPhone,
        },
      },
    });
  } catch (err: any) {
    console.error('[Orders:createOrder:Error]', err);
    return res.status(500).json({ success: false, error: { message: err?.message || 'Failed to initiate order' } });
  }
};

/**
 * 2. Payment Verification
 * Validates HMAC signature, confirms Razorpay status, atomically deducts stock, records inventory transactions
 */
export const verifyOrderPayment = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) {
      return res.status(401).json({ success: false, error: { message: 'Authentication required' } });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, error: { message: 'Missing Razorpay payment parameters' } });
    }

    // 1. Verify HMAC SHA-256 signature
    const isValidSignature = razorpayService.verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValidSignature) {
      console.warn(`[Orders:verifyOrderPayment] Invalid signature for order ${razorpay_order_id}`);
      return res.status(400).json({ success: false, error: { message: 'Invalid payment signature' } });
    }

    // 2. Fetch local order record
    const order = await prisma.order.findUnique({
      where: { merchantOrderId: razorpay_order_id },
      include: {
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, error: { message: 'Order record not found' } });
    }

    if (order.userId !== user.id) {
      return res.status(403).json({ success: false, error: { message: 'Forbidden: Order does not belong to you' } });
    }

    // Idempotency check: If already SUCCESS, return confirmed order immediately
    if (order.paymentStatus === 'SUCCESS') {
      return res.status(200).json({
        success: true,
        message: 'Payment already verified.',
        data: order,
      });
    }

    // 3. Verify payment with Razorpay API directly
    try {
      const rzpPayment = await razorpayService.getPayment(razorpay_payment_id);
      if (rzpPayment.order_id !== razorpay_order_id) {
        return res.status(400).json({ success: false, error: { message: 'Payment does not match this order' } });
      }

      const expectedPaise = Math.round(order.totalAmount * 100);
      if (Number(rzpPayment.amount) !== expectedPaise) {
        console.error(`[Orders:verify] Amount mismatch! Rzp: ${rzpPayment.amount}, Order: ${expectedPaise}`);
        return res.status(400).json({ success: false, error: { message: 'Payment amount mismatch detected.' } });
      }
    } catch (rzpErr: any) {
      console.error('[Orders:verifyOrderPayment:RzpFetchFailed]', rzpErr);
      return res.status(400).json({ success: false, error: { message: 'Failed to verify payment status with gateway' } });
    }

    // 4. Atomic transaction: Deduct stock, log inventory transactions, update Order status
    const confirmedOrder = await prisma.$transaction(async (tx) => {
      // Re-verify stock inside transaction to prevent race condition / overselling
      for (const item of order.items) {
        if (item.productId) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            throw new Error(`Product ${item.productName} no longer exists.`);
          }

          if (product.stockQuantity < item.quantity) {
            throw new Error(`Insufficient stock for ${item.productName}. Available: ${product.stockQuantity}, Required: ${item.quantity}`);
          }

          // Decrement stock
          const updatedProd = await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                decrement: item.quantity,
              },
            },
          });

          // Log inventory transaction
          await tx.inventoryTransaction.create({
            data: {
              productId: item.productId,
              orderId: order.id,
              transactionType: 'STOCK_DEDUCTION',
              quantityChanged: -item.quantity,
              previousStock: product.stockQuantity,
              updatedStock: updatedProd.stockQuantity,
              reason: `Order #${order.orderNumber} payment verified`,
              performedBy: `SYSTEM / Razorpay`,
            },
          });
        }
      }

      // Mark order as paid and confirmed
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'SUCCESS',
          paymentTransactionId: razorpay_payment_id,
          orderStatus: 'CONFIRMED',
        },
        include: {
          items: true,
          user: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
      });

      return updatedOrder;
    });

    // Send email notification to Admin containing customer name, email, phone, delivery address, products, price, and quantities
    const orderCustomerName = confirmedOrder.customerName || user.name || 'Valued Customer';
    const orderCustomerEmail = user.email || confirmedOrder.user?.email || '';
    const orderCustomerPhone = confirmedOrder.customerPhone || user.phone || '';

    sendProductOrderAdminNotificationEmail({
      orderNumber: confirmedOrder.orderNumber,
      orderId: confirmedOrder.id,
      userName: orderCustomerName,
      userEmail: orderCustomerEmail,
      userPhone: orderCustomerPhone,
      deliveryAddress: confirmedOrder.shippingAddress,
      deliveryPincode: confirmedOrder.shippingPincode,
      items: confirmedOrder.items.map((item) => ({
        productName: item.productName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
        sku: item.sku,
        image: item.image,
      })),
      subtotal: confirmedOrder.subtotal,
      shippingCharge: confirmedOrder.shippingCharge,
      totalAmount: confirmedOrder.totalAmount,
      paymentMethod: confirmedOrder.paymentMethod,
      paymentId: razorpay_payment_id,
    }).catch((emailErr) => {
      console.error('[Orders:verifyOrderPayment] Failed to send admin order notification email:', emailErr);
    });

    // Send confirmation receipt to customer if valid email is present
    if (orderCustomerEmail) {
      sendProductOrderCustomerConfirmationEmail({
        orderNumber: confirmedOrder.orderNumber,
        orderId: confirmedOrder.id,
        userName: orderCustomerName,
        userEmail: orderCustomerEmail,
        userPhone: orderCustomerPhone,
        deliveryAddress: confirmedOrder.shippingAddress,
        deliveryPincode: confirmedOrder.shippingPincode,
        items: confirmedOrder.items.map((item) => ({
          productName: item.productName,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          lineTotal: item.lineTotal,
          sku: item.sku,
          image: item.image,
        })),
        subtotal: confirmedOrder.subtotal,
        shippingCharge: confirmedOrder.shippingCharge,
        totalAmount: confirmedOrder.totalAmount,
        paymentMethod: confirmedOrder.paymentMethod,
        paymentId: razorpay_payment_id,
      }).catch((emailErr) => {
        console.error('[Orders:verifyOrderPayment] Failed to send customer order receipt email:', emailErr);
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully and order confirmed!',
      data: confirmedOrder,
    });
  } catch (err: any) {
    console.error('[Orders:verifyOrderPayment:Error]', err);
    return res.status(500).json({ success: false, error: { message: err?.message || 'Payment verification failed' } });
  }
};

/**
 * 3. Logged-in User: Get My Orders
 */
export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) {
      return res.status(401).json({ success: false, error: { message: 'Authentication required' } });
    }

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
      },
    });

    return res.status(200).json({ success: true, data: orders });
  } catch (err: any) {
    console.error('[Orders:getUserOrders:Error]', err);
    return res.status(500).json({ success: false, error: { message: err?.message || 'Failed to fetch orders' } });
  }
};

/**
 * 4. Logged-in User: Get My Order by ID or Order Number
 */
export const getUserOrderById = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }, { merchantOrderId: id }],
        userId: user.id,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, error: { message: 'Order not found' } });
    }

    return res.status(200).json({ success: true, data: order });
  } catch (err: any) {
    console.error('[Orders:getUserOrderById:Error]', err);
    return res.status(500).json({ success: false, error: { message: err?.message || 'Failed to fetch order details' } });
  }
};

/**
 * 5. Admin: List All Orders with Filters
 */
export const adminGetOrders = async (req: Request, res: Response) => {
  try {
    const { orderStatus, paymentStatus, search, page = '1', limit = '50' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (orderStatus && typeof orderStatus === 'string' && orderStatus.trim()) {
      where.orderStatus = orderStatus.trim();
    }

    if (paymentStatus && typeof paymentStatus === 'string' && paymentStatus.trim()) {
      where.paymentStatus = paymentStatus.trim();
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { orderNumber: { contains: q, mode: 'insensitive' } },
        { customerName: { contains: q, mode: 'insensitive' } },
        { customerPhone: { contains: q, mode: 'insensitive' } },
        { shippingPincode: { contains: q, mode: 'insensitive' } },
        { paymentTransactionId: { contains: q, mode: 'insensitive' } },
        { merchantOrderId: { contains: q, mode: 'insensitive' } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true },
          },
          items: true,
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    console.error('[Orders:adminGetOrders:Error]', err);
    return res.status(500).json({ success: false, error: { message: err?.message || 'Failed to fetch admin orders' } });
  }
};

/**
 * 6. Admin: Get Single Order Detail
 */
export const adminGetOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }, { merchantOrderId: id }],
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, stockQuantity: true },
            },
          },
        },
        inventoryTransactions: true,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, error: { message: 'Order not found' } });
    }

    return res.status(200).json({ success: true, data: order });
  } catch (err: any) {
    console.error('[Orders:adminGetOrderById:Error]', err);
    return res.status(500).json({ success: false, error: { message: err?.message || 'Failed to fetch order' } });
  }
};

/**
 * 7. Admin: Update Order Status & Handle Stock Restoration on Cancellation
 */
export const adminUpdateOrderStatus = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { orderStatus, trackingNumber, notes, paymentStatus } = req.body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, error: { message: 'Order not found' } });
    }

    const isCancelling = orderStatus === 'CANCELLED';
    const wasPaid = order.paymentStatus === 'SUCCESS';
    const needsStockRestoration = isCancelling && wasPaid && !order.isStockRestored;

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // If order is cancelled and stock was deducted, restore stock safely and record history
      if (needsStockRestoration) {
        for (const item of order.items) {
          if (item.productId) {
            const currentProd = await tx.product.findUnique({
              where: { id: item.productId },
            });

            if (currentProd) {
              const updatedProd = await tx.product.update({
                where: { id: item.productId },
                data: {
                  stockQuantity: {
                    increment: item.quantity,
                  },
                },
              });

              await tx.inventoryTransaction.create({
                data: {
                  productId: item.productId,
                  orderId: order.id,
                  transactionType: 'STOCK_RESTORATION',
                  quantityChanged: item.quantity,
                  previousStock: currentProd.stockQuantity,
                  updatedStock: updatedProd.stockQuantity,
                  reason: `Stock restored due to order cancellation (#${order.orderNumber})`,
                  performedBy: user?.name || user?.email || 'Admin',
                },
              });
            }
          }
        }
      }

      return await tx.order.update({
        where: { id },
        data: {
          orderStatus: orderStatus !== undefined ? orderStatus : undefined,
          paymentStatus: paymentStatus !== undefined ? paymentStatus : undefined,
          trackingNumber: trackingNumber !== undefined ? (trackingNumber?.trim() || null) : undefined,
          notes: notes !== undefined ? (notes?.trim() || null) : undefined,
          isStockRestored: needsStockRestoration ? true : undefined,
        },
        include: {
          items: true,
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });
    });

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${updatedOrder.orderStatus}${needsStockRestoration ? ' and stock restored' : ''}`,
      data: updatedOrder,
    });
  } catch (err: any) {
    console.error('[Orders:adminUpdateOrderStatus:Error]', err);
    return res.status(500).json({ success: false, error: { message: err?.message || 'Failed to update order status' } });
  }
};
