import { Request, Response } from 'express';
import { prisma } from '../../db.js';
import { logAdminAction } from '../../utils/audit.js';
import { computeOfferStatus, slugify } from './offer.utils.js';

/**
 * 1. GET ALL OFFERS (Admin list view)
 */
export const getAdminOffers = async (req: Request, res: Response) => {
  try {
    const offers = await prisma.courseOffer.findMany({
      where: {
        status: { not: 'ARCHIVED' }
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            price: true,
            thumbnailUrl: true,
            status: true
          }
        },
        _count: {
          select: { bookings: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = offers.map(offer => {
      const computedStatus = computeOfferStatus(offer);
      const discountAmount = Math.max(0, offer.originalPrice - offer.offerPrice);
      const discountPercent = offer.originalPrice > 0
        ? Math.round((discountAmount / offer.originalPrice) * 100)
        : 0;

      return {
        id: offer.id,
        title: offer.title,
        slug: offer.slug,
        shortDescription: offer.shortDescription,
        description: offer.description,
        bannerImageUrl: offer.bannerImageUrl || offer.course?.thumbnailUrl || null,
        popupImageUrl: offer.popupImageUrl || null,
        galleryImages: offer.galleryImages || [],
        category: offer.category || 'ONLINE_COURSE',
        customCategory: offer.customCategory || null,
        targetAudience: offer.targetAudience || null,
        branchLocation: offer.branchLocation || null,
        pricingType: offer.pricingType || 'FIXED_PRICE',
        theme: offer.theme || 'light',
        primaryColor: offer.primaryColor || '#991B1B',
        secondaryColor: offer.secondaryColor || '#141416',
        ctaType: offer.ctaType || 'ENROLL_COURSE',
        ctaText: offer.ctaText || null,
        ctaUrl: offer.ctaUrl || null,
        secondaryCtaText: offer.secondaryCtaText || null,
        secondaryCtaUrl: offer.secondaryCtaUrl || null,
        courseId: offer.courseId,
        courseTitle: offer.course?.title || null,
        originalPrice: offer.originalPrice,
        offerPrice: offer.offerPrice,
        discountAmount,
        discountPercent,
        currency: offer.currency,
        status: offer.status,
        computedStatus,
        isEnabled: offer.isEnabled,
        showPopup: offer.showPopup,
        popupPriority: offer.popupPriority,
        startAt: offer.startAt,
        expiresAt: offer.expiresAt,
        countdownEnabled: offer.countdownEnabled,
        bookingLimit: offer.bookingLimit,
        currentBookings: offer.currentBookings,
        verifiedBookingsCount: offer._count.bookings,
        createdAt: offer.createdAt,
        updatedAt: offer.updatedAt
      };
    });

    return res.json({ success: true, data: formatted });
  } catch (err: any) {
    console.error('[AdminOffers] Error in getAdminOffers:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch offers' } });
  }
};

/**
 * 2. GET SINGLE OFFER BY ID
 */
export const getAdminOfferById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const offer = await prisma.courseOffer.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            price: true,
            thumbnailUrl: true
          }
        }
      }
    });

    if (!offer) {
      return res.status(404).json({ success: false, error: { message: 'Offer not found' } });
    }

    const computedStatus = computeOfferStatus(offer);

    return res.json({
      success: true,
      data: {
        ...offer,
        computedStatus
      }
    });
  } catch (err: any) {
    console.error('[AdminOffers] Error in getAdminOfferById:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch offer' } });
  }
};

/**
 * 3. CREATE NEW OFFER
 */
