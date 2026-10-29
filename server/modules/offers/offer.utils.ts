import { CourseOffer, OfferStatus } from '@prisma/client';

export type ComputedOfferStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'EXPIRED' | 'DISABLED' | 'ARCHIVED';

/**
 * Computes the authoritative runtime status of an offer based on server time and DB state.
 */
export const computeOfferStatus = (
  offer: Pick<CourseOffer, 'status' | 'isEnabled' | 'startAt' | 'expiresAt' | 'bookingLimit' | 'currentBookings'>
): ComputedOfferStatus => {
  if (offer.status === 'ARCHIVED') return 'ARCHIVED';
  if (!offer.isEnabled || offer.status === 'DISABLED') return 'DISABLED';
  if (offer.status === 'DRAFT') return 'DRAFT';

  const now = new Date();

  // Booking limit reached check
  if (offer.bookingLimit && offer.currentBookings >= offer.bookingLimit) {
    return 'EXPIRED';
  }

  // Future scheduled check
  if (offer.startAt && new Date(offer.startAt) > now) {
    return 'SCHEDULED';
  }

  // Expiry check
  if (offer.expiresAt && new Date(offer.expiresAt) <= now) {
    return 'EXPIRED';
  }

  return 'PUBLISHED';
};

/**
 * Converts a string into a clean, URL-safe slug.
 */
export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
};

