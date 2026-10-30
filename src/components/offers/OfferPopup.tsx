import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { offerApi } from '../../lib/api/offerApi';
import { X, Clock, ArrowRight, Tag, PhoneCall, ExternalLink } from 'lucide-react';

interface PopupOfferData {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string;
  bannerImageUrl?: string;
  popupImageUrl?: string;
  category?: string;
  customCategory?: string;
  branchLocation?: string;
  targetAudience?: string;
  pricingType?: string;
  originalPrice: number;
  offerPrice: number;
  discountAmount: number;
  discountPercent: number;
  currency: string;
  theme?: 'light' | 'dark';
  primaryColor?: string;
  secondaryColor?: string;
  ctaType?: string;
  ctaText?: string;
  ctaUrl?: string;
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;
  countdownEnabled: boolean;
  expiresAt?: string;
  popupDelaySeconds?: number;
  course?: {
    id: string;
    title: string;
  } | null;
}

const getCategoryLabel = (category?: string, customCategory?: string) => {
  if (customCategory) return customCategory.toUpperCase();
  switch (category) {
    case 'VARMA_TREATMENT':
      return 'VARMA THERAPY';
    case 'OFFLINE_CLASS':
      return 'OFFLINE ACADEMY';
    case 'SPECIAL_CAMP':
      return 'INTENSIVE CAMP';
    case 'WORKSHOP':
      return 'WORKSHOP';
    case 'SEMINAR':
      return 'SEMINAR';
    case 'SPECIAL_EVENT':
      return 'SPECIAL EVENT';
    case 'ACADEMY_PROGRAMME':
      return 'ACADEMY PROGRAMME';
    case 'ONLINE_COURSE':
    default:
      return 'LIMITED TIME OFFER';
  }
};

