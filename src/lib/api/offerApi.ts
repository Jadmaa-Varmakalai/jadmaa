import { fetchApi } from './apiClient';

export interface CourseOfferItem {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description?: string;
  bannerImageUrl?: string;
  galleryImages?: string[];
  courseId: string;
  courseTitle: string;
  originalPrice: number;
  offerPrice: number;
  discountAmount: number;
  discountPercent: number;
  currency: string;
  termsAndConditions?: string;
  supportEmail?: string;
  supportPhone?: string;
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'EXPIRED' | 'DISABLED' | 'ARCHIVED';
  computedStatus: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'EXPIRED' | 'DISABLED' | 'ARCHIVED';
  isEnabled: boolean;
  showPopup: boolean;
  popupPriority: number;
  startAt?: string | null;
  expiresAt?: string | null;
  countdownEnabled: boolean;
  bookingLimit?: number | null;
  currentBookings: number;
  verifiedBookingsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface OfferBookingItem {
  id: string;
  bookingNumber: string;
  offerId: string;
  offer: { id: string; title: string; slug: string };
  courseId: string;
  course: { id: string; title: string };
  userId: string;
  user: { id: string; name: string; email: string; phone?: string };
  paymentId?: string;
  payment?: {
    id: string;
    merchantOrderId: string;
    gatewayTransactionId?: string;
    status: string;
    paidAt?: string;
  };
  enrollmentId?: string;
  enrollment?: { id: string; status: string; enrolledAt: string };
  amount: number;
  currency: string;
  status: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  createdAt: string;
}

export interface OfferSettings {
  popupEnabled: boolean;
  popupDelaySeconds: number;
}

export interface PublicOfferDetails {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  bannerImageUrl?: string;
  galleryImages: string[];
  originalPrice: number;
  offerPrice: number;
  discountAmount: number;
  discountPercent: number;
  currency: string;
  termsAndConditions?: string;
  supportEmail: string;
  supportPhone: string;
  countdownEnabled: boolean;
  startAt?: string | null;
  expiresAt?: string | null;
  bookingLimit?: number | null;
  currentBookings: number;
  computedStatus: string;
  isBookable: boolean;
  course: {
    id: string;
    title: string;
    subtitle?: string;
    description: string;
    longDescription?: string;
    thumbnailUrl?: string;
    level: string;
    duration?: string;
    category: string;
    rating: number;
    reviewCount: number;
    totalLessons: number;
    instructor: {
      displayName: string;
      title?: string;
      avatarUrl?: string;
      bio?: string;
    };
    modules: Array<{
      id: string;
      title: string;
      description?: string;
      lessonCount: number;
      lessons: Array<{
        id: string;
        title: string;
        duration: string;
        isFreePreview: boolean;
      }>;
    }>;
  };
}

export const offerApi = {
  // Public endpoints
  getActivePopupOffer: async () => {
    return fetchApi('/offers/active-popup');
  },

  getOfferBySlug: async (slug: string) => {
    return fetchApi(`/offers/${slug}`);
  },

  initiateOfferBooking: async (slug: string) => {
    return fetchApi(`/offers/${slug}/book`, {
      method: 'POST'
    });
  },

  verifyOfferPayment: async (slug: string, payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    return fetchApi(`/offers/${slug}/verify`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Admin endpoints
  getAdminOffers: async () => {
    return fetchApi('/admin/offers');
  },

  getAdminOfferById: async (id: string) => {
    return fetchApi(`/admin/offers/${id}`);
  },

  createOffer: async (data: any) => {
    return fetchApi('/admin/offers', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateOffer: async (id: string, data: any) => {
    return fetchApi(`/admin/offers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  toggleOffer: async (id: string) => {
    return fetchApi(`/admin/offers/${id}/toggle`, {
      method: 'PATCH'
    });
  },

  duplicateOffer: async (id: string) => {
    return fetchApi(`/admin/offers/${id}/duplicate`, {
      method: 'POST'
    });
  },

  deleteOffer: async (id: string) => {
    return fetchApi(`/admin/offers/${id}`, {
      method: 'DELETE'
    });
  },

  getOfferBookings: async (params: { page?: number; limit?: number; offerId?: string; status?: string; search?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.offerId) query.append('offerId', params.offerId);
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('search', params.search);

    const qs = query.toString();
    return fetchApi(`/admin/offers/bookings${qs ? `?${qs}` : ''}`);
  },

  getOfferSettings: async () => {
    return fetchApi('/admin/offers/settings');
  },

  updateOfferSettings: async (settings: Partial<OfferSettings>) => {
    return fetchApi('/admin/offers/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }
};
