import React, { useState } from 'react';
import { X, Check, ArrowRight, Percent, Send } from 'lucide-react';

export interface CampaignClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  couponCode?: string;
  discountText?: string;
  headline?: string;
  ctaText?: string;
  onProceedToCheckout?: () => void;
  isEnquiryOnly?: boolean;
  onSubmitEnquiry?: (data: { name: string; phone: string; email: string; branchLocation: string; notes?: string }) => Promise<void>;
  defaultBranch?: string;
}

export const CampaignClaimModal: React.FC<CampaignClaimModalProps> = ({
  isOpen,
  onClose,
  discountText,
  headline = 'Claim Your Special Mastery Offer',
  ctaText = 'Proceed to Checkout',
  onProceedToCheckout,
  isEnquiryOnly = false,
  onSubmitEnquiry,
  defaultBranch = 'Thanjavur',
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [branch, setBranch] = useState(defaultBranch);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSubmitEnquiry) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await onSubmitEnquiry({
        name,
        phone,
        email,
        branchLocation: branch,
      });
      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in text-left">
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card / Bottom Sheet on Mobile */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full sm:max-w-md bg-gradient-to-b from-[#241C18] via-[#1B1411] to-[#120E0C] text-white rounded-t-3xl sm:rounded-3xl border border-amber-500/35 p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_35px_rgba(224,122,31,0.25)] max-h-[90dvh] overflow-y-auto"
      >
        {/* Close Button (min 44x44px target) */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-[#C9BDB5] hover:text-white transition cursor-pointer"
          aria-label="Close Claim Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header - Clean text only, no pill, no star */}
        <div className="space-y-1.5 pr-8">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block">
            Special Promotional Offer
          </span>

          <h3 className="font-heading font-black text-xl sm:text-2xl text-white leading-tight">
            {headline}
          </h3>
          <p className="text-xs text-[#C9BDB5]">
            Instant enrollment with verified promotional pricing. No coupon code required.
          </p>
        </div>

        {/* Offer Discount Highlight (No Coupon Code Needed) */}
        {discountText && (
          <div className="mt-5 p-4 rounded-2xl bg-[#120E0C] border border-amber-500/30 flex items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Percent className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] text-amber-200/60 uppercase tracking-widest font-semibold">
                  Promotional Offer
                </span>
                <span className="font-mono font-black text-amber-300 text-lg sm:text-xl tracking-wider truncate block">
                  {discountText}
                </span>
              </div>
            </div>
            <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
              Direct Pricing
            </span>
          </div>
        )}

        {/* Modal Body: Direct Checkout or Enquiry Form */}
        {isEnquiryOnly ? (
          success ? (
            <div className="mt-6 text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="font-heading font-bold text-lg text-white">Registration Received!</h4>
              <p className="text-xs text-[#C9BDB5] max-w-xs mx-auto">
                Our master instructor team will contact you shortly to confirm your booking and apply your discount.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-6 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold mt-2"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleEnquirySubmit} className="mt-5 space-y-3">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-900/40 border border-red-500/50 text-red-200 text-xs">
                  {errorMsg}
                </div>
              )}
              <div>
                <label className="block text-[11px] font-bold text-[#C9BDB5] uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#14100E] border border-[#3E322B] text-white text-[16px] sm:text-xs focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#C9BDB5] uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#14100E] border border-[#3E322B] text-white text-[16px] sm:text-xs focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#C9BDB5] uppercase tracking-wider mb-1">
                  WhatsApp / Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#14100E] border border-[#3E322B] text-white text-[16px] sm:text-xs focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#C9BDB5] uppercase tracking-wider mb-1">
                  Preferred Academy Branch *
                </label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#14100E] border border-[#3E322B] text-white text-[16px] sm:text-xs focus:border-amber-500 outline-none"
                >
                  <option value="Thanjavur">Thanjavur Main Branch</option>
                  <option value="Kumbakonam">Kumbakonam Branch</option>
                  <option value="Ariyalur">Ariyalur Branch</option>
                  <option value="Online">Online Gurukulam Session</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full min-h-[48px] mt-2 rounded-xl bg-gradient-to-r from-[#D96B14] via-[#E88220] to-[#F59E0B] text-black font-extrabold text-sm tracking-wide shadow-lg hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {submitting ? (
                  <span>Registering...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit &amp; Reserve Discount</span>
                  </>
                )}
              </button>
            </form>
          )
        ) : (
          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                onProceedToCheckout?.();
              }}
              className="w-full min-h-[48px] rounded-xl bg-gradient-to-r from-[#D96B14] via-[#E88220] to-[#F59E0B] hover:brightness-110 active:scale-95 text-black font-extrabold text-sm tracking-wide shadow-[0_10px_25px_-5px_rgba(224,122,31,0.5)] transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{ctaText}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-[44px] rounded-xl bg-white/5 hover:bg-white/10 text-[#C9BDB5] text-xs font-semibold transition"
            >
              Continue Browsing
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

