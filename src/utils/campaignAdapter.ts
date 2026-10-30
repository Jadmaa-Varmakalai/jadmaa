import type { PublicOfferDetails, CourseOfferItem } from '../lib/api/offerApi';
import type { CampaignLandingData } from '../components/campaigns/PremiumCampaignLandingPage';

export function getCategoryBadgeLabel(category?: string, customCategory?: string): string {
  if (customCategory && customCategory.trim()) {
    return customCategory.trim().toUpperCase();
  }
  switch (category) {
    case 'VARMA_TREATMENT':
      return 'VARMA TREATMENT';
    case 'OFFLINE_CLASS':
      return 'OFFLINE CLASSES';
    case 'SPECIAL_CAMP':
      return 'SPECIAL CAMP';
    case 'WORKSHOP':
      return 'MASTER WORKSHOP';
    case 'SEMINAR':
      return 'ACADEMY SEMINAR';
    case 'SPECIAL_EVENT':
      return 'SPECIAL EVENT';
    case 'ACADEMY_PROGRAMME':
      return 'ACADEMY PROGRAMME';
    case 'ONLINE_COURSE':
    default:
      return 'ONLINE COURSE';
  }
}

export function getDefaultEyebrow(category?: string): string {
  switch (category) {
    case 'VARMA_TREATMENT':
      return 'ANCIENT SCIENCE FOR';
    case 'OFFLINE_CLASS':
      return 'DIRECT GURUKULAM TRAINING';
    case 'SPECIAL_CAMP':
      return 'INTENSIVE RESIDENTIAL CAMP';
    case 'WORKSHOP':
      return 'ADVANCED MASTER WORKSHOP';
    case 'SEMINAR':
      return 'ACADEMY SEMINAR & LECTURE';
    case 'SPECIAL_EVENT':
      return 'EXCLUSIVE ACADEMY EVENT';
    case 'ONLINE_COURSE':
    default:
      return 'AUTHENTIC LINEAGE TRAINING';
  }
}

export function getDefaultTagline(category?: string): string {
  switch (category) {
    case 'VARMA_TREATMENT':
      return 'Empowering your wellness naturally';
    case 'OFFLINE_CLASS':
      return 'Train with lineage masters';
    case 'SPECIAL_CAMP':
      return 'Immersion in traditional arts';
    case 'WORKSHOP':
      return 'Deep dive into practical points';
    case 'SEMINAR':
      return 'Preserving ancient Tamil heritage';
    case 'ONLINE_COURSE':
    default:
      return 'Master the ancient martial science';
  }
}

export function getDefaultBenefits(category?: string): string[] {
  switch (category) {
    case 'VARMA_TREATMENT':
      return ['Relieve Chronic Pain', 'Nerve Pathway Stimulation', 'Certified Varma Masters'];
    case 'OFFLINE_CLASS':
      return ['In-Person Direct Guidance', 'Practical Self-Defense', 'All Skill Levels Welcome'];
    case 'SPECIAL_CAMP':
      return ['Full Residential Training', 'Daily Intensive Practice', 'Certificate on Completion'];
    case 'WORKSHOP':
      return ['Hands-On Point Anatomy', 'Clinical Applications', 'Certificate of Attendance'];
    case 'SEMINAR':
      return ['Scientific & Historical Insights', 'Interactive Q&A', 'Exclusive Resource Handouts'];
    case 'ONLINE_COURSE':
    default:
      return ['Lifetime Access & Updates', 'HD Video Lessons & Practice', 'Verified Certificate'];
  }
}

export function resolveCtaConfig(offer: Partial<PublicOfferDetails & CourseOfferItem>): {
  primaryText: string;
  primaryAction: string;
  secondaryText: string;
} {
  const category = offer.category || 'ONLINE_COURSE';

  switch (category) {
    case 'VARMA_TREATMENT':
      return {
        primaryText: offer.ctaText || 'Book Your Session',
        primaryAction: offer.ctaType || 'BOOK_TREATMENT',
        secondaryText: offer.secondaryCtaText || 'View Details',
      };
    case 'OFFLINE_CLASS':
      return {
        primaryText: offer.ctaText || 'Join a Class',
        primaryAction: offer.ctaType || 'ENQUIRE_OFFLINE',
        secondaryText: offer.secondaryCtaText || 'Contact Academy',
      };
    case 'SPECIAL_CAMP':
      return {
        primaryText: offer.ctaText || 'Register Now',
        primaryAction: offer.ctaType || 'REGISTER_CAMP',
        secondaryText: offer.secondaryCtaText || 'View Camp Details',
      };
    case 'WORKSHOP':
    case 'SEMINAR':
    case 'SPECIAL_EVENT':
      return {
        primaryText: offer.ctaText || 'Register Now',
        primaryAction: offer.ctaType || 'REGISTER_EVENT',
        secondaryText: offer.secondaryCtaText || 'View Details',
      };
    case 'ONLINE_COURSE':
    default:
      return {
        primaryText: offer.ctaText || 'Enrol Now',
        primaryAction: offer.ctaType || 'ENROLL_COURSE',
        secondaryText: offer.secondaryCtaText || 'View Course',
      };
  }
}