export const createOffer = async (req: Request, res: Response) => {
  try {
    const adminUser = (req as any).user;
    const {
      title,
      slug: customSlug,
      shortDescription,
      description,
      bannerImageUrl,
      popupImageUrl,
      galleryImages,
      category = 'ONLINE_COURSE',
      customCategory,
      targetAudience,
      branchLocation,
      courseId,
      pricingType = 'FIXED_PRICE',
      originalPrice: rawOriginalPrice,
      offerPrice: rawOfferPrice,
      discountPercent: rawDiscountPercent,
      theme = 'light',
      primaryColor = '#991B1B',
      secondaryColor = '#141416',
      ctaType = 'ENROLL_COURSE',
      ctaText,
      ctaUrl,
      secondaryCtaText,
      secondaryCtaUrl,
      termsAndConditions,
      supportEmail,
      supportPhone,
      isEnabled = false,
      status = 'DRAFT',
      showPopup = false,
      popupPriority = 0,
      startAt,
      expiresAt,
      countdownEnabled = false,
      bookingLimit
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: { message: 'Offer title is required.' } });
    }

    let resolvedCourseId: string | null = null;
    let originalPrice = parseFloat(rawOriginalPrice) || 0;
    let numOfferPrice = parseFloat(rawOfferPrice) || 0;

    // If associated course provided, verify existence
    if (courseId) {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { id: true, title: true, price: true }
      });

      if (!course) {
        return res.status(404).json({ success: false, error: { message: 'Selected course not found.' } });
      }
      resolvedCourseId = course.id;
      if (course.price > 0 && (!rawOriginalPrice || originalPrice === 0)) {
        originalPrice = course.price;
      }
    }

    // Dynamic price calculation based on pricingType
    if (pricingType === 'ENQUIRY_ONLY') {
      originalPrice = 0;
      numOfferPrice = 0;
    } else if (pricingType === 'PERCENTAGE') {
      const pct = Math.min(100, Math.max(0, parseFloat(rawDiscountPercent) || 0));
      numOfferPrice = Math.max(0, Math.round(originalPrice * (1 - pct / 100)));
    } else if (pricingType === 'NO_DISCOUNT') {
      numOfferPrice = originalPrice > 0 ? originalPrice : (parseFloat(rawOfferPrice) || 0);
      originalPrice = numOfferPrice;
    } else if (pricingType === 'FIXED_DISCOUNT') {
      const discountAmt = parseFloat(rawOfferPrice) || 0;
      numOfferPrice = Math.max(0, originalPrice - discountAmt);
    }

    // Server-side validation
    if (pricingType !== 'ENQUIRY_ONLY') {
      if (originalPrice > 0 && numOfferPrice > originalPrice) {
        return res.status(400).json({
          success: false,
          error: { message: `Offer price (₹${numOfferPrice}) cannot exceed original price (₹${originalPrice}).` }
        });
      }
    }

    // Clean & validate slug
    let finalSlug = slugify(customSlug || title);
    if (!finalSlug) {
      finalSlug = `offer-${Date.now().toString(36)}`;
    }

    const existingSlug = await prisma.courseOffer.findUnique({ where: { slug: finalSlug } });
    if (existingSlug) {
      finalSlug = `${finalSlug}-${Date.now().toString(36).substring(0, 4)}`;
    }

    // Validate dates if provided
    let parsedStartAt: Date | null = null;
    let parsedExpiresAt: Date | null = null;

    if (startAt) {
      parsedStartAt = new Date(startAt);
      if (isNaN(parsedStartAt.getTime())) parsedStartAt = null;
    }

    if (expiresAt) {
      parsedExpiresAt = new Date(expiresAt);
      if (isNaN(parsedExpiresAt.getTime())) parsedExpiresAt = null;
    }

    if (parsedStartAt && parsedExpiresAt && parsedExpiresAt <= parsedStartAt) {
      return res.status(400).json({
        success: false,
        error: { message: 'Expiry date must be after the start date.' }
      });
    }

    const newOffer = await prisma.courseOffer.create({
      data: {
        title: title.trim(),
        slug: finalSlug,
        shortDescription: shortDescription || '',
        description: description || '',
        bannerImageUrl: bannerImageUrl || null,
        popupImageUrl: popupImageUrl || null,
        galleryImages: Array.isArray(galleryImages) ? galleryImages : [],
        category,
        customCategory: customCategory || null,
        targetAudience: targetAudience || null,
        branchLocation: branchLocation || null,
        courseId: resolvedCourseId,
        pricingType,
        discountPercent: rawDiscountPercent ? parseFloat(rawDiscountPercent) : null,
        originalPrice,
        offerPrice: numOfferPrice,
        currency: 'INR',
        theme,
        primaryColor,
        secondaryColor,
        ctaType,
        ctaText: ctaText || null,
        ctaUrl: ctaUrl || null,
        secondaryCtaText: secondaryCtaText || null,
        secondaryCtaUrl: secondaryCtaUrl || null,
        termsAndConditions: termsAndConditions || null,
        supportEmail: supportEmail || 'info@jadmaa.com',
        supportPhone: supportPhone || '+91 93452 20020',
        status: status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
        isEnabled: Boolean(isEnabled),
        showPopup: Boolean(showPopup),
        popupPriority: parseInt(popupPriority, 10) || 0,
        startAt: parsedStartAt,
        expiresAt: parsedExpiresAt,
        countdownEnabled: Boolean(countdownEnabled),
        bookingLimit: bookingLimit ? parseInt(bookingLimit, 10) : null
      }
    });

    await logAdminAction(adminUser.id, 'CREATE_OFFER', 'CourseOffer', newOffer.id, { slug: newOffer.slug }, req);

    return res.status(201).json({ success: true, data: newOffer });
  } catch (err: any) {
    console.error('[AdminOffers] Error in createOffer:', err);
    return res.status(500).json({ success: false, error: { message: err.message || 'Failed to create offer' } });
  }
};

