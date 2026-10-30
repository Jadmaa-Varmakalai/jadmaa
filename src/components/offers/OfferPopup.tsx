import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { offerApi } from '../../lib/api/offerApi';
import { PremiumCampaignPopup } from './PremiumCampaignPopup';
import type { CampaignOfferDetails } from './PremiumCampaignPopup';

export const OfferPopup: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [offer, setOffer] = useState<CampaignOfferDetails | null>(null);
  const [visible, setVisible] = useState(false);

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
          const offerData: CampaignOfferDetails = res.data;

          // Check if dismissed in current session
          const isDismissed = sessionStorage.getItem(`jadmaa_popup_dismissed_${offerData.id}`);
          if (isDismissed === 'true') {
            return;
          }

          setOffer(offerData);

          const delaySeconds = typeof (offerData as any).popupDelaySeconds === 'number'
            ? (offerData as any).popupDelaySeconds
            : 2;
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

  const handleClose = () => {
    if (offer && offer.id) {
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={offer.title}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs animate-fadeIn transition-opacity duration-300"
      onClick={() => handleClose()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full flex items-center justify-center animate-scaleUp"
      >
        <PremiumCampaignPopup
          offer={offer}
          onClose={handleClose}
          onPrimaryCta={handlePrimaryCta}
          onSecondaryCta={handleSecondaryCta}
        />
      </div>
    </div>
  );
};
