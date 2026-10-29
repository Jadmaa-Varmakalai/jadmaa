import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { SEO } from '../../components/common/SEO';
import { offerApi } from '../../lib/api/offerApi';
import type { PublicOfferDetails } from '../../lib/api/offerApi';
import { loadRazorpayScript } from '../../lib/razorpay';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles, Clock, CheckCircle, ShieldCheck, Award, BookOpen,
  ArrowRight, Phone, Mail, AlertTriangle, Users, Play, ChevronDown,
  ChevronUp, Lock, Check, Share2, Copy
} from 'lucide-react';

export const OfferLandingPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();

  const [offer, setOffer] = useState<PublicOfferDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<'IDLE' | 'PROCESSING' | 'VERIFYING' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [copied, setCopied] = useState(false);
  const [openModuleIndex, setOpenModuleIndex] = useState<number | null>(0);

  // Live countdown state
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  } | null>(null);

  // Fetch offer details
  useEffect(() => {
    if (!slug) return;
    const fetchOffer = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await offerApi.getOfferBySlug(slug);
        if (res.success && res.data) {
          setOffer(res.data);
        } else {
          setError(res.error?.message || 'This offer is currently unavailable or has expired.');
        }
      } catch (err: any) {
        setError(err.message || 'This offer is currently unavailable or has expired.');
      } finally {
        setLoading(false);
      }
    };
    fetchOffer();
  }, [slug]);

  // Real-time countdown timer loop
  useEffect(() => {
    if (!offer || !offer.countdownEnabled || !offer.expiresAt) {
      setTimeLeft(null);
      return;
    }

    const calculateTime = () => {
      const now = new Date().getTime();
      const expiry = new Date(offer.expiresAt!).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [offer]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Payment Handler
  const handleBookNow = async () => {
    if (!offer || !offer.isBookable || (timeLeft && timeLeft.isExpired)) {
      alert('This offer has ended or is unavailable for bookings.');
      return;
    }

    // Auth gate: redirect with return URL
    if (!isLoggedIn) {
      const returnUrl = encodeURIComponent(`/offers/${slug}`);
      navigate(`/login?redirect=${returnUrl}`);
      return;
    }

    try {
      setPaymentStep('PROCESSING');

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setPaymentStep('FAILED');
        alert('Could not initialize payment gateway. Please check your connection and retry.');
        return;
      }

      // 1. Initiate booking on server (authoritative offer price from DB)
      const res = await offerApi.initiateOfferBooking(offer.slug);
      if (!res.success || !res.data) {
        setPaymentStep('FAILED');
        alert(res.error?.message || 'Failed to initiate booking order.');
        return;
      }

      const { keyId, orderId, amount, currency, prefill } = res.data;

      // 2. Open Razorpay Checkout Modal
      const options = {
        key: keyId,
        amount,
        currency: currency || 'INR',
        name: 'JADMAA Varmakalai',
        description: offer.title,
        ...(typeof window !== 'undefined' && window.location.protocol === 'https:'
          ? { image: `${window.location.origin}/logo.png` }
          : {}),
        order_id: orderId,
        prefill: {
          name: prefill?.name || user?.name || '',
          email: prefill?.email || user?.email || '',
          contact: (prefill?.contact || '').replace(/[^0-9+]/g, '')
        },
        theme: {
          color: '#B12B2B',
          backdrop_color: 'rgba(0, 0, 0, 0.7)'
        },
        modal: {
          backdropclose: false,
          escape: true,
          ondismiss: () => {
            setPaymentStep('IDLE');
          }
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            setPaymentStep('VERIFYING');
            const verifyRes = await offerApi.verifyOfferPayment(offer.slug, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verifyRes.success) {
              setPaymentStep('SUCCESS');
              navigate(`/payment/status/${response.razorpay_order_id}?status=success`);
            } else {
              setPaymentStep('FAILED');
              alert(verifyRes.error?.message || 'Payment verification failed.');
              navigate(`/payment/status/${response.razorpay_order_id}?status=failed`);
            }
          } catch (err: any) {
            console.error('Verification error:', err);
            setPaymentStep('FAILED');
            navigate(`/payment/status/${response.razorpay_order_id}?status=failed`);
          }
        }
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.on('payment.failed', (resp: any) => {
        console.warn('Payment failed:', resp.error);
        setPaymentStep('FAILED');
        alert(`Payment declined: ${resp.error?.description || 'Transaction was not completed'}`);
      });
      razorpayInstance.open();

    } catch (err: any) {
      console.error('Booking error:', err);
      setPaymentStep('FAILED');
      alert(err.message || 'An error occurred while booking this offer.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-jadmaa-red border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-jadmaa-charcoal">Loading special offer...</p>
        </div>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4 text-center">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-lg border border-gray-100 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold font-heading text-jadmaa-charcoal">
            Offer Unavailable
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            {error || 'This promotional offer is either expired, scheduled for a future date, or currently inactive.'}
          </p>
          <div className="pt-2">
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-jadmaa-red hover:bg-jadmaa-red/90 text-white font-bold text-sm shadow-md transition"
            >
              <BookOpen className="w-4 h-4" />
              <span>Explore All Courses</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isExpired = timeLeft ? timeLeft.isExpired : !offer.isBookable;

  return (
    <>
      <SEO
        title={`${offer.title} | JADMAA Varmakalai`}
        description={offer.shortDescription || offer.description}
        image={offer.bannerImageUrl || offer.course.thumbnailUrl}
        url={`/offers/${offer.slug}`}
      />

      <div className="min-h-screen bg-[#FDFBF7] text-jadmaa-charcoal pb-24 lg:pb-12 text-left">
        
        {/* Top Promotional Announcement Ribbon */}
        <div className="bg-gradient-to-r from-jadmaa-red via-[#8C1E1E] to-jadmaa-red text-white py-2.5 px-4 text-center text-xs sm:text-sm font-semibold shadow-inner flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-jadmaa-gold animate-spin" />
          <span>Limited-Time Promotional Campaign • Verified Certification Included</span>
        </div>

        {/* Hero Section */}
        <section className="pt-8 pb-12 sm:pt-12 sm:pb-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Offer Pitch & Details */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-jadmaa-red/10 text-jadmaa-red text-xs font-bold border border-jadmaa-red/20 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Instagram Special Promo</span>
                <span className="w-1.5 h-1.5 rounded-full bg-jadmaa-red" />
                <span>{offer.discountPercent}% OFF</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-heading text-jadmaa-charcoal leading-tight tracking-tight">
                {offer.title}
              </h1>

              {offer.shortDescription && (
                <p className="text-base sm:text-lg text-gray-600 leading-relaxed font-sans">
                  {offer.shortDescription}
                </p>
              )}

              {/* Countdown Timer Block (If Enabled) */}
              {offer.countdownEnabled && timeLeft && !timeLeft.isExpired && (
                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-jadmaa-red/20 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-jadmaa-red flex items-center gap-1.5">
                      <Clock className="w-4 h-4 animate-pulse" />
                      Offer Ends In:
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium">Asia/Kolkata</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center pt-1">
                    <div className="bg-jadmaa-cream/70 p-2.5 rounded-xl border border-jadmaa-red/10">
                      <span className="text-2xl sm:text-3xl font-extrabold font-mono text-jadmaa-charcoal block">
                        {String(timeLeft.days).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] font-bold text-gray-500 uppercase">Days</span>
                    </div>

                    <div className="bg-jadmaa-cream/70 p-2.5 rounded-xl border border-jadmaa-red/10">
                      <span className="text-2xl sm:text-3xl font-extrabold font-mono text-jadmaa-charcoal block">
                        {String(timeLeft.hours).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] font-bold text-gray-500 uppercase">Hours</span>
                    </div>

                    <div className="bg-jadmaa-cream/70 p-2.5 rounded-xl border border-jadmaa-red/10">
                      <span className="text-2xl sm:text-3xl font-extrabold font-mono text-jadmaa-charcoal block">
                        {String(timeLeft.minutes).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] font-bold text-gray-500 uppercase">Mins</span>
                    </div>

                    <div className="bg-jadmaa-cream/70 p-2.5 rounded-xl border border-jadmaa-red/10">
                      <span className="text-2xl sm:text-3xl font-extrabold font-mono text-jadmaa-red block">
                        {String(timeLeft.seconds).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] font-bold text-gray-500 uppercase">Secs</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Expired Alert Banner */}
              {isExpired && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
                  <div>
                    <strong className="block font-bold">This promotion has closed.</strong>
                    New bookings are no longer accepted at this promotional rate.
                  </div>
                </div>
              )}

              {/* Key Trust Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs font-semibold text-gray-700">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-white border border-gray-100 shadow-sm">
                  <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
                  <span>Razorpay Secure</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-white border border-gray-100 shadow-sm">
                  <Award className="w-4 h-4 text-jadmaa-red shrink-0" />
                  <span>Verified Certificate</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-white border border-gray-100 shadow-sm col-span-2 sm:col-span-1">
                  <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Lifetime Access</span>
                </div>
              </div>

            </div>

            {/* Right Column: Checkout Pricing Card */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100 relative overflow-hidden space-y-6">
                
                {/* Promo Corner Ribbon */}
                <div className="absolute -top-1 -right-1 bg-jadmaa-red text-white text-[11px] font-extrabold uppercase px-4 py-1 rounded-bl-2xl shadow-sm">
                  Save {offer.discountPercent}%
                </div>

                {/* Banner Thumbnail */}
                <div className="rounded-2xl overflow-hidden aspect-video bg-gray-100 border border-gray-100 relative shadow-inner">
                  <img
                    src={offer.bannerImageUrl || offer.course.thumbnailUrl}
                    alt={offer.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end p-4">
                    <span className="text-white text-xs font-bold drop-shadow">
                      {offer.course.totalLessons} Lessons • Full HD Video Material
                    </span>
                  </div>
                </div>

                {/* Pricing Display */}
                <div className="space-y-1">
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl sm:text-5xl font-black font-heading text-jadmaa-charcoal">
                      ₹{offer.offerPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-gray-400 line-through">
                      ₹{offer.originalPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-green-700">
                    You save ₹{offer.discountAmount.toLocaleString('en-IN')} ({offer.discountPercent}% discount)
                  </p>
                </div>

                {/* Booking Seats Remaining */}
                {offer.bookingLimit && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-500">Reserved Seats:</span>
                      <span className="text-jadmaa-red font-bold">
                        {offer.currentBookings} / {offer.bookingLimit} booked
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-jadmaa-red h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.round((offer.currentBookings / offer.bookingLimit) * 100))}%`
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Action CTA */}
                <div className="space-y-3 pt-2">
                  <button
                    onClick={handleBookNow}
                    disabled={isExpired || paymentStep === 'PROCESSING' || paymentStep === 'VERIFYING'}
                    className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-all ${
                      isExpired
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                        : 'bg-jadmaa-red hover:bg-jadmaa-red/90 text-white shadow-jadmaa-red/30 hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                    <span>
                      {paymentStep === 'PROCESSING'
                        ? 'Preparing Checkout...'
                        : paymentStep === 'VERIFYING'
                        ? 'Verifying Payment...'
                        : isExpired
                        ? 'Offer Expired'
                        : `Book Now for ₹${offer.offerPrice.toLocaleString('en-IN')}`}
                    </span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>

                  <p className="text-[11px] text-center text-gray-400">
                    Instant access unlocked immediately upon verified payment.
                  </p>
                </div>

                {/* Share Link Button */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span>Share this promotion:</span>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 text-jadmaa-red font-bold hover:underline"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Link Copied!' : 'Copy Campaign Link'}</span>
                  </button>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* Course Overview & Curriculum */}
        <section className="py-12 bg-white border-y border-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
            
            <div className="text-center space-y-2">
              <span className="text-xs font-bold text-jadmaa-red uppercase tracking-wider">
                Included in This Campaign
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-jadmaa-charcoal">
                What You'll Learn & Master
              </h2>
            </div>

            {offer.description && (
              <div className="p-6 rounded-2xl bg-jadmaa-cream/60 border border-jadmaa-border/30 text-sm leading-relaxed whitespace-pre-line text-gray-700">
                {offer.description}
              </div>
            )}

            {/* Curriculum Accordion */}
            {offer.course.modules && offer.course.modules.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-base font-bold text-gray-900 mb-2">
                  Complete Course Curriculum ({offer.course.totalLessons} Lessons)
                </h3>

                <div className="space-y-3">
                  {offer.course.modules.map((m, idx) => {
                    const isOpen = openModuleIndex === idx;
                    return (
                      <div
                        key={m.id}
                        className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm transition"
                      >
                        <button
                          onClick={() => setOpenModuleIndex(isOpen ? null : idx)}
                          className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50/80 transition"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-lg bg-jadmaa-cream text-jadmaa-red font-bold text-xs flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <div>
                              <h4 className="text-sm font-bold text-gray-900">{m.title}</h4>
                              <p className="text-[11px] text-gray-500">{m.lessonCount} Lessons</p>
                            </div>
                          </div>
                          {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </button>

                        {isOpen && (
                          <div className="p-4 pt-1 border-t border-gray-100 bg-gray-50/50 space-y-2">
                            {m.lessons.map((l, lIdx) => (
                              <div
                                key={l.id}
                                className="flex items-center justify-between py-2 px-3 rounded-xl bg-white border border-gray-100 text-xs"
                              >
                                <div className="flex items-center gap-2">
                                  <Play className="w-3.5 h-3.5 text-jadmaa-red" />
                                  <span className="font-medium text-gray-800">{l.title}</span>
                                </div>
                                <span className="text-[11px] text-gray-400 font-mono">{l.duration}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Instructor Bio */}
            {offer.course.instructor && (
              <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-jadmaa-cream shrink-0 border border-gray-200">
                  {offer.course.instructor.avatarUrl ? (
                    <img
                      src={offer.course.instructor.avatarUrl}
                      alt={offer.course.instructor.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-jadmaa-red text-lg">
                      {offer.course.instructor.displayName.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="text-center sm:text-left space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-jadmaa-red">Lead Instructor</p>
                  <h3 className="text-lg font-bold text-gray-900">{offer.course.instructor.displayName}</h3>
                  {offer.course.instructor.title && (
                    <p className="text-xs text-gray-500">{offer.course.instructor.title}</p>
                  )}
                  {offer.course.instructor.bio && (
                    <p className="text-xs text-gray-600 pt-1 leading-relaxed">{offer.course.instructor.bio}</p>
                  )}
                </div>
              </div>
            )}

            {/* Terms and Support */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs">
              {offer.termsAndConditions && (
                <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                  <h4 className="font-bold text-gray-900">Terms & Conditions</h4>
                  <p className="text-gray-600 whitespace-pre-line leading-relaxed">{offer.termsAndConditions}</p>
                </div>
              )}

              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                <h4 className="font-bold text-gray-900">Need Help or Consultation?</h4>
                <p className="text-gray-600 leading-relaxed">
                  Have questions before booking? Contact our administration team directly:
                </p>
                <div className="space-y-1 pt-1 font-semibold text-jadmaa-charcoal">
                  <a href={`tel:${offer.supportPhone}`} className="flex items-center gap-2 hover:text-jadmaa-red transition">
                    <Phone className="w-3.5 h-3.5 text-jadmaa-red" />
                    <span>{offer.supportPhone}</span>
                  </a>
                  <a href={`mailto:${offer.supportEmail}`} className="flex items-center gap-2 hover:text-jadmaa-red transition">
                    <Mail className="w-3.5 h-3.5 text-jadmaa-red" />
                    <span>{offer.supportEmail}</span>
                  </a>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Mobile Sticky Book Now Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 px-4 flex items-center justify-between shadow-2xl">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-heading text-jadmaa-red">
                ₹{offer.offerPrice.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-gray-400 line-through">
                ₹{offer.originalPrice.toLocaleString('en-IN')}
              </span>
            </div>
            <span className="text-[10px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
              Save {offer.discountPercent}%
            </span>
          </div>

          <button
            onClick={handleBookNow}
            disabled={isExpired || paymentStep === 'PROCESSING' || paymentStep === 'VERIFYING'}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition ${
              isExpired
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-jadmaa-red hover:bg-jadmaa-red/90 text-white shadow-jadmaa-red/20'
            }`}
          >
            <span>{isExpired ? 'Offer Closed' : 'Book Now'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </>
  );
};