/**
 * 4. UPDATE EXISTING OFFER
 */
export const updateOffer = async (req: Request, res: Response) => {
  try {
    const adminUser = (req as any).user;
    const { id } = req.params;

    const existing = await prisma.courseOffer.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: { message: 'Offer not found' } });
    }

    const {
      title,
      slug: customSlug,
      shortDescription,
      description,
      bannerImageUrl,
      popupImageUrl,
      galleryImages,
      category,
      customCategory,
      targetAudience,
      branchLocation,
      courseId,
      pricingType,
      originalPrice,
      offerPrice,
      discountPercent,
      theme,
      primaryColor,
      secondaryColor,
      ctaType,
      ctaText,
      ctaUrl,
      secondaryCtaText,
      secondaryCtaUrl,
      termsAndConditions,
      supportEmail,
      supportPhone,
      isEnabled,
      status,
      showPopup,
      popupPriority,
      startAt,
      expiresAt,
      countdownEnabled,
      bookingLimit
    } = req.body;

    const updateData: any = {};

    if (title !== undefined) updateData.title = title.trim();
    if (shortDescription !== undefined) updateData.shortDescription = shortDescription;
    if (description !== undefined) updateData.description = description;
    if (bannerImageUrl !== undefined) updateData.bannerImageUrl = bannerImageUrl || null;
    if (popupImageUrl !== undefined) updateData.popupImageUrl = popupImageUrl || null;
    if (galleryImages !== undefined) updateData.galleryImages = Array.isArray(galleryImages) ? galleryImages : [];
    if (category !== undefined) updateData.category = category;
    if (customCategory !== undefined) updateData.customCategory = customCategory || null;
    if (targetAudience !== undefined) updateData.targetAudience = targetAudience || null;
    if (branchLocation !== undefined) updateData.branchLocation = branchLocation || null;
    if (courseId !== undefined) updateData.courseId = courseId || null;
    if (pricingType !== undefined) updateData.pricingType = pricingType;
    if (discountPercent !== undefined) updateData.discountPercent = discountPercent !== null ? parseFloat(discountPercent) : null;
    if (theme !== undefined) updateData.theme = theme;
    if (primaryColor !== undefined) updateData.primaryColor = primaryColor;
    if (secondaryColor !== undefined) updateData.secondaryColor = secondaryColor;
    if (ctaType !== undefined) updateData.ctaType = ctaType;
    if (ctaText !== undefined) updateData.ctaText = ctaText || null;
    if (ctaUrl !== undefined) updateData.ctaUrl = ctaUrl || null;
    if (secondaryCtaText !== undefined) updateData.secondaryCtaText = secondaryCtaText || null;
    if (secondaryCtaUrl !== undefined) updateData.secondaryCtaUrl = secondaryCtaUrl || null;
    if (termsAndConditions !== undefined) updateData.termsAndConditions = termsAndConditions || null;
    if (supportEmail !== undefined) updateData.supportEmail = supportEmail || null;
    if (supportPhone !== undefined) updateData.supportPhone = supportPhone || null;
    if (isEnabled !== undefined) updateData.isEnabled = Boolean(isEnabled);
    if (status !== undefined) updateData.status = status;
    if (showPopup !== undefined) updateData.showPopup = Boolean(showPopup);
    if (popupPriority !== undefined) updateData.popupPriority = parseInt(popupPriority, 10) || 0;
    if (countdownEnabled !== undefined) updateData.countdownEnabled = Boolean(countdownEnabled);
    if (bookingLimit !== undefined) updateData.bookingLimit = bookingLimit ? parseInt(bookingLimit, 10) : null;

    if (originalPrice !== undefined) {
      updateData.originalPrice = parseFloat(originalPrice) || 0;
    }

    if (startAt !== undefined) {
      updateData.startAt = startAt ? new Date(startAt) : null;
    }
    if (expiresAt !== undefined) {
      updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    }

    if (updateData.startAt && updateData.expiresAt && updateData.expiresAt <= updateData.startAt) {
      return res.status(400).json({
        success: false,
        error: { message: 'Expiry date must be after the start date.' }
      });
    }

    // If slug changed, validate uniqueness
    if (customSlug && customSlug !== existing.slug) {
      const cleanSlug = slugify(customSlug);
      const duplicate = await prisma.courseOffer.findFirst({
        where: { slug: cleanSlug, id: { not: id } }
      });
      if (duplicate) {
        return res.status(400).json({ success: false, error: { message: 'This slug is already in use by another offer.' } });
      }
      updateData.slug = cleanSlug;
    }

    // Price handling
    if (offerPrice !== undefined) {
      const numOfferPrice = parseFloat(offerPrice);
      updateData.offerPrice = isNaN(numOfferPrice) ? 0 : numOfferPrice;
    }

    const updated = await prisma.courseOffer.update({
      where: { id },
      data: updateData
    });

    await logAdminAction(adminUser.id, 'UPDATE_OFFER', 'CourseOffer', id, { slug: updated.slug }, req);

    return res.json({ success: true, data: updated });
  } catch (err: any) {
    console.error('[AdminOffers] Error in updateOffer:', err);
    return res.status(500).json({ success: false, error: { message: err.message || 'Failed to update offer' } });
  }
};

