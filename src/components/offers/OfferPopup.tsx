import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { offerApi } from '../../lib/api/offerApi';
import { X, Sparkles, Clock, ArrowRight, Tag, ShieldCheck } from 'lucide-react';

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

  // Exclude administrative, checkout, and offer landing pages
  const isExcludedPage = () => {
    const p = location.pathname.toLowerCase();
    return (
      p.startsWith('/offers') ||
      p.startsWith('/admin') ||
      p.startsWith('/instructor') ||
      p.startsWith('/checkout') ||
      p.startsWith('/learn') ||
      p.startsWith('/payment')
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
          const isDismissed = sessionStorage.getItem(`jadmaa_popup_closed_${offerData.id}`);
          if (isDismissed === 'true') {
            return;
          }

          setOffer(offerData);

          // Fast, responsive appearance (default 1.2s so users see it immediately)
          const delay = Math.min((offerData.popupDelaySeconds || 1.2), 3) * 1000;
          delayTimer = setTimeout(() => {
            if (!isExcludedPage()) {
              setVisible(true);
            }
          }, delay);
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

  // Live countdown timer in popup
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

      setCountdownText(`${hours}h ${mins}m ${secs}s left`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [offer]);

  const handleClose = () => {
    setVisible(false);
    if (offer) {
      // Remember dismissal in current session so it doesn't repeatedly annoy the user on every click
      sessionStorage.setItem(`jadmaa_popup_closed_${offer.id}`, 'true');
    }
  };

  const handleViewOffer = () => {
    if (offer) {
      setVisible(false);
      navigate(`/offers/${offer.slug}`);
    }
  };

  if (!visible || !offer || isExcludedPage()) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
      
      {/* Click outside to close */}
      <div className="fixed inset-0" onClick={handleClose} />

      {/* Main Popup Modal Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Special Promotional Offer"
        className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden z-10 transform transition-all duration-300 scale-100"
      >
        {/* Top Decorative Banner Ribbon */}
        <div className="h-2 bg-gradient-to-r from-jadmaa-red via-jadmaa-gold to-jadmaa-red" />

        {/* Circular Close Button (X) */}
        <button
          onClick={handleClose}
          aria-label="Close promotional popup"
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all duration-200 shadow-md cursor-pointer hover:rotate-90"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Promotional Image Header */}
        <div className="relative aspect-[16/9] w-full bg-gray-900 overflow-hidden">
          {offer.bannerImageUrl ? (
            <img
              src={offer.bannerImageUrl}
              alt={offer.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-jadmaa-cream text-jadmaa-red font-bold text-lg">
              SPECIAL PROMOTIONAL OFFER
            </div>
          )}

          {/* Gradient Overlay & Badge */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-between p-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-jadmaa-red text-white text-xs font-extrabold uppercase tracking-wider shadow-lg">
                <Sparkles className="w-3.5 h-3.5" />
                Special Offer • Save {offer.discountPercent}%
              </span>
            </div>

            {countdownText && (
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-white bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg w-fit border border-white/20">
                <Clock className="w-3.5 h-3.5 text-jadmaa-gold animate-pulse" />
                <span>Offer ends in: {countdownText}</span>
              </div>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 text-left">
          
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-jadmaa-red uppercase tracking-wider">
              {offer.course.title}
            </span>
            <h3 className="text-xl font-black font-heading text-jadmaa-charcoal leading-snug">
              {offer.title}
            </h3>
            {offer.shortDescription && (
              <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed pt-0.5">
                {offer.shortDescription}
              </p>
            )}
          </div>

          {/* Price Highlight Banner */}
          <div className="bg-jadmaa-cream/80 p-3.5 rounded-2xl border border-jadmaa-border/40 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Exclusive Offer Price</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black font-heading text-jadmaa-red">
                  ₹{offer.offerPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-sm font-semibold text-gray-400 line-through">
                  ₹{offer.originalPrice.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded-xl bg-green-600 text-white text-xs font-bold shadow-sm">
                Save ₹{offer.discountAmount.toLocaleString('en-IN')}
              </span>
              <p className="text-[10px] text-gray-500 font-medium mt-0.5">Instant Online Access</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              onClick={handleViewOffer}
              className="w-full py-3.5 px-5 rounded-2xl bg-jadmaa-red hover:bg-[#8C1E1E] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-jadmaa-red/25 transition-all duration-200 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>View Offer & Claim Deal</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleClose}
              className="w-full py-2 text-center text-xs font-semibold text-gray-400 hover:text-gray-700 transition"
            >
              No thanks, maybe later
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
