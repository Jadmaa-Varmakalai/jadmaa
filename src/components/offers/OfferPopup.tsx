import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { offerApi } from '../../lib/api/offerApi';
import { X, Sparkles, Clock, ArrowRight, Tag } from 'lucide-react';

interface PopupOfferData {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string;
  bannerImageUrl?: string;
  originalPrice: number;
  offerPrice: number;
  discountAmount: number;
  discountPercent: number;
  currency: string;
  countdownEnabled: boolean;
  expiresAt?: string;
  popupDelaySeconds?: number;
  course: {
    id: string;
    title: string;
  };
}

export const OfferPopup: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [offer, setOffer] = useState<PopupOfferData | null>(null);
  const [visible, setVisible] = useState(false);
  const [countdownText, setCountdownText] = useState<string | null>(null);

  // Exclude administrative, checkout, auth, and offer landing pages
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

          // Check if dismissed in current browsing session
          const isDismissed = sessionStorage.getItem(`jadmaa_sticker_closed_${offerData.id}`);
          if (isDismissed === 'true') {
            return;
          }

          setOffer(offerData);

          // Delay appearance as configured (default 2.5s)
          const delaySeconds = typeof offerData.popupDelaySeconds === 'number' ? offerData.popupDelaySeconds : 2.5;
          const delayMs = Math.max(delaySeconds, 1) * 1000;

          delayTimer = setTimeout(() => {
            if (!isExcludedPage()) {
              setVisible(true);
            }
          }, delayMs);
        }
      } catch (err) {
        // Non-blocking for general user browsing
      }
    };

    fetchPopupOffer();

    return () => {
      if (delayTimer) clearTimeout(delayTimer);
    };
  }, [location.pathname]);

  // Live countdown timer in sticker (when enabled)
  useEffect(() => {
    if (!offer || !offer.countdownEnabled || !offer.expiresAt) {
      setCountdownText(null);
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

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 24) {
        const days = Math.floor(hours / 24);
        setCountdownText(`${days}d ${hours % 24}h`);
      } else {
        setCountdownText(`${hours}h ${mins}m ${secs}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [offer]);

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVisible(false);
    if (offer) {
      // Remember dismissal in current session so it doesn't repeatedly appear on navigation
      sessionStorage.setItem(`jadmaa_sticker_closed_${offer.id}`, 'true');
    }
  };

  const handleNavigate = () => {
    if (offer) {
      navigate(`/offers/${offer.slug}`);
    }
  };

  if (!visible || !offer || isExcludedPage()) {
    return null;
  }

  return (
    <aside
      aria-label="Promotional Offer"
      className="fixed bottom-5 left-5 z-40 w-[270px] sm:w-[285px] max-w-[calc(100vw-2.5rem)] animate-sticker-enter select-none"
    >
      <div
        onClick={handleNavigate}
        className="group relative cursor-pointer overflow-hidden rounded-xl bg-[#141416]/95 hover:bg-[#1A1A1E] backdrop-blur-md border border-red-900/40 hover:border-red-600/60 p-3.5 shadow-2xl shadow-black/70 transition-all duration-300 hover:-translate-y-0.5"
      >
        {/* Subtle Crimson Accent Bar on Top */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-700 via-amber-500 to-red-600" />

        {/* Top Header Row: Label Badge + Discount Tag + Close Button */}
        <div className="flex items-center justify-between gap-1.5 mb-1.5">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold tracking-wider uppercase bg-red-950/80 text-red-300 border border-red-800/50">
              <Sparkles className="w-2.5 h-2.5 text-amber-400 shrink-0" />
              SPECIAL OFFER
            </span>

            {offer.discountPercent > 0 && (
              <span className="inline-flex items-center text-[10px] font-black text-amber-300 bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-800/40 shrink-0">
                {offer.discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Close 'X' Button */}
          <button
            onClick={handleClose}
            aria-label="Dismiss promotional offer"
            className="shrink-0 p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Course Title & Short Detail */}
        <div className="text-left pr-2">
          <h4 className="text-xs font-bold text-white tracking-tight line-clamp-1 group-hover:text-red-200 transition-colors">
            {offer.title || offer.course.title}
          </h4>
          <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5 font-normal">
            {offer.course.title}
          </p>
        </div>

        {/* Price & Action Row */}
        <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-extrabold text-red-400 font-heading">
              ₹{offer.offerPrice.toLocaleString('en-IN')}
            </span>
            {offer.originalPrice > offer.offerPrice && (
              <span className="text-[11px] text-gray-500 line-through">
                ₹{offer.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white group-hover:text-red-300 transition-colors shrink-0">
            <span>View Offer</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>

        {/* Optional Tiny Countdown Indicator */}
        {countdownText && (
          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-mono font-medium text-amber-300/90">
            <Clock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
            <span>Ends in {countdownText}</span>
          </div>
        )}
      </div>
    </aside>
  );
};
