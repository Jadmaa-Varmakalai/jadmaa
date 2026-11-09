import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { offerApi } from '../../lib/api/offerApi';
import { Sparkles, ArrowRight, X } from 'lucide-react';

export interface BannerOfferData {
  id: string;
  title: string;
  slug: string;
  eyebrow?: string;
  headline?: string;
  shortDescription?: string;
  discountPercent?: number;
  originalPrice: number;
  offerPrice: number;
  currency: string;
  category?: string;
  expiresAt?: string;
}

export const CampaignAnnouncementBar: React.FC = () => {
  const location = useLocation();
  const [offer, setOffer] = useState<BannerOfferData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // Exclude admin, checkout, auth, and offer landing pages
  const isExcluded = () => {
    const p = location.pathname.toLowerCase();
    return (
      p.startsWith('/offers') ||
      p.startsWith('/admin') ||
      p.startsWith('/instructor') ||
      p.startsWith('/checkout') ||
      p.startsWith('/learn') ||
      p.startsWith('/login') ||
      p.startsWith('/register') ||
      p.startsWith('/forgot-password') ||
      p.startsWith('/reset-password')
    );
  };

  useEffect(() => {
    if (isExcluded()) {
      return;
    }

    let isMounted = true;
    offerApi.getActiveBannerOffer().then((res) => {
      if (!isMounted || !res.success || !res.data) return;
      const data: BannerOfferData = res.data;
      if (sessionStorage.getItem(`jadmaa_announcement_dismissed_${data.id}`) === 'true') {
        return;
      }
      setOffer(data);
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  const handleDismiss = () => {
    if (offer) {
      sessionStorage.setItem(`jadmaa_announcement_dismissed_${offer.id}`, 'true');
    }
    setDismissed(true);
  };

  if (!offer || dismissed || isExcluded()) {
    return null;
  }

  const badgeText = offer.eyebrow || 'Special Offer';
  const displayText = offer.headline || offer.title;

  return (
    <aside
      aria-label="Campaign announcement"
      className="w-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-[#3B1D04] border-b border-amber-400/90 shadow-2xs relative z-40 transition-all duration-300 text-left font-body"
    >
      <div className="max-w-[1500px] mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-3">
        {/* Left: Highlight Pill + Message */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <span className="inline-flex items-center gap-1.5 bg-amber-950/10 text-amber-950 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider shrink-0 border border-amber-950/10">
            <Sparkles className="w-3 h-3 text-amber-900 animate-pulse shrink-0" />
            <span>{badgeText}</span>
          </span>

          <p className="text-xs sm:text-sm font-bold text-[#3B1D04] truncate leading-tight">
            {displayText}
            {offer.discountPercent && offer.discountPercent > 0 && (
              <span className="ml-1.5 text-red-900 font-extrabold">
                ({offer.discountPercent}% OFF)
              </span>
            )}
          </p>
        </div>

        {/* Right: CTA Button + Dismiss Button */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to={`/offers/${offer.slug}`}
            className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1 bg-[#2B2521] hover:bg-[#8C1E1E] text-amber-200 hover:text-white rounded-full text-[11px] sm:text-xs font-bold transition-all shadow-xs hover:shadow active:scale-95 group"
          >
            <span>Claim Offer</span>
            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          </Link>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss campaign banner"
            className="p-1 rounded-full hover:bg-amber-500/30 text-amber-950/70 hover:text-amber-950 transition cursor-pointer"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