export function adaptOfferToCampaignData(offer: PublicOfferDetails | CourseOfferItem): CampaignLandingData {
  let discountType: 'percentage' | 'fixed' | 'none' = 'none';
  let discountValue: number | undefined = undefined;

  if (offer.pricingType === 'PERCENTAGE' && offer.discountPercent && offer.discountPercent > 0) {
    discountType = 'percentage';
    discountValue = Math.round(offer.discountPercent);
  } else if (offer.pricingType === 'FIXED_DISCOUNT' && offer.discountAmount && offer.discountAmount > 0) {
    discountType = 'fixed';
    discountValue = Math.round(offer.discountAmount);
  } else if (
    (offer.pricingType === 'FIXED_PRICE' || !offer.pricingType) &&
    offer.originalPrice > offer.offerPrice &&
    offer.offerPrice > 0
  ) {
    discountType = 'percentage';
    discountValue = Math.round(((offer.originalPrice - offer.offerPrice) / offer.originalPrice) * 100);
  }

  const categoryLabel = getCategoryBadgeLabel(offer.category, offer.customCategory);
  const defaultEyebrow = getDefaultEyebrow(offer.category);
  const defaultTagline = getDefaultTagline(offer.category);
  const defaultBenefits = getDefaultBenefits(offer.category);
  const { primaryText, primaryAction, secondaryText } = resolveCtaConfig(offer);

  const isEnquiry = offer.pricingType === 'ENQUIRY_ONLY';

  // For headline, use configured headline or fall back to title
  let headline = (offer as any).headline;
  if (!headline || !headline.trim()) {
    if (offer.category === 'VARMA_TREATMENT' && offer.title.toLowerCase().includes('treatment')) {
      headline = 'A Healthier\nStronger You';
    } else {
      headline = offer.title;
    }
  }

  // Hero image fallback: pick 16:9 landscape asset
  let heroImage = offer.bannerImageUrl;
  if (!heroImage) {
    heroImage = '/images/optimized/training-stance.webp';
  }

  const benefits =
    (offer as any).benefits && Array.isArray((offer as any).benefits) && (offer as any).benefits.length > 0
      ? (offer as any).benefits
      : defaultBenefits;

  return {
    id: offer.id,
    title: offer.title,
    slug: offer.slug,
    category: categoryLabel,
    eyebrow: (offer as any).eyebrow || defaultEyebrow,
    headline,
    description: offer.description || offer.shortDescription,
    brandLogo: '/logo.png',
    heroImage,
    mobileHeroImage: offer.mobileImageUrl || undefined,
    imagePosition: (offer as any).imagePosition || 'center',
    imageTagline: (offer as any).imageTagline || defaultTagline,
    discountType,
    discountValue,
    originalPrice: !isEnquiry && offer.originalPrice > 0 ? offer.originalPrice : undefined,
    promotionalPrice: !isEnquiry && offer.offerPrice > 0 ? offer.offerPrice : undefined,
    startsAt: offer.startAt || undefined,
    expiresAt: offer.expiresAt || undefined,
    showCountdown: Boolean(offer.countdownEnabled && offer.expiresAt),
    benefits,
    primaryCtaText: offer.ctaText || primaryText,
    primaryCtaAction: offer.ctaType || primaryAction,
    primaryCtaUrl: offer.ctaUrl || undefined,
    secondaryCtaText: offer.secondaryCtaText || secondaryText,
    secondaryCtaUrl: offer.secondaryCtaUrl || undefined,
    termsAndConditions: offer.termsAndConditions || undefined,
  };
}