/**
 * 5. TOGGLE ENABLE / DISABLE
 */
export const toggleOffer = async (req: Request, res: Response) => {
  try {
    const adminUser = (req as any).user;
    const { id } = req.params;

    const offer = await prisma.courseOffer.findUnique({ where: { id } });
    if (!offer) {
      return res.status(404).json({ success: false, error: { message: 'Offer not found' } });
    }

    const updated = await prisma.courseOffer.update({
      where: { id },
      data: { isEnabled: !offer.isEnabled }
    });

    await logAdminAction(
      adminUser.id,
      'TOGGLE_OFFER_STATUS',
      'CourseOffer',
      id,
      { isEnabled: updated.isEnabled },
      req
    );

    return res.json({
      success: true,
      data: {
        id: updated.id,
        isEnabled: updated.isEnabled,
        computedStatus: computeOfferStatus(updated)
      }
    });
  } catch (err: any) {
    console.error('[AdminOffers] Error in toggleOffer:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to toggle offer' } });
  }
};

/**
 * 6. DUPLICATE OFFER AS DRAFT
 */
export const duplicateOffer = async (req: Request, res: Response) => {
  try {
    const adminUser = (req as any).user;
    const { id } = req.params;

    const source = await prisma.courseOffer.findUnique({ where: { id } });
    if (!source) {
      return res.status(404).json({ success: false, error: { message: 'Source offer not found' } });
    }

    const copySlug = `${source.slug}-copy-${Date.now().toString(36).substring(0, 4)}`;

    const duplicated = await prisma.courseOffer.create({
      data: {
        title: `${source.title} (Copy)`,
        slug: copySlug,
        shortDescription: source.shortDescription,
        description: source.description,
        bannerImageUrl: source.bannerImageUrl,
        popupImageUrl: source.popupImageUrl,
        galleryImages: source.galleryImages,
        category: source.category,
        customCategory: source.customCategory,
        targetAudience: source.targetAudience,
        branchLocation: source.branchLocation,
        courseId: source.courseId,
        pricingType: source.pricingType,
        discountPercent: source.discountPercent,
        originalPrice: source.originalPrice,
        offerPrice: source.offerPrice,
        currency: source.currency,
        theme: source.theme,
        primaryColor: source.primaryColor,
        secondaryColor: source.secondaryColor,
        ctaType: source.ctaType,
        ctaText: source.ctaText,
        ctaUrl: source.ctaUrl,
        secondaryCtaText: source.secondaryCtaText,
        secondaryCtaUrl: source.secondaryCtaUrl,
        termsAndConditions: source.termsAndConditions,
        supportEmail: source.supportEmail,
        supportPhone: source.supportPhone,
        status: 'DRAFT',
        isEnabled: false,
        showPopup: false,
        popupPriority: source.popupPriority,
        startAt: null,
        expiresAt: null,
        countdownEnabled: source.countdownEnabled,
        bookingLimit: source.bookingLimit,
        currentBookings: 0
      }
    });

    await logAdminAction(adminUser.id, 'DUPLICATE_OFFER', 'CourseOffer', duplicated.id, { sourceId: id }, req);

    return res.status(201).json({ success: true, data: duplicated });
  } catch (err: any) {
    console.error('[AdminOffers] Error in duplicateOffer:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to duplicate offer' } });
  }
};

