import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../../db.js';
import { razorpayService } from '../payments/razorpay.service.js';
import { sendCoursePurchaseAdminNotificationEmail } from '../../services/email/email.service.js';
import { computeOfferStatus } from './offer.utils.js';

/**
 * 1. GET ACTIVE POPUP OFFER
 * Returns the single highest priority active offer eligible for public popup display.
 */
export const getActivePopupOffer = async (req: Request, res: Response) => {
  try {
    // Check if global offer popup is disabled via SystemSetting
    const popupSetting = await prisma.systemSetting.findUnique({
      where: { key: 'offer_popup_enabled' }
    });
    if (popupSetting && popupSetting.value === 'false') {
      return res.json({ success: true, data: null });
    }

    const delaySetting = await prisma.systemSetting.findUnique({
      where: { key: 'offer_popup_delay_seconds' }
    });
    const delaySeconds = delaySetting ? parseInt(delaySetting.value, 10) || 4 : 4;

    const candidates = await prisma.courseOffer.findMany({
      where: {
        isEnabled: true,
        showPopup: true,
        status: { in: ['PUBLISHED', 'SCHEDULED'] }
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            price: true,
            status: true
          }
        }
      },
      orderBy: [
        { popupPriority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    const now = new Date();

    // Filter by strict publication and validity rules
    const validOffer = candidates.find(offer => {
      const computed = computeOfferStatus(offer);
      if (computed !== 'PUBLISHED') return false;
      if (offer.course.status !== 'PUBLISHED') return false;
      return true;
    });

    if (!validOffer) {
      return res.json({ success: true, data: null });
    }

    const discountAmount = Math.max(0, validOffer.originalPrice - validOffer.offerPrice);
    const discountPercent = validOffer.originalPrice > 0
      ? Math.round((discountAmount / validOffer.originalPrice) * 100)
      : 0;

    return res.json({
      success: true,
      data: {
        id: validOffer.id,
        slug: validOffer.slug,
        title: validOffer.title,
        shortDescription: validOffer.shortDescription,
        bannerImageUrl: validOffer.bannerImageUrl || validOffer.course.thumbnailUrl,
        originalPrice: validOffer.originalPrice,
        offerPrice: validOffer.offerPrice,
        discountAmount,
        discountPercent,
        currency: validOffer.currency,
        countdownEnabled: validOffer.countdownEnabled,
        expiresAt: validOffer.expiresAt,
        popupDelaySeconds: delaySeconds,
        course: {
          id: validOffer.course.id,
          title: validOffer.course.title
        }
      }
    });
  } catch (err: any) {
    console.error('[Offers] Error in getActivePopupOffer:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch popup offer' } });
  }
};

/**
 * 2. GET PUBLIC OFFER BY SLUG
 * Dedicated high-converting public landing page query.
 */
export const getOfferBySlug = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug as string;
    if (!slug) {
      return res.status(400).json({ success: false, error: { message: 'Offer slug is required' } });
    }

    const offer = await prisma.courseOffer.findUnique({
      where: { slug },
      include: {
        course: {
          include: {
            instructor: {
              select: {
                displayName: true,
                title: true,
                avatarUrl: true,
                bio: true
              }
            },
            modules: {
              include: {
                lessons: {
                  select: {
                    id: true,
                    title: true,
                    durationSeconds: true,
                    isPreview: true
                  },
                  orderBy: { sortOrder: 'asc' }
                }
              },
              orderBy: { sortOrder: 'asc' }
            }
          }
        }
      }
    });

    if (!offer) {
      return res.status(404).json({ success: false, error: { message: 'Offer not found' } });
    }

    const computedStatus = computeOfferStatus(offer);

    // If disabled or draft, do NOT expose content (404)
    if (computedStatus === 'DISABLED' || computedStatus === 'DRAFT' || computedStatus === 'ARCHIVED') {
      return res.status(404).json({ success: false, error: { message: 'Offer unavailable' } });
    }

    // Check course availability
    const courseAvailable = offer.course.status === 'PUBLISHED';

    const discountAmount = Math.max(0, offer.originalPrice - offer.offerPrice);
    const discountPercent = offer.originalPrice > 0
      ? Math.round((discountAmount / offer.originalPrice) * 100)
      : 0;

    const totalLessons = offer.course.modules.reduce((acc, m) => acc + m.lessons.length, 0);

    return res.json({
      success: true,
      data: {
        id: offer.id,
        slug: offer.slug,
        title: offer.title,
        shortDescription: offer.shortDescription,
        description: offer.description,
        bannerImageUrl: offer.bannerImageUrl || offer.course.thumbnailUrl,
        galleryImages: offer.galleryImages || [],
        originalPrice: offer.originalPrice,
        offerPrice: offer.offerPrice,
        discountAmount,
        discountPercent,
        currency: offer.currency,
        termsAndConditions: offer.termsAndConditions,
        supportEmail: offer.supportEmail || 'contact@jadmaavarmakalai.com',
        supportPhone: offer.supportPhone || '+91 97894 88878',
        countdownEnabled: offer.countdownEnabled,
        startAt: offer.startAt,
        expiresAt: offer.expiresAt,
        bookingLimit: offer.bookingLimit,
        currentBookings: offer.currentBookings,
        computedStatus,
        isBookable: computedStatus === 'PUBLISHED' && courseAvailable,
        course: {
          id: offer.course.id,
          title: offer.course.title,
          subtitle: offer.course.subtitle,
          description: offer.course.description,
          longDescription: offer.course.longDescription,
          thumbnailUrl: offer.course.thumbnailUrl,
          level: offer.course.level,
          duration: offer.course.duration,
          category: offer.course.category,
          rating: offer.course.rating,
          reviewCount: offer.course.reviewCount,
          totalLessons,
          instructor: offer.course.instructor,
          modules: offer.course.modules.map(m => ({
            id: m.id,
            title: m.title,
            description: m.description,
            lessonCount: m.lessons.length,
            lessons: m.lessons.map(l => ({
              id: l.id,
              title: l.title,
              duration: `${Math.floor(l.durationSeconds / 60)} min`,
              isFreePreview: l.isPreview
            }))
          }))
        }
      }
    });
  } catch (err: any) {
    console.error('[Offers] Error in getOfferBySlug:', err);
    return res.status(500).json({ success: false, error: { message: 'Server error loading offer' } });
  }
};