export const OfferPopup: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [offer, setOffer] = useState<PopupOfferData | null>(null);
  const [visible, setVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  // Exclude admin, checkout, auth, and offer landing pages
  const isExcludedPage = () => {
    const p = location.pathname.toLowerCase();
    return (
      p.startsWith('/offers') ||
      p.startsWith('/admin') ||
      p.startsWith('/instructor') ||
      p.startsWith('/checkout') ||
      p.startsWith('/learn') ||
      p.startsWith('/payment') ||
      p.startsWith('/login') ||
      p.startsWith('/register') ||
      p.startsWith('/forgot-password') ||
      p.startsWith('/reset-password')
    );
  };

  useEffect(() => {
    if (isExcludedPage()) {
      setVisible(false);
      return;
    }

    let delayTimer: any = null;

    const fetchPopupOffer = async () => {
      try {
        const res = await offerApi.getActivePopupOffer();
        if (res.success && res.data) {
          const offerData: PopupOfferData = res.data;

          // Check if dismissed in current session
          const isDismissed = sessionStorage.getItem(`jadmaa_popup_dismissed_${offerData.id}`);
          if (isDismissed === 'true') {
            return;
          }

          setOffer(offerData);

          const delaySeconds = typeof offerData.popupDelaySeconds === 'number' ? offerData.popupDelaySeconds : 3;
          const delayMs = Math.max(delaySeconds, 1) * 1000;

          delayTimer = setTimeout(() => {
            if (!isExcludedPage()) {
              setVisible(true);
            }
          }, delayMs);
        }
      } catch (err) {
        // Non-blocking
      }
    };

    fetchPopupOffer();

    return () => {
      if (delayTimer) clearTimeout(delayTimer);
    };
  }, [location.pathname]);

  // Live countdown timer
  useEffect(() => {
    if (!offer || !offer.countdownEnabled || !offer.expiresAt) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(offer.expiresAt!).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setVisible(false);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [offer]);

  // Close with session dismissal
  const handleClose = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setVisible(false);
    if (offer) {
      sessionStorage.setItem(`jadmaa_popup_dismissed_${offer.id}`, 'true');
    }
  };

  // Close on Escape key
  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible]);

  // CTA navigation
  const handlePrimaryCta = () => {
    if (!offer) return;
    handleClose();
    if (offer.ctaUrl && offer.ctaType === 'CUSTOM_URL') {
      if (offer.ctaUrl.startsWith('http')) {
        window.open(offer.ctaUrl, '_blank');
      } else {
        navigate(offer.ctaUrl);
      }
    } else {
      navigate(`/offers/${offer.slug}`);
    }
  };

  const handleSecondaryCta = () => {
    if (!offer) return;
    handleClose();
    if (offer.secondaryCtaUrl) {
      if (offer.secondaryCtaUrl.startsWith('http')) {
        window.open(offer.secondaryCtaUrl, '_blank');
      } else {
        navigate(offer.secondaryCtaUrl);
      }
    } else {
      navigate(`/offers/${offer.slug}`);
    }
  };

  if (!visible || !offer || isExcludedPage()) {
    return null;
  }

  const isDark = offer.theme === 'dark';
  const displayImage = offer.popupImageUrl || offer.bannerImageUrl || '/images/pose-dab-red-e1785095608624-653x1024.jpg';
  const categoryLabel = getCategoryLabel(offer.category, offer.customCategory);
  const primaryBrandColor = offer.primaryColor || '#991B1B';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={offer.title}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/55 backdrop-blur-[2px] animate-fadeIn transition-opacity duration-300"
      onClick={() => handleClose()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-[620px] md:max-w-[700px] rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 transform scale-100 ${
          isDark
            ? 'bg-[#141416] text-white border border-zinc-800'
            : 'bg-white text-gray-900 border border-gray-100'
        }`}
      >
        {/* Elegant Close 'X' Button */}
        <button
          onClick={handleClose}
          aria-label="Close promotional offer"
          className={`absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full flex items-center justify-center transition ${
            isDark
              ? 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white'
              : 'bg-gray-100/90 hover:bg-gray-200 text-gray-500 hover:text-gray-900'
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Composition: Desktop Horizontal Split, Mobile Vertical Stack */}
        <div className="flex flex-col md:flex-row items-stretch">
          
          {/* LEFT: Product / Service / Campaign Image */}
          <div className="relative w-full md:w-[42%] min-h-[160px] md:min-h-[340px] bg-gray-950 overflow-hidden shrink-0">
            <img
              src={displayImage}
              alt={offer.title}
              className="w-full h-full object-cover object-center"
            />
            {/* Subtle Gradient Shade for Image Depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/30" />

            {/* Category / Discount Tag Overlay on Mobile */}
            {offer.discountPercent > 0 && (
              <div className="absolute top-3 left-3 md:hidden">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider text-white bg-red-600 shadow-md">
                  {offer.discountPercent}% OFF
                </span>
              </div>
            )}
          </div>

          {/* RIGHT: Offer Details & CTAs */}
          <div className="w-full md:w-[58%] p-5 sm:p-6 md:p-7 flex flex-col justify-between">
            <div>
              {/* Campaign Label Badge */}
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-extrabold tracking-widest uppercase"
                  style={{
                    backgroundColor: `${primaryBrandColor}18`,
                    color: primaryBrandColor
                  }}
                >
                  {categoryLabel}
                </span>

                {offer.discountPercent > 0 && (
                  <span className="hidden md:inline-block px-2 py-0.5 rounded text-[10px] font-black tracking-wide text-white bg-red-600">
                    {offer.discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Offer Headline */}
              <h3
                className={`text-lg sm:text-xl md:text-2xl font-bold font-heading leading-tight tracking-tight ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                {offer.title}
              </h3>

              {/* Supporting Short Description */}
              {offer.shortDescription && (
                <p
                  className={`mt-1.5 text-xs sm:text-sm line-clamp-2 leading-relaxed ${
                    isDark ? 'text-zinc-400' : 'text-gray-600'
                  }`}
                >
                  {offer.shortDescription}
                </p>
              )}

              {/* Price & Savings Display */}
              <div className="mt-3.5 flex items-baseline gap-2.5 flex-wrap">
                {offer.pricingType === 'ENQUIRY_ONLY' ? (
                  <span className="text-base sm:text-lg font-bold text-red-600">
                    Registrations Open
                  </span>
                ) : (
                  <>
                    <span
                      className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight"
                      style={{ color: primaryBrandColor }}
                    >
                      ₹{offer.offerPrice.toLocaleString('en-IN')}
                    </span>

                    {offer.originalPrice > offer.offerPrice && (
                      <span
                        className={`text-sm sm:text-base line-through font-medium ${
                          isDark ? 'text-zinc-500' : 'text-gray-400'
                        }`}
                      >
                        ₹{offer.originalPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Countdown Timer (Compact 4-Box Units) */}
              {timeLeft && (
                <div className="mt-3.5 pt-3 border-t border-dashed border-gray-200 dark:border-zinc-800">
                  <div className="flex items-center gap-1.5 mb-1.5 text-[11px] font-semibold text-gray-500 dark:text-zinc-400">
                    <Clock className="w-3.5 h-3.5 text-red-600" />
                    <span>Offer ends in:</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 py-1 px-1.5 rounded-lg bg-gray-50 dark:bg-zinc-800/80 border border-gray-200/80 dark:border-zinc-700 text-center">
                      <div className="text-sm font-bold font-mono text-gray-900 dark:text-white leading-none">
                        {String(timeLeft.days).padStart(2, '0')}
                      </div>
                      <div className="text-[9px] uppercase tracking-wider text-gray-500 dark:text-zinc-400 mt-0.5">
                        Days
                      </div>
                    </div>

                    <span className="text-gray-400 dark:text-zinc-600 font-bold">:</span>

                    <div className="flex-1 py-1 px-1.5 rounded-lg bg-gray-50 dark:bg-zinc-800/80 border border-gray-200/80 dark:border-zinc-700 text-center">
                      <div className="text-sm font-bold font-mono text-gray-900 dark:text-white leading-none">
                        {String(timeLeft.hours).padStart(2, '0')}
                      </div>
                      <div className="text-[9px] uppercase tracking-wider text-gray-500 dark:text-zinc-400 mt-0.5">
                        Hours
                      </div>
                    </div>

                    <span className="text-gray-400 dark:text-zinc-600 font-bold">:</span>

                    <div className="flex-1 py-1 px-1.5 rounded-lg bg-gray-50 dark:bg-zinc-800/80 border border-gray-200/80 dark:border-zinc-700 text-center">
                      <div className="text-sm font-bold font-mono text-gray-900 dark:text-white leading-none">
                        {String(timeLeft.minutes).padStart(2, '0')}
                      </div>
                      <div className="text-[9px] uppercase tracking-wider text-gray-500 dark:text-zinc-400 mt-0.5">
                        Mins
                      </div>
                    </div>

                    <span className="text-gray-400 dark:text-zinc-600 font-bold">:</span>

                    <div className="flex-1 py-1 px-1.5 rounded-lg bg-gray-50 dark:bg-zinc-800/80 border border-gray-200/80 dark:border-zinc-700 text-center">
                      <div className="text-sm font-bold font-mono text-red-600 dark:text-red-400 leading-none">
                        {String(timeLeft.seconds).padStart(2, '0')}
                      </div>
                      <div className="text-[9px] uppercase tracking-wider text-gray-500 dark:text-zinc-400 mt-0.5">
                        Secs
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Primary & Secondary Action CTAs */}
            <div className="mt-4 pt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                onClick={handlePrimaryCta}
                style={{ backgroundColor: primaryBrandColor }}
                className="flex-1 px-4 py-2.5 rounded-xl text-white font-bold text-xs sm:text-sm tracking-wide shadow-md hover:brightness-110 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{offer.ctaText || 'Claim Offer Now'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleSecondaryCta}
                className={`px-3.5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  isDark
                    ? 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <span>{offer.secondaryCtaText || 'View Details'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
