import React, { useState, useEffect } from 'react';
import {
  X, Calendar, ArrowRight, Clock,
  HeartPulse, Zap, ShieldCheck, Award,
  Sparkles, GraduationCap, MapPin, CheckCircle2
} from 'lucide-react';

export interface CampaignOfferDetails {
  id?: string;
  slug: string;
  title: string;
  shortDescription?: string;
  bannerImageUrl?: string;
  popupImageUrl?: string;
  mobileImageUrl?: string;
  category?: string;
  customCategory?: string;
  branchLocation?: string;
  targetAudience?: string;
  pricingType?: string;
  originalPrice: number;
  offerPrice: number;
  discountAmount?: number;
  discountPercent?: number;
  currency?: string;
  theme?: 'light' | 'dark';
  primaryColor?: string;
  secondaryColor?: string;
  ctaType?: string;
  ctaText?: string;
  ctaUrl?: string;
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;
  countdownEnabled?: boolean;
  expiresAt?: string;
  course?: {
    id: string;
    title: string;
  } | null;
}

interface PremiumCampaignPopupProps {
  offer: CampaignOfferDetails;
  onClose?: () => void;
  onPrimaryCta?: () => void;
  onSecondaryCta?: () => void;
  isInteractivePreview?: boolean;
}

export const PremiumCampaignPopup: React.FC<PremiumCampaignPopupProps> = ({
  offer,
  onClose,
  onPrimaryCta,
  onSecondaryCta,
  isInteractivePreview = false
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 14, hours: 23, minutes: 18, seconds: 42 });

  useEffect(() => {
    if (!offer.countdownEnabled || !offer.expiresAt) {
      // Default demo countdown if previewing without expiry
      if (isInteractivePreview) {
        setTimeLeft({ days: 14, hours: 23, minutes: 18, seconds: 42 });
      }
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(offer.expiresAt!).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        if (onClose && !isInteractivePreview) {
          onClose();
        }
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [offer.countdownEnabled, offer.expiresAt, isInteractivePreview]);

  // Visual Category Label
  const getCategoryLabel = () => {
    if (offer.customCategory) return offer.customCategory.toUpperCase();
    switch (offer.category) {
      case 'VARMA_TREATMENT':
        return 'VARMA TREATMENT';
      case 'OFFLINE_CLASS':
        return 'MARTIAL ARTS CLASS';
      case 'SPECIAL_CAMP':
        return 'INTENSIVE CAMP';
      case 'WORKSHOP':
        return 'MASTER WORKSHOP';
      case 'SEMINAR':
        return 'SPECIAL SEMINAR';
      case 'SPECIAL_EVENT':
        return 'SPECIAL EVENT';
      case 'ACADEMY_PROGRAMME':
        return 'ACADEMY PROGRAMME';
      case 'ONLINE_COURSE':
      default:
        return 'ONLINE COURSE';
    }
  };

  // Tagline script for left panel
  const getScriptTagline = () => {
    switch (offer.category) {
      case 'VARMA_TREATMENT':
        return { line1: 'Ancient Knowledge', line2: 'Modern Healing' };
      case 'OFFLINE_CLASS':
        return { line1: 'Authentic Tradition', line2: 'Mastery in Motion' };
      case 'SPECIAL_CAMP':
        return { line1: 'Intensive Training', line2: 'Awaken Your Power' };
      case 'WORKSHOP':
        return { line1: 'Expert Masterclass', line2: 'Hands-on Practice' };
      case 'SEMINAR':
        return { line1: 'Sacred Science', line2: 'Wisdom of Masters' };
      case 'ACADEMY_PROGRAMME':
        return { line1: 'Traditional Discipline', line2: 'Lifetime Excellence' };
      case 'ONLINE_COURSE':
      default:
        return { line1: 'Learn From Masters', line2: 'Ancient Living Art' };
    }
  };

  // Eyebrow tracking for right panel
  const getEyebrowText = () => {
    switch (offer.category) {
      case 'VARMA_TREATMENT':
        return 'TRADITIONAL HEALING';
      case 'OFFLINE_CLASS':
        return 'DIRECT DOJO TRAINING';
      case 'SPECIAL_CAMP':
        return 'SEASONAL TRAINING CAMP';
      case 'WORKSHOP':
        return 'INTENSIVE WORKSHOP';
      case 'SEMINAR':
        return 'KNOWLEDGE & WISDOM';
      case 'ACADEMY_PROGRAMME':
        return 'ACADEMY PROGRAMME';
      case 'ONLINE_COURSE':
      default:
        return 'ONLINE LEARNING CAMPAIGN';
    }
  };

  // Benefits for left panel pills
  const getBenefits = () => {
    switch (offer.category) {
      case 'VARMA_TREATMENT':
        return [
          { icon: HeartPulse, label: 'Relieve Body Pain' },
          { icon: Zap, label: 'Improve Mobility' },
          { icon: ShieldCheck, label: 'Holistic Wellness' },
        ];
      case 'ONLINE_COURSE':
        return [
          { icon: GraduationCap, label: 'Master Instruction' },
          { icon: Zap, label: 'Lifetime Access' },
          { icon: Award, label: 'Verified Certificate' },
        ];
      case 'OFFLINE_CLASS':
      case 'SPECIAL_CAMP':
        return [
          { icon: MapPin, label: 'Dojo Practical' },
          { icon: Zap, label: 'Strength & Agility' },
          { icon: Award, label: 'Certified Training' },
        ];
      default:
        return [
          { icon: Sparkles, label: 'Authentic Lineage' },
          { icon: Zap, label: 'Direct Guidance' },
          { icon: ShieldCheck, label: 'Lifetime Value' },
        ];
    }
  };

  const scriptTagline = getScriptTagline();
  const categoryLabel = getCategoryLabel();
  const eyebrowText = getEyebrowText();
  const benefits = getBenefits();

  // Pricing calculations
  const isEnquiryOnly = offer.pricingType === 'ENQUIRY_ONLY';
  const effectiveDiscountPercent =
    offer.discountPercent && offer.discountPercent > 0
      ? offer.discountPercent
      : offer.originalPrice > 0 && offer.offerPrice < offer.originalPrice
      ? Math.round(((offer.originalPrice - offer.offerPrice) / offer.originalPrice) * 100)
      : 0;

  const primaryBrandColor = offer.primaryColor || '#991B1B';
  const displayImage = offer.popupImageUrl || offer.bannerImageUrl || '/images/wellness-682x1024.png';

  return (
    <div
      className="relative w-full overflow-hidden shadow-2xl transition-all duration-300 rounded-2xl md:rounded-3xl border bg-[#FAF6F0] text-[#1E1B18] border-[#E8DDD0]"
      style={{
        // Keep 16:9 aspect ratio on desktop screens
        maxWidth: '1060px',
      }}
    >
      {/* Upper-right Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          type="button"
          aria-label="Close promotional offer"
          className="absolute top-3.5 right-3.5 md:top-4 md:right-4 z-40 w-8 h-8 rounded-full flex items-center justify-center transition-all bg-white/90 hover:bg-white border border-[#E8DDD0] text-stone-600 hover:text-stone-900 cursor-pointer shadow-xs"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Main 16:9 Split Structure: Left 48% (Artwork), Right 52% (Content) */}
      <div className="flex flex-col md:flex-row items-stretch w-full md:aspect-[16/9]">
        {/* ======================================================== */}
        {/* LEFT PANEL: 48% CAMPAIGN ARTWORK                         */}
        {/* ======================================================== */}
        <div className="relative w-full md:w-[48%] min-h-[260px] md:min-h-full overflow-hidden bg-[#F4EDE2] border-b md:border-b-0 md:border-r border-[#E8DDD0] flex items-center justify-center shrink-0">
          {/* Main Visual Image */}
          <img
            src={displayImage}
            alt={offer.title || 'Campaign Artwork'}
            className="absolute inset-0 w-full h-full object-cover object-center"
          />

          {/* Gentle Warm Base Tint */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* ======================================================== */}
        {/* RIGHT PANEL: 52% EDITORIAL CAMPAIGN CONTENT             */}
        {/* ======================================================== */}
        <div className="relative w-full md:w-[52%] p-5 sm:p-7 lg:p-8 flex flex-col justify-between overflow-hidden">
          {/* Subtle Decorative Mandala Watermark (SVG) */}
          <div className="absolute -top-12 -right-12 w-64 h-64 pointer-events-none opacity-10 text-[#7D6448]">
            <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1.2">
              <circle cx="100" cy="100" r="90" strokeDasharray="3 3" />
              <circle cx="100" cy="100" r="70" />
              <circle cx="100" cy="100" r="50" strokeDasharray="2 2" />
              <circle cx="100" cy="100" r="30" />
              <path d="M100 10 L100 190 M10 100 L190 100 M36 36 L164 164 M36 164 L164 36" />
              <path d="M100 30 C120 70 170 100 170 100 C170 100 120 130 100 170 C80 130 30 100 30 100 C30 100 80 70 100 30 Z" />
            </svg>
          </div>

          <div>
            {/* Top Row: Category and Discount Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-2 pr-8">
              {/* Category Pill */}
              <span className="px-3 py-1 rounded bg-[#EBDDC8] text-[#4A3225] font-bold text-[10px] md:text-[11px] tracking-wider uppercase shadow-xs">
                {categoryLabel}
              </span>

              {/* Discount Pill */}
              {effectiveDiscountPercent > 0 && (
                <span
                  className="px-2.5 py-1 rounded text-white font-extrabold text-[10px] md:text-[11px] tracking-wider uppercase shadow-xs"
                  style={{ backgroundColor: primaryBrandColor }}
                >
                  {effectiveDiscountPercent}% OFF
                </span>
              )}

              {/* Branch / Location indicator (Physical in-person campaigns only) */}
              {offer.category !== 'ONLINE_COURSE' && offer.branchLocation && offer.branchLocation !== 'All Branches' && (
                <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide">
                  • {offer.branchLocation}
                </span>
              )}
            </div>

            {/* Tracking Eyebrow */}
            <p className="text-[10px] md:text-xs font-semibold tracking-[0.24em] text-[#6E5D52] uppercase mt-2">
              {eyebrowText}
            </p>

            {/* Editorial Serif Heading */}
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-[34px] font-black text-[#1E1B18] tracking-tight leading-[1.08] mt-1 line-clamp-2">
              {offer.title || 'Campaign Title'}
            </h2>

            {/* Subtitle / Short Description */}
            <p className="text-xs sm:text-[13px] md:text-sm text-[#4E433E] font-normal leading-relaxed mt-1.5 md:mt-2 line-clamp-2">
              {offer.shortDescription ||
                'Experience authentic traditional training and therapy for a healthier, stronger and disciplined you.'}
            </p>

            {/* Pricing Section */}
            <div className="flex items-baseline mt-2.5 md:mt-3">
              {isEnquiryOnly ? (
                <span
                  className="text-2xl sm:text-3xl font-black tracking-tight"
                  style={{ color: primaryBrandColor }}
                >
                  Free Registration
                </span>
              ) : (
                <>
                  <span
                    className="text-2xl sm:text-3xl lg:text-[34px] font-black tracking-tight"
                    style={{ color: primaryBrandColor }}
                  >
                    ₹{(offer.offerPrice || 0).toLocaleString('en-IN')}
                  </span>
                  {offer.originalPrice > (offer.offerPrice || 0) && (
                    <span className="text-base sm:text-lg lg:text-xl font-medium line-through text-[#9E958E] ml-3">
                      ₹{offer.originalPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Bottom Area: Countdown Ticker and Action CTAs */}
          <div className="mt-3 md:mt-4 space-y-3">
            {/* 4-Box Countdown Timer */}
            {offer.countdownEnabled !== false && (
              <div className="bg-[#FFF5F2] border border-[#FADCD5] rounded-xl px-3.5 py-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] md:text-[11px] font-semibold text-[#8C5248] uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-[#B71918]" />
                    Offer Ends In
                  </span>
                </div>
                <div className="grid grid-cols-4 divide-x divide-[#F2C5BC] text-center">
                  <div className="px-1">
                    <span className="block text-base md:text-lg font-black text-[#1E1B18] leading-tight">
                      {String(timeLeft.days).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] md:text-[10px] font-medium text-[#7A6B63] uppercase">
                      Days
                    </span>
                  </div>
                  <div className="px-1">
                    <span className="block text-base md:text-lg font-black text-[#1E1B18] leading-tight">
                      {String(timeLeft.hours).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] md:text-[10px] font-medium text-[#7A6B63] uppercase">
                      Hours
                    </span>
                  </div>
                  <div className="px-1">
                    <span className="block text-base md:text-lg font-black text-[#1E1B18] leading-tight">
                      {String(timeLeft.minutes).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] md:text-[10px] font-medium text-[#7A6B63] uppercase">
                      Minutes
                    </span>
                  </div>
                  <div className="px-1">
                    <span className="block text-base md:text-lg font-black text-[#1E1B18] leading-tight">
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] md:text-[10px] font-medium text-[#7A6B63] uppercase">
                      Seconds
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* CTA Buttons Row */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onPrimaryCta}
                className="flex-1 py-2.5 md:py-3 px-4 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-[0.99]"
                style={{ backgroundColor: primaryBrandColor }}
              >
                <Calendar className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {offer.ctaText || (isEnquiryOnly ? 'Register Now' : 'Book Your Session')}
                </span>
                <ArrowRight className="w-4 h-4 shrink-0 ml-0.5" />
              </button>

              <button
                type="button"
                onClick={onSecondaryCta || onPrimaryCta}
                className="py-2.5 md:py-3 px-4 rounded-xl border border-[#2B231D] text-[#2B231D] hover:bg-[#2B231D]/5 font-semibold text-xs sm:text-sm transition-all duration-200 cursor-pointer shrink-0"
              >
                {offer.secondaryCtaText || 'View Details'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

