import React, { useState, useEffect } from 'react';
import { ArrowRight, Check, Clock } from 'lucide-react';
import './PremiumCampaignLandingPage.css';

export interface CampaignLandingData {
  id: string;
  title: string;
  slug: string;
  category: string;
  eyebrow?: string;
  description: string;
  headline?: string;
  brandLogo?: string;
  heroImage: string;
  mobileHeroImage?: string;
  imagePosition?: string;
  imageTagline?: string;
  discountType?: 'percentage' | 'fixed' | 'none';
  discountValue?: number;
  originalPrice?: number;
  promotionalPrice?: number;
  startsAt?: string;
  expiresAt?: string;
  showCountdown: boolean;
  benefits?: string[];
  primaryCtaText: string;
  primaryCtaAction: string;
  primaryCtaUrl?: string;
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;
  termsAndConditions?: string;
}

export interface PremiumCampaignLandingPageProps {
  campaign: CampaignLandingData;
  onPrimaryAction: () => void;
  onSecondaryAction?: () => void;
}

function CampaignCountdown({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const target = new Date(expiresAt).getTime();
    if (isNaN(target)) return;

    const update = () => {
      setRemaining(Math.max(0, target - Date.now()));
    };

    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  const isExpired = remaining <= 0;
  const totalSeconds = Math.floor(remaining / 1000);

  const values = [
    { label: 'Days', value: Math.floor(totalSeconds / 86400) },
    { label: 'Hours', value: Math.floor((totalSeconds % 86400) / 3600) },
    { label: 'Minutes', value: Math.floor((totalSeconds % 3600) / 60) },
    { label: 'Seconds', value: totalSeconds % 60 },
  ];

  return (
    <div className="campaign-countdown">
      <div className="flex items-center justify-between mb-2">
        <p className="countdown-label flex items-center gap-1.5 m-0">
          <Clock className="w-3.5 h-3.5 text-[#A91414]" />
          {isExpired ? 'Special Offer Has Ended' : 'Offer Ends In'}
        </p>
      </div>

      <div className="countdown-grid">
        {values.map((item) => (
          <div className="countdown-item" key={item.label}>
            <strong>{isExpired ? '00' : String(item.value).padStart(2, '0')}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PremiumCampaignLandingPage({
  campaign,
  onPrimaryAction,
  onSecondaryAction,
}: PremiumCampaignLandingPageProps) {
  const showPrice = campaign.promotionalPrice != null && campaign.promotionalPrice > 0;

  const discountLabel =
    campaign.discountType === 'percentage' && campaign.discountValue != null && campaign.discountValue > 0
      ? `${campaign.discountValue}% OFF`
      : campaign.discountType === 'fixed' && campaign.discountValue != null && campaign.discountValue > 0
      ? `SAVE ₹${campaign.discountValue.toLocaleString('en-IN')}`
      : null;

  return (
    <main className="campaign-page">
      <section className="campaign-hero">
        {/* LEFT CONTENT PANEL (50%) */}
        <div className="campaign-content campaign-left">
          {/* Brand Header */}
          <header className="campaign-brand">
            <img
              src={campaign.brandLogo || '/logo.png'}
              alt="JADMAA Varmakalai"
              className="campaign-brand-logo"
              width={46}
              height={46}
            />
            <div className="campaign-brand-text">
              <strong>JADMAA VARMAKALAI</strong>
              <span>Traditional Healing For Modern Life</span>
            </div>
          </header>

          {/* Campaign Labels */}
          <div className="campaign-labels">
            <span className="campaign-category">{campaign.category}</span>
            {discountLabel && <span className="campaign-discount">{discountLabel}</span>}
          </div>

          {/* Eyebrow */}
          {campaign.eyebrow && <p className="campaign-eyebrow">{campaign.eyebrow}</p>}

          {/* Main Headline */}
          <h1 className="campaign-heading">
            {campaign.headline || campaign.title}
          </h1>

          {/* Dynamic Description */}
          <p className="campaign-description">{campaign.description}</p>

          {/* Pricing Hierarchy */}
          {showPrice && (
            <div className="campaign-prices">
              <strong>₹{campaign.promotionalPrice!.toLocaleString('en-IN')}</strong>

              {campaign.originalPrice != null && campaign.originalPrice > campaign.promotionalPrice! && (
                <del>₹{campaign.originalPrice.toLocaleString('en-IN')}</del>
              )}

              {discountLabel && (
                <span className="campaign-price-badge">{discountLabel}</span>
              )}
            </div>
          )}

          {/* Countdown Timer */}
          {campaign.showCountdown && campaign.expiresAt && (
            <CampaignCountdown expiresAt={campaign.expiresAt} />
          )}

          {/* CTA Buttons */}
          <div className="campaign-buttons">
            <button
              type="button"
              className="campaign-primary-button"
              onClick={onPrimaryAction}
            >
              <span>{campaign.primaryCtaText}</span>
              <ArrowRight className="w-5 h-5 flex-shrink-0" />
            </button>

            {campaign.secondaryCtaText && (
              <button
                type="button"
                className="campaign-secondary-button"
                onClick={onSecondaryAction}
              >
                {campaign.secondaryCtaText}
              </button>
            )}
          </div>

          {/* Optional Benefits */}
          {campaign.benefits && campaign.benefits.length > 0 && (
            <div className="campaign-benefits">
              {campaign.benefits.slice(0, 3).map((benefit, idx) => (
                <div key={idx} className="campaign-benefit-item">
                  <span className="campaign-benefit-dot" aria-hidden="true" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT IMAGE PANEL (50%) */}
        <div className="campaign-hero-media campaign-right">
          {/* Refined Diagonal Brush-Stroke Divider */}
          <div className="campaign-brush-divider" aria-hidden="true">
            <svg
              viewBox="0 0 54 1000"
              preserveAspectRatio="none"
              fill="#F8F4EB"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M0,0 L20,0 C28,120 14,240 26,360 C38,480 18,600 30,720 C42,840 22,940 34,1000 L0,1000 Z" />
            </svg>
          </div>

          <picture>
            {campaign.mobileHeroImage && (
              <source
                media="(max-width: 700px)"
                srcSet={campaign.mobileHeroImage}
              />
            )}
            <img
              src={campaign.heroImage}
              alt={campaign.title}
              className="campaign-hero-image"
              style={{
                objectPosition: campaign.imagePosition || 'center',
              }}
              loading="eager"
              decoding="async"
            />
          </picture>

          {/* Cinematic Lighting Vignette */}
          <div className="campaign-image-vignette" aria-hidden="true" />

          {/* Top-Right Italic Serif Tagline */}
          {campaign.imageTagline && (
            <div className="campaign-image-tagline">
              {campaign.imageTagline}
            </div>
          )}
        </div>
      </section>

      {/* Terms and Conditions */}
      {campaign.termsAndConditions && (
        <section className="campaign-terms">
          <div className="campaign-terms-inner">
            <strong>Terms &amp; Conditions: </strong>
            <span>{campaign.termsAndConditions}</span>
          </div>
        </section>
      )}
    </main>
  );
}