/**
 * 3. INITIATE OFFER BOOKING
 * Authenticated checkout. Checks eligibility, enforces DB offer price, creates Razorpay order & pending booking.
 */
export const initiateOfferBooking = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) {
      return res.status(401).json({ success: false, error: { message: 'Please log in to continue booking.' } });
    }

    const { slug } = req.params;
    if (!slug) {
      return res.status(400).json({ success: false, error: { message: 'Offer slug is required' } });
    }

    // Retrieve authoritative offer and course
    const offer = await prisma.courseOffer.findUnique({
      where: { slug },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            status: true,
            price: true
          }
        }
      }
    });

    if (!offer) {
      return res.status(404).json({ success: false, error: { message: 'Offer not found' } });
    }

    // Server-side publication and eligibility validation
    const computedStatus = computeOfferStatus(offer);
    if (computedStatus !== 'PUBLISHED') {
      const msg = computedStatus === 'EXPIRED'
        ? 'This promotional offer has expired.'
        : computedStatus === 'SCHEDULED'
        ? 'This promotional offer has not started yet.'
        : 'This offer is currently unavailable.';
      return res.status(400).json({ success: false, error: { message: msg } });
    }

    // Check course availability
    if (offer.course.status !== 'PUBLISHED') {
      return res.status(403).json({
        success: false,
        error: { message: 'The associated course is currently unavailable for enrollment.' }
      });
    }

    // Check if user already actively enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: offer.courseId
        }
      }
    });

    if (existingEnrollment && existingEnrollment.status === 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: { message: 'You are already enrolled in this course! Check your student dashboard.' }
      });
    }

    // Validate authoritative price
    if (offer.offerPrice <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid offer pricing configuration.' }
      });
    }

    const amountInINR = Number(offer.offerPrice);
    const amountInPaise = Math.round(amountInINR * 100);

    // Generate unique local receipt and booking number
    const receipt = `OFFER_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const bookingNumber = `BK-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    // Create Razorpay order
    const rzpOrder = await razorpayService.createOrder({
      amountInPaise,
      currency: 'INR',
      receipt,
      notes: {
        offerId: offer.id,
        courseId: offer.courseId,
        offerTitle: offer.title.substring(0, 40),
        userId: user.id,
        userEmail: user.email || '',
        bookingNumber
      }
    });

    // Create Payment record with offer reference
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        courseId: offer.courseId,
        offerId: offer.id,
        gateway: 'RAZORPAY',
        merchantOrderId: rzpOrder.id,
        amount: amountInINR,
        currency: 'INR',
        status: 'PENDING',
        paymentResponse: JSON.stringify({ rzpOrderId: rzpOrder.id, receipt, bookingNumber })
      }
    });

    // Create OfferBooking record in PENDING state
    await prisma.offerBooking.create({
      data: {
        bookingNumber,
        offerId: offer.id,
        courseId: offer.courseId,
        userId: user.id,
        paymentId: payment.id,
        amount: amountInINR,
        currency: 'INR',
        status: 'PENDING',
        customerName: user.name || '',
        customerEmail: user.email || '',
        customerPhone: user.phone || ''
      }
    });

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, email: true, phone: true }
    });

    return res.status(200).json({
      success: true,
      data: {
        keyId: razorpayService.getKeyId(),
        orderId: rzpOrder.id,
        amount: amountInPaise,
        currency: 'INR',
        bookingNumber,
        paymentRecordId: payment.id,
        offer: {
          id: offer.id,
          title: offer.title,
          slug: offer.slug,
          offerPrice: offer.offerPrice
        },
        course: {
          id: offer.course.id,
          title: offer.course.title
        },
        prefill: {
          name: dbUser?.name || '',
          email: dbUser?.email || '',
          contact: dbUser?.phone || ''
        }
      }
    });
  } catch (err: any) {
    console.error('[Offers] Error in initiateOfferBooking:', err);
    return res.status(500).json({
      success: false,
      error: { message: err?.message || 'Failed to initiate offer booking' }
    });
  }
};

