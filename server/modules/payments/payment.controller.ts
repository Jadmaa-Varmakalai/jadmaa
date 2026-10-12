import { Request, Response } from 'express';
import { prisma } from '../../db.js';
import crypto from 'crypto';
import { razorpayService } from './razorpay.service.js';
import { invalidateUserCache } from '../../middleware/auth.middleware.js';
import { invalidateProgressCache } from '../progress/progress.controller.js';
import { sendCoursePurchaseAdminNotificationEmail } from '../../services/email/email.service.js';

/**
 * 1. CREATE ORDER (Razorpay is the PRIMARY & ONLY customer-facing gateway)
 * Creates order on Razorpay and local Payment record with PENDING status.
 */
export const createOrder = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const { courseId } = req.body;
    if (!courseId) {
      return res.status(400).json({ success: false, error: { message: 'Course ID is required' } });
    }

    console.log(`[Razorpay:createOrder] Started for user ${user.id}, courseId ${courseId}`);

    // Retrieve authoritative course information from DB
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        price: true,
        isFree: true,
        status: true,
      },
    });

    if (!course || course.status !== 'PUBLISHED') {
      console.warn(`[Razorpay:createOrder] Course not found or not published: ${courseId}`);
      return res.status(404).json({ success: false, error: { message: 'Course not found or not published' } });
    }

    console.log(`[Razorpay:createOrder] Course loaded: "${course.title}", price: ₹${course.price}`);

    // Check if user is already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: course.id,
        },
      },
    });

    if (existingEnrollment && existingEnrollment.status === 'ACTIVE') {
      console.warn(`[Razorpay:createOrder] User ${user.id} already enrolled in course ${course.id}`);
      return res.status(400).json({ success: false, error: { message: 'Already enrolled in this course' } });
    }

    if (course.isFree || course.price <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'This course is free. Please enroll via the free enrollment option.' },
      });
    }

    // Amount authoritative check in INR and paise
    const amountInINR = Number(course.price);
    const amountInPaise = Math.round(amountInINR * 100);

    // Generate unique local receipt / transaction reference
    const receipt = `RCP_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    const keyId = process.env.RAZORPAY_KEY_ID || '';
    const isTestMode = keyId.startsWith('rzp_test_');
    const maskedKey = keyId.length > 9 ? keyId.substring(0, 13) + '...' : 'MISSING';
    
    console.log(`[Razorpay] Creating order`);
    console.log(`[Razorpay] Mode: ${isTestMode ? 'TEST' : 'LIVE'}`);
    console.log(`[Razorpay] Key ID prefix: ${maskedKey}`);
    console.log(`[Razorpay] amount: ${amountInPaise}`);
    console.log(`[Razorpay] currency: INR`);

    // Create Razorpay order on server
    const rzpOrder = await razorpayService.createOrder({
      amountInPaise,
      currency: 'INR',
      receipt,
      notes: {
        courseId: course.id,
        courseTitle: course.title.substring(0, 40),
        userId: user.id,
        userEmail: user.email || '',
      },
    });

    console.log(`[Razorpay] order_id: ${rzpOrder.id}`);

    // Store local Payment record with PENDING status and gateway RAZORPAY
    const paymentRecord = await prisma.payment.create({
      data: {
        userId: user.id,
        courseId: course.id,
        gateway: 'RAZORPAY',
        merchantOrderId: rzpOrder.id, // Store Razorpay Order ID as merchantOrderId
        amount: amountInINR,
        currency: 'INR',
        status: 'PENDING',
        paymentResponse: JSON.stringify({ rzpOrderId: rzpOrder.id, receipt }),
      },
    });

    console.log(`[Razorpay:createOrder] Local Payment record created: ${paymentRecord.id}`);

    // Fetch student info for prefill in checkout
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, email: true, phone: true },
    });

    // Return checkout details to frontend (NEVER return secret key!)
    return res.status(200).json({
      success: true,
      data: {
        keyId: razorpayService.getKeyId(),
        orderId: rzpOrder.id,
        amount: amountInPaise,
        currency: 'INR',
        paymentRecordId: paymentRecord.id,
        course: {
          id: course.id,
          title: course.title,
        },
        prefill: {
          name: dbUser?.name || '',
          email: dbUser?.email || '',
          contact: dbUser?.phone || '',
        },
      },
    });
  } catch (err: any) {
    console.error('Razorpay createOrder error:', err);
    return res.status(500).json({
      success: false,
      error: { message: err?.message || 'Failed to initiate payment with Razorpay' },
    });
  }
};

/**
 * 2. VERIFY RAZORPAY PAYMENT (Client callback)
 * Validates HMAC signature, order status, amounts, marks Payment SUCCESS, and activates Enrollment.
 */
export const verifyRazorpayPayment = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required Razorpay payment credentials' },
      });
    }

    // 1. Verify HMAC SHA-256 signature server-side
    const isValidSignature = razorpayService.verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValidSignature) {
      console.warn(`Invalid Razorpay signature for order ${razorpay_order_id}`);
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid payment signature. Verification failed.' },
      });
    }

    // 2. Fetch local Payment record
    const payment = await prisma.payment.findUnique({
      where: { merchantOrderId: razorpay_order_id },
      include: { course: true },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: { message: 'Payment record not found for this order.' },
      });
    }

    // 3. Ensure the authenticated user owns this payment
    if (payment.userId !== user.id) {
      return res.status(403).json({
        success: false,
        error: { message: 'Forbidden: Payment does not belong to this user.' },
      });
    }

    // Idempotency check: if already SUCCESS, return success immediately
    if (payment.status === 'SUCCESS') {
      return res.status(200).json({
        success: true,
        message: 'Payment already verified and enrollment active.',
        data: {
          paymentId: payment.id,
          orderId: payment.merchantOrderId,
          courseId: payment.courseId,
          status: 'SUCCESS',
        },
      });
    }

    // 4. Verify payment with Razorpay API directly for extra security
    try {
      const rzpPayment = await razorpayService.getPayment(razorpay_payment_id);
      if (rzpPayment.order_id !== razorpay_order_id) {
        return res.status(400).json({
          success: false,
          error: { message: 'Payment does not correspond to the specified order.' },
        });
      }

      // Exact amount validation: course price in DB must match payment and Razorpay amount exactly
      const expectedPaise = Math.round(payment.amount * 100);
      const expectedCoursePaise = Math.round(payment.course.price * 100);

      if (expectedPaise !== expectedCoursePaise || Number(rzpPayment.amount) !== expectedPaise) {
        console.error(`[Razorpay:verify] Amount mismatch! Rzp: ${rzpPayment.amount}, DB Payment: ${expectedPaise}, Course: ${expectedCoursePaise}`);
        return res.status(400).json({
          success: false,
          error: { message: 'Payment amount mismatch detected. Transaction rejected.' },
        });
      }

      // Currency check
      if (rzpPayment.currency !== 'INR') {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid transaction currency. Expected INR.' },
        });
      }

      // Status check: must be captured or authorized
      if (rzpPayment.status !== 'captured' && rzpPayment.status !== 'authorized') {
        return res.status(400).json({
          success: false,
          error: { message: `Payment is not in a completed state (status: ${rzpPayment.status}).` },
        });
      }
    } catch (apiErr: any) {
      console.warn('[Razorpay:verify] Razorpay API verification check:', apiErr.message);
      // Cryptographic signature is authoritative fallback if API check errors
    }

    // 5. Transactional state update & active enrollment creation
    const updatedPayment = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCESS',
          gateway: 'RAZORPAY',
          gatewayTransactionId: razorpay_payment_id,
          paidAt: new Date(),
          paymentResponse: JSON.stringify({
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
            verifiedAt: new Date().toISOString(),
          }),
        },
      });

      // Upsert active enrollment idempotently
      await tx.enrollment.upsert({
        where: {
          userId_courseId: {
            userId: payment.userId,
            courseId: payment.courseId,
          },
        },
        update: {
          status: 'ACTIVE',
          paymentId: payment.id,
        },
        create: {
          userId: payment.userId,
          courseId: payment.courseId,
          paymentId: payment.id,
          status: 'ACTIVE',
        },
      });

      return p;
    });

    invalidateUserCache(payment.userId);
    invalidateProgressCache(payment.userId);

    // Notify administrators asynchronously about the new course purchase
    sendCoursePurchaseAdminNotificationEmail({
      userName: user.name || 'Student',
      userEmail: user.email || '',
      courseTitle: payment.course?.title || 'Course',
      courseId: payment.courseId,
      amount: payment.amount,
      currency: 'INR',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    }).catch((emailErr) => {
      console.error('[PaymentController] Error sending admin course purchase email:', emailErr);
    });

    return res.status(200).json({
      success: true,
      message: 'Payment verified and course unlocked successfully.',
      data: {
        paymentId: updatedPayment.id,
        orderId: updatedPayment.merchantOrderId,
        courseId: updatedPayment.courseId,
        status: updatedPayment.status,
      },
    });
  } catch (err: any) {
    console.error('verifyRazorpayPayment error:', err);
    return res.status(500).json({
      success: false,
      error: { message: err?.message || 'Server error while verifying payment' },
    });
  }
};

/**
 * 3. RAZORPAY WEBHOOK
 * Listens for asynchronous events from Razorpay (order.paid, payment.captured, payment.failed).
 * Strictly verifies webhook signature and processes idempotently.
 */
export const razorpayWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    if (!signature) {
      return res.status(400).json({ success: false, error: 'Missing x-razorpay-signature header' });
    }

    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    // Verify webhook signature
    const isValid = razorpayService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn('Invalid Razorpay webhook signature');
      return res.status(400).json({ success: false, error: 'Invalid webhook signature' });
    }

    const event = req.body;
    const eventType = event.event;

    if (eventType === 'order.paid' || eventType === 'payment.captured') {
      const paymentEntity = event.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id || event.payload?.order?.entity?.id;
      const paymentId = paymentEntity?.id;

      if (orderId) {
        const { activatedUserId, purchaseInfo } = await prisma.$transaction(async (tx) => {
          const payment = await tx.payment.findUnique({
            where: { merchantOrderId: orderId },
            include: { user: true, course: true },
          });

          if (!payment) {
            console.warn(`Webhook order not found in DB: ${orderId}`);
            return { activatedUserId: null as string | null, purchaseInfo: null };
          }

          let info: {
            userName: string;
            userEmail: string;
            courseTitle: string;
            courseId: string;
            amount: number;
            paymentId: string;
            orderId: string;
          } | null = null;

          if (payment.status !== 'SUCCESS') {
            info = {
              userName: payment.user?.name || 'Student',
              userEmail: payment.user?.email || '',
              courseTitle: payment.course?.title || 'Course',
              courseId: payment.courseId,
              amount: payment.amount,
              paymentId: paymentId || payment.gatewayTransactionId || '',
              orderId,
            };

            await tx.payment.update({
              where: { id: payment.id },
              data: {
                status: 'SUCCESS',
                gateway: 'RAZORPAY',
                gatewayTransactionId: paymentId || payment.gatewayTransactionId,
                paidAt: payment.paidAt || new Date(),
                paymentResponse: JSON.stringify(event),
              },
            });

            // Activate enrollment
            await tx.enrollment.upsert({
              where: {
                userId_courseId: {
                  userId: payment.userId,
                  courseId: payment.courseId,
                },
              },
              update: {
                status: 'ACTIVE',
                paymentId: payment.id,
              },
              create: {
                userId: payment.userId,
                courseId: payment.courseId,
                paymentId: payment.id,
                status: 'ACTIVE',
              },
            });
          }

          return { activatedUserId: payment.userId, purchaseInfo: info };
        });

        if (activatedUserId) {
          invalidateUserCache(activatedUserId);
          invalidateProgressCache(activatedUserId);
        }

        if (purchaseInfo) {
          sendCoursePurchaseAdminNotificationEmail({
            userName: purchaseInfo.userName,
            userEmail: purchaseInfo.userEmail,
            courseTitle: purchaseInfo.courseTitle,
            courseId: purchaseInfo.courseId,
            amount: purchaseInfo.amount,
            currency: 'INR',
            paymentId: purchaseInfo.paymentId,
            orderId: purchaseInfo.orderId,
          }).catch((err) => {
            console.error('[Webhook] Failed to send admin purchase notification email:', err);
          });
        }
      }
    } else if (eventType === 'payment.failed') {
      const paymentEntity = event.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;

      if (orderId) {
        await prisma.payment.updateMany({
          where: {
            merchantOrderId: orderId,
            status: { not: 'SUCCESS' },
          },
          data: {
            status: 'FAILED',
            gatewayTransactionId: paymentId,
            paymentResponse: JSON.stringify(event),
          },
        });
      }
    }

    return res.status(200).json({ status: 'ok' });
  } catch (err: any) {
    console.error('Razorpay webhook processing error:', err);
    return res.status(500).json({ success: false, error: 'Internal webhook error' });
  }
};

/**
 * 4. CHECK PAYMENT STATUS BY ORDER ID
 */
export const checkPaymentStatus = async (req: Request, res: Response) => {
  try {
    const merchantOrderId = req.params.merchantOrderId as string;
    if (!merchantOrderId) {
      return res.status(400).json({ success: false, error: { message: 'Order ID is required' } });
    }

    const payment = await prisma.payment.findUnique({
      where: { merchantOrderId },
      include: {
        course: { select: { id: true, title: true } },
      },
    });

    if (!payment) {
      return res.status(404).json({ success: false, error: { message: 'Payment record not found' } });
    }

    return res.json({
      success: true,
      data: {
        id: payment.id,
        merchantOrderId: payment.merchantOrderId,
        gatewayTransactionId: payment.gatewayTransactionId,
        gateway: payment.gateway,
        status: payment.status,
        amount: payment.amount,
        courseId: payment.courseId,
        courseTitle: payment.course?.title,
        paidAt: payment.paidAt,
      },
    });
  } catch (err: any) {
    console.error('checkPaymentStatus error:', err);
    return res.status(500).json({ success: false, error: { message: 'Server error' } });
  }
};
