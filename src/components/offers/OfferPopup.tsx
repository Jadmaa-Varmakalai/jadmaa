import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { offerApi } from '../../lib/api/offerApi';
import { X, Sparkles, Clock, ArrowRight } from 'lucide-react';

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
  popupDelaySeconds: number;
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
  const [dismissed, setDismissed] = useState(false);

  // Time left for popup countdown
  const [countdownText, setCountdownText] = useState<string | null>(null);

  // Determine if popup should be suppressed based on route
  const isSuppressedRoute = () => {
    const p = location.pathname.toLowerCase();
    return (
      p.startsWith('/offers') ||
      p.startsWith('/admin') ||
      p.startsWith('/instructor') ||
      p.startsWith('/checkout') ||
      p.startsWith('/login') ||
      p.startsWith('/register') ||
      p.startsWith('/learn') ||
      p.startsWith('/payment')
    );
  };

  useEffect(() => {
    if (isSuppressedRoute()) {
      setVisible(false);
      return;
    }

    let delayTimer: any = null;

    const fetchPopupOffer = async () => {
      try {
        const res = await offerApi.getActivePopupOffer();
        if (res.success && res.data) {
          const offerData: PopupOfferData = res.data;

          // Check sessionStorage to respect visitor's dismissal in current browsing session
          const sessionDismissed = sessionStorage.getItem(`jadmaa_popup_dismissed_${offerData.id}`);
          if (sessionDismissed) {
            return;
          }

          setOffer(offerData);

          // Configure delay trigger
          const delayMs = (offerData.popupDelaySeconds || 4) * 1000;
          delayTimer = setTimeout(() => {
            // Re-verify route in case user navigated during delay
            if (!isSuppressedRoute()) {
              setVisible(true);
            }
          }, delayMs);
        }
      } catch (err) {
        // Silent catch: popup is non-critical
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

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    if (offer) {
      sessionStorage.setItem(`jadmaa_popup_dismissed_${offer.id}`, 'true');
    }
  };

  const handleNavigateToOffer = () => {
    if (offer) {
      setVisible(false);
      navigate(`/offers/${offer.slug}`);
    }
  };

  if (!visible || !offer || isSuppressedRoute() || dismissed) {
    return null;
  }

  return (
    <aside
      role="region"
      aria-label="Promotional Announcement"
      className="fixed bottom-4 right-4 z-50 max-w-sm w-[calc(100vw-2rem)] sm:w-96 animate-slideUp"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-200/80 p-4 sm:p-5 relative overflow-hidden backdrop-blur-md">
        
        {/* Top promo highlight bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-jadmaa-red via-jadmaa-gold to-jadmaa-red" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition z-10"
          title="Dismiss Offer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5 pt-1">
          {/* Thumbnail */}
          <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden shrink-0 border border-gray-100 shadow-inner relative">
            {offer.bannerImageUrl ? (
              <img
                src={offer.bannerImageUrl}
                alt={offer.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-jadmaa-cream text-jadmaa-red font-bold text-xs">
                OFFER
              </div>
            )}
            <span className="absolute top-0 right-0 bg-jadmaa-red text-white text-[9px] font-extrabold px-1 rounded-bl">
              {offer.discountPercent}%
            </span>
          </div>

          {/* Details */}
          <div className="space-y-1 min-w-0 flex-1 pr-4">
            <div className="flex items-center gap-1 text-[11px] font-bold text-jadmaa-red uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-jadmaa-gold" />
              <span>Limited Offer</span>
            </div>

            <h4 className="text-sm font-bold text-jadmaa-charcoal leading-tight truncate">
              {offer.title}
            </h4>

            {offer.shortDescription && (
              <p className="text-[11px] text-gray-500 line-clamp-1">
                {offer.shortDescription}
              </p>
            )}

            {/* Price Row */}
            <div className="flex items-baseline gap-2 pt-0.5">
              <span className="text-base font-extrabold font-heading text-jadmaa-charcoal">
                ₹{offer.offerPrice.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-gray-400 line-through">
                ₹{offer.originalPrice.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] font-bold text-green-700 bg-green-50 px-1.5 py-0.2 rounded">
                Save ₹{offer.discountAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Actions Row */}
        <div className="mt-3.5 pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
          {countdownText ? (
            <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-jadmaa-red bg-jadmaa-red/5 px-2.5 py-1 rounded-lg">
              <Clock className="w-3 h-3 animate-pulse" />
              <span>{countdownText}</span>
            </div>
          ) : (
            <span className="text-[11px] text-gray-400 font-medium">Special Pricing</span>
          )}

          <button
            onClick={handleNavigateToOffer}
            className="px-4 py-2 rounded-xl bg-jadmaa-red hover:bg-jadmaa-red/90 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-jadmaa-red/20 transition cursor-pointer"
          >
            <span>View Offer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </aside>
  );
};