/**
 * 4. VERIFY OFFER PAYMENT
 * Cryptographically verifies Razorpay signature, sets Payment & OfferBooking to SUCCESS,
 * increments currentBookings, and activates student enrollment.
 */
export const verifyOfferPayment = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required Razorpay credentials' }
      });
    }

    // 1. Verify cryptographic signature
    const isValidSignature = razorpayService.verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature
    });

    if (!isValidSignature) {
      console.warn(`[Offers] Invalid signature for offer order ${razorpay_order_id}`);
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid payment signature. Verification failed.' }
      });
    }

    // 2. Fetch local Payment & OfferBooking records
    const payment = await prisma.payment.findUnique({
      where: { merchantOrderId: razorpay_order_id },
      include: {
        offer: true,
        course: true,
        offerBooking: true
      }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: { message: 'Payment record not found for this order.' }
      });
    }

    if (payment.userId !== user.id) {
      return res.status(403).json({
        success: false,
        error: { message: 'Forbidden: Payment does not belong to this user.' }
      });
    }

    // Idempotency: if already SUCCESS, return early
    if (payment.status === 'SUCCESS') {
      return res.status(200).json({
        success: true,
        message: 'Payment already verified and enrollment active.',
        data: {
          paymentId: payment.id,
          orderId: payment.merchantOrderId,
          courseId: payment.courseId,
          bookingNumber: payment.offerBooking?.bookingNumber,
          status: 'SUCCESS'
        }
      });
    }

    // 3. Amount integrity check against DB offer price
    if (payment.offer) {
      const expectedPaise = Math.round(payment.offer.offerPrice * 100);
      const paymentPaise = Math.round(payment.amount * 100);
      if (expectedPaise !== paymentPaise) {
        console.error(`[Offers] Price mismatch! Offer: ${expectedPaise}, Payment: ${paymentPaise}`);
        return res.status(400).json({
          success: false,
          error: { message: 'Payment amount mismatch. Transaction rejected.' }
        });
      }
    }

    // 4. Atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update Payment
      const updatedPayment = await tx.payment.update({
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
            verifiedAt: new Date().toISOString()
          })
        }
      });

      // Upsert active enrollment
      const enrollment = await tx.enrollment.upsert({
        where: {
          userId_courseId: {
            userId: payment.userId,
            courseId: payment.courseId
          }
        },
        update: {
          status: 'ACTIVE',
          paymentId: payment.id
        },
        create: {
          userId: payment.userId,
          courseId: payment.courseId,
          paymentId: payment.id,
          status: 'ACTIVE'
        }
      });

      // Update OfferBooking to SUCCESS & link enrollment
      let updatedBooking = null;
      if (payment.offerBooking) {
        updatedBooking = await tx.offerBooking.update({
          where: { id: payment.offerBooking.id },
          data: {
            status: 'SUCCESS',
            enrollmentId: enrollment.id
          }
        });
      }

      // Increment offer.currentBookings atomically
      if (payment.offerId) {
        await tx.courseOffer.update({
          where: { id: payment.offerId },
          data: {
            currentBookings: { increment: 1 }
          }
        });
      }

      return { updatedPayment, enrollment, updatedBooking };
    });

    // Send admin notification email asynchronously (safe fallback)
    sendCoursePurchaseAdminNotificationEmail({
      userName: user.name || 'Student',
      userEmail: user.email || '',
      courseTitle: payment.course.title,
      amount: payment.amount,
      currency: payment.currency,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id
    }).catch(err => console.warn('[Offers] Admin purchase email error:', err.message));

    return res.status(200).json({
      success: true,
      data: {
        paymentId: result.updatedPayment.id,
        orderId: razorpay_order_id,
        courseId: payment.courseId,
        bookingNumber: result.updatedBooking?.bookingNumber,
        status: 'SUCCESS'
      }
    });
  } catch (err: any) {
    console.error('[Offers] Error in verifyOfferPayment:', err);
    return res.status(500).json({
      success: false,
      error: { message: err?.message || 'Verification failed' }
    });
  }
};