/**
 * 7. DELETE / ARCHIVE OFFER
 */
export const deleteOffer = async (req: Request, res: Response) => {
  try {
    const adminUser = (req as any).user;
    const { id } = req.params;

    const offer = await prisma.courseOffer.findUnique({
      where: { id },
      include: {
        _count: { select: { bookings: true, payments: true } }
      }
    });

    if (!offer) {
      return res.status(404).json({ success: false, error: { message: 'Offer not found' } });
    }

    // If bookings or payments exist, ARCHIVE instead of deleting
    if (offer._count.bookings > 0 || offer._count.payments > 0 || offer.currentBookings > 0) {
      await prisma.courseOffer.update({
        where: { id },
        data: {
          status: 'ARCHIVED',
          isEnabled: false,
          showPopup: false
        }
      });

      await logAdminAction(adminUser.id, 'ARCHIVE_OFFER', 'CourseOffer', id, { reason: 'Has associated bookings/payments' }, req);

      return res.json({
        success: true,
        message: 'Offer has associated customer purchases and was safely archived rather than deleted.'
      });
    }

    // Clean delete if completely unused
    await prisma.courseOffer.delete({ where: { id } });
    await logAdminAction(adminUser.id, 'DELETE_OFFER', 'CourseOffer', id, { slug: offer.slug }, req);

    return res.json({ success: true, message: 'Draft offer deleted permanently.' });
  } catch (err: any) {
    console.error('[AdminOffers] Error in deleteOffer:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to delete offer' } });
  }
};

/**
 * 8. GET OFFER BOOKINGS (With filters & pagination)
 */
export const getOfferBookings = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const offerId = req.query.offerId as string;
    const status = req.query.status as string;
    const search = (req.query.search as string || '').trim();

    const where: any = {};
    if (offerId) where.offerId = offerId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { bookingNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [items, total] = await Promise.all([
      prisma.offerBooking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          offer: { select: { id: true, title: true, slug: true } },
          course: { select: { id: true, title: true } },
          user: { select: { id: true, name: true, email: true, phone: true } },
          payment: { select: { id: true, merchantOrderId: true, gatewayTransactionId: true, status: true, paidAt: true } },
          enrollment: { select: { id: true, status: true, enrolledAt: true } }
        }
      }),
      prisma.offerBooking.count({ where })
    ]);

    return res.json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err: any) {
    console.error('[AdminOffers] Error in getOfferBookings:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch bookings' } });
  }
};

/**
 * 9. GET POPUP SETTINGS
 */
export const getOfferSettings = async (req: Request, res: Response) => {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: { in: ['offer_popup_enabled', 'offer_popup_delay_seconds'] }
      }
    });

    const settingsMap = settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>);

    return res.json({
      success: true,
      data: {
        popupEnabled: settingsMap['offer_popup_enabled'] !== 'false',
        popupDelaySeconds: parseInt(settingsMap['offer_popup_delay_seconds'] || '4', 10) || 4
      }
    });
  } catch (err: any) {
    console.error('[AdminOffers] Error in getOfferSettings:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch settings' } });
  }
};

/**
 * 10. UPDATE POPUP SETTINGS
 */
export const updateOfferSettings = async (req: Request, res: Response) => {
  try {
    const adminUser = (req as any).user;
    const { popupEnabled, popupDelaySeconds } = req.body;

    if (popupEnabled !== undefined) {
      await prisma.systemSetting.upsert({
        where: { key: 'offer_popup_enabled' },
        update: { value: popupEnabled ? 'true' : 'false' },
        create: {
          key: 'offer_popup_enabled',
          value: popupEnabled ? 'true' : 'false',
          description: 'Global master toggle for promotional offer popups on public website'
        }
      });
    }

    if (popupDelaySeconds !== undefined) {
      const delay = Math.max(1, Math.min(60, parseInt(popupDelaySeconds, 10) || 4));
      await prisma.systemSetting.upsert({
        where: { key: 'offer_popup_delay_seconds' },
        update: { value: delay.toString() },
        create: {
          key: 'offer_popup_delay_seconds',
          value: delay.toString(),
          description: 'Delay in seconds before the promotional popup is displayed'
        }
      });
    }

    await logAdminAction(adminUser.id, 'UPDATE_OFFER_SETTINGS', 'SystemSetting', 'offer_settings', req.body, req);

    return res.json({ success: true, message: 'Offer settings saved successfully.' });
  } catch (err: any) {
    console.error('[AdminOffers] Error in updateOfferSettings:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to update settings' } });
  }
};

