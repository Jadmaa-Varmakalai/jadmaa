import React, { useState, useEffect } from 'react';
import { Clock, ArrowRight, Percent, Flame } from 'lucide-react';

export interface CampaignHeroData {
  id?: string;
  category?: string;
  badgeText?: string;
  discountPercentage?: number | string;
  discountText?: string;
  headline?: string;
  subheadline?: string;
  couponCode?: string;
  expiryDate?: string;
  validTill?: string;
  ctaText?: string;
  targetCourseId?: string;
  targetUrl?: string;
  originalPrice?: number;
  promotionalPrice?: number;
  heroImage?: string;
  imageFit?: 'cover' | 'contain' | 'fill' | string;
  imagePosition?: string;
  themePreset?: 'dark-luxury' | 'classic-cream';
}

export interface CampaignHeroSectionProps {
  campaign: CampaignHeroData;
  onClaim: () => void;
  onBrowseMore?: () => void;
}

export const CampaignHeroSection: React.FC<CampaignHeroSectionProps> = ({
  campaign,
  onClaim,
  onBrowseMore,
}) => {
  // Safe Fallback Resolution
  const isTreatment = campaign.category === 'VARMA_TREATMENT';
  const badgeText = campaign.badgeText || (isTreatment ? 'SPECIAL TREATMENT OFFER' : 'LIMITED TIME OFFER');
  const headline = campaign.headline || (isTreatment ? 'Authentic Varma Treatment' : 'Exclusive Mastery Offer');
  const subheadline =
    campaign.subheadline ||
    (isTreatment
      ? 'Experience traditional healing, chronic pain relief, and natural recovery through authentic Siddha-Varma therapeutic vital points.'
      : 'Unlock authentic lineage secrets with direct guidance, lifetime access, and verified traditional certification.');
  const ctaText = campaign.ctaText || (isTreatment ? 'Book Treatment Session' : 'Claim Offer Now');
  const heroImage =
    campaign.heroImage ||
    '/images/optimized/pose-dab-red-transparent.webp';

  const calculatedDiscount = (() => {
    if (campaign.discountPercentage !== undefined && campaign.discountPercentage !== null && Number(campaign.discountPercentage) > 0) {
      return Number(campaign.discountPercentage);
    }
    if (
      campaign.originalPrice &&
      campaign.promotionalPrice &&
      campaign.originalPrice > campaign.promotionalPrice
    ) {
      return Math.round(
        ((campaign.originalPrice - campaign.promotionalPrice) / campaign.originalPrice) * 100
      );
    }
    return 0;
  })();

  const discountLabel = (() => {
    if (campaign.discountText && campaign.discountText.trim()) return campaign.discountText.trim();
    if (calculatedDiscount > 0) return `${calculatedDiscount}% OFF`;
    return null;
  })();

  const expiryString = campaign.expiryDate || campaign.validTill;

  // Countdown timer calculations
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    if (!expiryString) {
      // Default to 48 hours countdown if no expiry provided
      const defaultTarget = Date.now() + 48 * 60 * 60 * 1000;
      const tick = () => {
        const diff = Math.max(0, defaultTarget - Date.now());
        const totalSecs = Math.floor(diff / 1000);
        setTimeLeft({
          days: Math.floor(totalSecs / 86400),
          hours: Math.floor((totalSecs % 86400) / 3600),
          minutes: Math.floor((totalSecs % 3600) / 60),
          seconds: totalSecs % 60,
          isExpired: totalSecs <= 0,
        });
      };
      tick();
      const interval = setInterval(tick, 1000);
      return () => clearInterval(interval);
    }

    const target = new Date(expiryString).getTime();
    if (isNaN(target)) return;

    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      const totalSecs = Math.floor(diff / 1000);
      setTimeLeft({
        days: Math.floor(totalSecs / 86400),
        hours: Math.floor((totalSecs % 86400) / 3600),
        minutes: Math.floor((totalSecs % 3600) / 60),
        seconds: totalSecs % 60,
        isExpired: totalSecs <= 0,
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiryString]);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#1C1614] via-[#14100E] to-[#0D0A09] text-white py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-12 select-none">
      {/* Warm ambient background flares */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#E07A1F]/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-[420px] h-[420px] bg-[#F59E0B]/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* ============================================================ */}
          {/* LEFT: 3D ANGLE COUPON TICKET / CONTAINER                     */}
          {/* ============================================================ */}
          <div className="lg:col-span-6 flex justify-center order-2 lg:order-1">
            <div className="relative w-full max-w-[480px]">
              
              {/* Top Eyebrow on Ticket Canvas - Clean text */}
              <div className="mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                  {badgeText}
                </span>
              </div>

              {/* 3D Angled Ticket Canvas */}
              <div
                style={{
                  transform: 'perspective(1000px) rotateX(4deg) rotateY(-6deg)',
                  transformStyle: 'preserve-3d',
                }}
                className="relative bg-gradient-to-br from-[#29201C] via-[#1E1714] to-[#15100E] rounded-3xl border border-amber-500/30 p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_35px_rgba(224,122,31,0.2)] transition-transform duration-500 hover:rotate-0"
              >
                {/* Gold Sheen Gradient Edge */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-amber-500/10 via-transparent to-amber-300/15 pointer-events-none" />

                {/* Hero Artwork Box */}
                <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#110D0B] border border-amber-500/20 relative flex items-center justify-center group">
                  {campaign.imageFit === 'contain' && (
                    <div
                      className="absolute inset-0 bg-cover bg-center filter blur-xl opacity-35 scale-110 pointer-events-none"
                      style={{ backgroundImage: `url(${heroImage})` }}
                    />
                  )}
                  <img
                    src={heroImage}
                    alt={headline}
                    style={{
                      objectFit: (campaign.imageFit as any) || 'cover',
                      objectPosition: campaign.imagePosition || 'center',
                    }}
                    className={`w-full h-full relative z-5 transition-transform duration-700 ${campaign.imageFit === 'contain' ? 'p-2 object-contain' : 'group-hover:scale-105'}`}
                  />
                  
                  {/* Subtle inner shadow overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#15100E] via-transparent to-black/20 pointer-events-none" />
                  
                  {/* Glowing Voucher Cutout Tag - only show if valid discount */}
                  {discountLabel && (
                    <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-10 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D96B14] to-[#F59E0B] text-black font-black text-sm sm:text-base shadow-xl">
                      <Flame className="w-4 h-4 fill-black" />
                      <span>{discountLabel}</span>
                    </div>
                  )}
                </div>

                {/* Ticket Perforation Dashed Line */}
                <div className="my-5 relative flex items-center justify-between">
                  {/* Left Ticket Notch */}
                  <div className="absolute -left-9 w-6 h-6 rounded-full bg-[#14100E] border-r border-amber-500/30" />
                  <div className="w-full border-t-2 border-dashed border-amber-500/25 mx-2" />
                  {/* Right Ticket Notch */}
                  <div className="absolute -right-9 w-6 h-6 rounded-full bg-[#14100E] border-l border-amber-500/30" />
                </div>

                {/* Lower Voucher Information Footer - Offer Percentage & Savings */}
                <div className="flex items-center justify-between gap-3 text-xs">
                  {calculatedDiscount > 0 ? (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                          <Percent className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="block text-[10px] text-amber-200/60 uppercase tracking-widest font-semibold">
                            Offer Discount
                          </span>
                          <span className="font-mono font-bold text-amber-300 text-sm tracking-wider">
                            {calculatedDiscount}% OFF
                          </span>
                        </div>
                      </div>

                      {campaign.originalPrice && campaign.promotionalPrice && campaign.originalPrice > campaign.promotionalPrice && (
                        <div className="text-right">
                          <span className="block text-[10px] text-emerald-400/80 uppercase tracking-widest font-semibold">
                            Total Savings
                          </span>
                          <span className="font-mono font-bold text-emerald-400 text-sm">
                            Save ₹{(campaign.originalPrice - campaign.promotionalPrice).toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2 py-1">
                      <span className="text-xs text-amber-300 font-semibold tracking-wide">
                        {isTreatment ? 'Special Promotional Session' : 'Special Promotional Enrolment'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* RIGHT: CONVERSION HEADLINE, COUNTDOWN & CTA                  */}
          {/* ============================================================ */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-7 order-1 lg:order-2 text-left">
            
            {/* Top Eyebrow - Clean Text Only (No Pill, No Star Icon) */}
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 block">
              {badgeText}
            </span>

            {/* Campaign Headline in Editorial Serif Typography */}
            <h1 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight">
              {headline}
            </h1>

            {/* Subheadline in Poppins / Modern Sans */}
            <p className="text-sm sm:text-base text-[#D4C7BF] font-normal leading-relaxed max-w-xl">
              {subheadline}
            </p>

            {/* Live Countdown Timer in Luxury Gold-Trimmed Boxes */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#221B18]/70 border border-[#3E322B]/70 backdrop-blur-md max-w-lg">
              <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-amber-400/90">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Special Promotional Pricing Ends In:</span>
              </div>

              <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center font-mono">
                {[
                  { label: 'DAYS', val: timeLeft.days },
                  { label: 'HOURS', val: timeLeft.hours },
                  { label: 'MINS', val: timeLeft.minutes },
                  { label: 'SECS', val: timeLeft.seconds },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2 sm:p-3 rounded-xl bg-[#14100E] border border-amber-500/30 flex flex-col items-center justify-center shadow-inner"
                  >
                    <span className="text-xl sm:text-3xl font-black text-amber-300">
                      {String(item.val).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-sans font-bold tracking-wider text-[#A6958B] mt-0.5">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Hierarchy Display */}
            {(campaign.originalPrice || campaign.promotionalPrice) && (
              <div className="flex items-baseline gap-3.5 pt-1">
                {campaign.promotionalPrice !== undefined && (
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm text-amber-400 font-bold">₹</span>
                    <span className="text-3xl sm:text-4xl font-black text-amber-300 drop-shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                      {campaign.promotionalPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
                {campaign.originalPrice !== undefined && campaign.promotionalPrice !== undefined && campaign.originalPrice > campaign.promotionalPrice && (
                  <span className="text-base sm:text-lg line-through text-[#8C7D73] font-medium">
                    ₹{campaign.originalPrice.toLocaleString('en-IN')}
                  </span>
                )}
                {discountLabel && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-black">
                    {discountLabel}
                  </span>
                )}
              </div>
            )}

            {/* Primary Action Button (min 44px ergonomics) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <button
                type="button"
                onClick={onClaim}
                className="min-h-[48px] px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#D96B14] via-[#E88220] to-[#F59E0B] hover:brightness-110 active:scale-95 text-black font-extrabold text-sm sm:text-base tracking-wide shadow-[0_10px_25px_-5px_rgba(224,122,31,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{ctaText}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {onBrowseMore && (
                <button
                  type="button"
                  onClick={onBrowseMore}
                  className="min-h-[48px] px-6 py-3 rounded-xl border border-[#3E322B] hover:border-amber-500/40 bg-white/5 hover:bg-white/10 text-[#D4C7BF] text-xs sm:text-sm font-semibold transition flex items-center justify-center cursor-pointer"
                >
                  View Details
                </button>
              )}
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

