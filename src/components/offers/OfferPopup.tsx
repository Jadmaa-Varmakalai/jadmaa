import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { offerApi } from '../../lib/api/offerApi';
import { X, ArrowRight, Clock } from 'lucide-react';

interface PopupOfferData {
  id: string;
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
      return 'LIMITED CAMPAIGN';
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

          const delaySeconds = typeof offerData.popupDelaySeconds === 'number' ? offerData.popupDelaySeconds : 2;
          const delayMs = Math.max(delaySeconds, 1) * 1000;

          delayTimer = setTimeout(() => {
            if (!isExcludedPage()) {
              setVisible(true);
            }
          }, delayMs);
        }
      } catch (err) {
        console.warn('[OfferPopup] Could not fetch popup offer:', err);
      }
    };

    fetchPopupOffer();

    return () => {
      if (delayTimer) clearTimeout(delayTimer);
    };
  }, [location.pathname]);

  // Real-time Countdown calculation
  useEffect(() => {
    if (!offer || !offer.countdownEnabled || !offer.expiresAt) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(offer.expiresAt!).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft(null);
        setVisible(false); // Automatically hide when expired
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
  }, [offer]);

  const handleClose = () => {
    if (offer) {
      sessionStorage.setItem(`jadmaa_popup_dismissed_${offer.id}`, 'true');
    }
    setVisible(false);
  };

  const handlePrimaryCta = () => {
    if (!offer) return;
    handleClose();
    if (offer.ctaType === 'CUSTOM_URL' && offer.ctaUrl) {
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
  const desktopImage = offer.popupImageUrl || offer.bannerImageUrl || '/images/wellness-682x1024.png';
  const mobileImage = offer.mobileImageUrl || offer.popupImageUrl || offer.bannerImageUrl || '/images/wellness-682x1024.png';
  const categoryLabel = getCategoryLabel(offer.category, offer.customCategory);
  const primaryBrandColor = offer.primaryColor || '#991B1B';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={offer.title}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fadeIn transition-opacity duration-300"
      onClick={() => handleClose()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-[680px] rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 transform scale-100 ${
          isDark
            ? 'bg-[#141416] text-white border border-zinc-800/90'
            : 'bg-white text-gray-900 border border-gray-100'
        }`}
      >
        {/* Top-Right Close Button */}
        <button
          onClick={handleClose}
          aria-label="Close promotional offer"
          className={`absolute top-3 right-3 z-30 w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer ${
            isDark
              ? 'bg-zinc-800/90 hover:bg-zinc-700 text-zinc-400 hover:text-white'
              : 'bg-gray-100/90 hover:bg-gray-200 text-gray-500 hover:text-gray-900'
          }`}
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* ======================================================== */}
        {/* DESKTOP COMPOSITION (Horizontal balanced editorial card) */}
        {/* ======================================================== */}
        <div className="hidden md:flex flex-row items-stretch min-h-[340px]">
          {/* Left: 42% Image Area */}
          <div className="w-[42%] relative overflow-hidden bg-gray-950 shrink-0">
            <img
              src={desktopImage}
              alt={offer.title}
              className="w-full h-full object-cover object-center"
            />
            {/* Subtle depth shade */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/20 pointer-events-none" />
          </div>

          {/* Right: 58% Content Area */}
          <div className="w-[58%] p-6 flex flex-col justify-between">
            <div>
              {/* Category & Discount Tag */}
              <div className="flex items-center gap-2 mb-2 pr-6">
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
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase text-white bg-red-700">
                    {offer.discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Headline */}
              <h3 className="text-xl font-bold font-heading leading-tight tracking-tight pr-6">
                {offer.title}
              </h3>

              {/* Short Description */}
              {offer.shortDescription && (
                <p
                  className={`mt-1.5 text-xs line-clamp-2 leading-relaxed ${
                    isDark ? 'text-zinc-400' : 'text-gray-600'
                  }`}
                >
                  {offer.shortDescription}
                </p>
              )}

              {/* Price & Savings Display */}
              <div className="mt-3 flex items-baseline gap-2.5 flex-wrap">
                {offer.pricingType === 'ENQUIRY_ONLY' ? (
                  <span className="text-base font-bold text-red-600">
                    Consultation & Registration Open
                  </span>
                ) : (
                  <>
                    <span
                      className="text-2xl font-black font-heading tracking-tight"
                      style={{ color: primaryBrandColor }}
                    >
                      ₹{offer.offerPrice.toLocaleString('en-IN')}
                    </span>

                    {offer.originalPrice > offer.offerPrice && (
                      <span
                        className={`text-sm line-through font-medium ${
                          isDark ? 'text-zinc-500' : 'text-gray-400'
                        }`}
                      >
                        ₹{offer.originalPrice.toLocaleString('en-IN')}
                      </span>
                    )}

                    {offer.discountAmount > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-50 text-green-700 dark:bg-green-950/60 dark:text-green-400 border border-green-200 dark:border-green-800/40">
                        Save ₹{offer.discountAmount.toLocaleString('en-IN')}
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Countdown Timer */}
              {timeLeft && (
                <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-zinc-800">
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] font-semibold text-gray-500 dark:text-zinc-400">
                    <Clock className="w-3 h-3 text-red-600" />
                    <span>Offer ends in:</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="px-2 py-1 rounded-md bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 text-center min-w-[42px]">
                      <div className="text-xs font-bold font-mono text-gray-900 dark:text-white leading-none">
                        {String(timeLeft.days).padStart(2, '0')}
                      </div>
                      <div className="text-[8px] uppercase tracking-wider text-gray-400 dark:text-zinc-400 mt-0.5">
                        Days
                      </div>
                    </div>
                    <span className="text-gray-400 text-xs font-bold">:</span>
                    <div className="px-2 py-1 rounded-md bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 text-center min-w-[42px]">
                      <div className="text-xs font-bold font-mono text-gray-900 dark:text-white leading-none">
                        {String(timeLeft.hours).padStart(2, '0')}
                      </div>
                      <div className="text-[8px] uppercase tracking-wider text-gray-400 dark:text-zinc-400 mt-0.5">
                        Hours
                      </div>
                    </div>
                    <span className="text-gray-400 text-xs font-bold">:</span>
                    <div className="px-2 py-1 rounded-md bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 text-center min-w-[42px]">
                      <div className="text-xs font-bold font-mono text-gray-900 dark:text-white leading-none">
                        {String(timeLeft.minutes).padStart(2, '0')}
                      </div>
                      <div className="text-[8px] uppercase tracking-wider text-gray-400 dark:text-zinc-400 mt-0.5">
                        Mins
                      </div>
                    </div>
                    <span className="text-gray-400 text-xs font-bold">:</span>
                    <div className="px-2 py-1 rounded-md bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 text-center min-w-[42px]">
                      <div className="text-xs font-bold font-mono text-red-600 dark:text-red-400 leading-none">
                        {String(timeLeft.seconds).padStart(2, '0')}
                      </div>
                      <div className="text-[8px] uppercase tracking-wider text-gray-400 dark:text-zinc-400 mt-0.5">
                        Secs
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="mt-4 pt-3 flex items-center gap-2">
              <button
                onClick={handlePrimaryCta}
                style={{ backgroundColor: primaryBrandColor }}
                className="flex-1 px-4 py-2.5 rounded-xl text-white font-bold text-xs tracking-wide shadow-md hover:brightness-110 active:scale-[0.99] transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{offer.ctaText || 'Claim Offer Now'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleSecondaryCta}
                className={`px-3 py-2.5 rounded-xl font-semibold text-xs transition cursor-pointer ${
                  isDark
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {offer.secondaryCtaText || 'View Details'}
              </button>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* MOBILE COMPOSITION (Compact vertical responsive card)   */}
        {/* ======================================================== */}
        <div className="flex md:hidden flex-col">
          {/* Top: Compact Mobile Image */}
          <div className="w-full h-36 relative overflow-hidden bg-gray-950 shrink-0">
            <img
              src={mobileImage}
              alt={offer.title}
              className="w-full h-full object-cover object-center"
            />
            {/* Category tag overlay */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
              <span
                className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider text-white bg-black/70 backdrop-blur-xs"
              >
                {categoryLabel}
              </span>
              {offer.discountPercent > 0 && (
                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider text-white bg-red-700">
                  {offer.discountPercent}% OFF
                </span>
              )}
            </div>
          </div>

          {/* Bottom: Mobile Content & CTA */}
          <div className="p-4 space-y-3">
            <div>
              <h3 className="text-base font-bold font-heading leading-tight tracking-tight">
                {offer.title}
              </h3>
              {offer.shortDescription && (
                <p
                  className={`mt-1 text-[11px] line-clamp-2 leading-relaxed ${
                    isDark ? 'text-zinc-400' : 'text-gray-600'
                  }`}
                >
                  {offer.shortDescription}
                </p>
              )}
            </div>

            {/* Price Row */}
            <div className="flex items-baseline gap-2">
              {offer.pricingType === 'ENQUIRY_ONLY' ? (
                <span className="text-sm font-bold text-red-600">
                  Registration Open
                </span>
              ) : (
                <>
                  <span
                    className="text-xl font-black font-heading"
                    style={{ color: primaryBrandColor }}
                  >
                    ₹{offer.offerPrice.toLocaleString('en-IN')}
                  </span>
                  {offer.originalPrice > offer.offerPrice && (
                    <span
                      className={`text-xs line-through ${
                        isDark ? 'text-zinc-500' : 'text-gray-400'
                      }`}
                    >
                      ₹{offer.originalPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Mobile Countdown Timer */}
            {timeLeft && (
              <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-gray-50 dark:bg-zinc-800/60 border border-gray-100 dark:border-zinc-800 text-[11px]">
                <div className="flex items-center gap-1 text-gray-500 dark:text-zinc-400 font-semibold text-[10px]">
                  <Clock className="w-3 h-3 text-red-600" />
                  <span>Ends in:</span>
                </div>
                <div className="font-mono font-bold text-red-600 dark:text-red-400">
                  {timeLeft.days}d : {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s
                </div>
              </div>
            )}

            {/* Mobile CTAs */}
            <div className="pt-1 flex items-center gap-2">
              <button
                onClick={handlePrimaryCta}
                style={{ backgroundColor: primaryBrandColor }}
                className="flex-1 py-2.5 rounded-xl text-white font-bold text-xs shadow-md active:scale-[0.99] transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{offer.ctaText || 'Claim Offer'}</span>
                <ArrowRight className="w-3 h-3" />
              </button>

              <button
                onClick={handleSecondaryCta}
                className={`px-3 py-2.5 rounded-xl font-semibold text-xs transition cursor-pointer ${
                  isDark
                    ? 'bg-zinc-800 text-zinc-300'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Details
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
