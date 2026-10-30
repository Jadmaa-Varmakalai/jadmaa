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
  ChevronUp, Lock, Check, Share2, Copy, Flame, Compass, HeartPulse
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
          setError(res.error?.message || 'This course offer is currently unavailable or has expired.');
        }
      } catch (err: any) {
        setError(err.message || 'This course offer is currently unavailable or has expired.');
      } finally {
        setLoading(false);
      }
    };
    fetchOffer();
  }, [slug]);

  // Real-time countdown timer
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

  // Payment Handler (Secure Razorpay Flow)
  const handleBookNow = async () => {
    if (!offer || !offer.isBookable || (timeLeft && timeLeft.isExpired)) {
      alert('This offer has ended or is unavailable for bookings.');
      return;
    }

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
          color: '#991B1B',
          backdrop_color: 'rgba(0, 0, 0, 0.85)'
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
      <div className="min-h-screen bg-[#0F0F12] text-white flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-3 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-gray-300">Loading campaign details...</p>
        </div>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="min-h-screen bg-[#0F0F12] text-white flex items-center justify-center p-4 text-center">
        <div className="max-w-md w-full bg-[#18181C] p-8 rounded-2xl border border-red-900/30 space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-xl bg-red-950/60 text-red-400 flex items-center justify-center mx-auto border border-red-800/40">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold font-heading text-white">
            Campaign Unavailable
          </h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            {error || 'This promotional offer has expired or is currently not active.'}
          </p>
          <div className="pt-2">
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-lg transition"
            >
              <BookOpen className="w-4 h-4" />
              <span>Browse All Courses</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isExpired = timeLeft ? timeLeft.isExpired : !offer.isBookable;
  const imageSource = offer.bannerImageUrl || offer.course.thumbnailUrl || '/images/hero-fallback.jpg';

  return (
    <>
      <SEO
        title={`${offer.title} | JADMAA Varmakalai Campaign`}
        description={offer.shortDescription || offer.description}
        image={imageSource}
        url={`/offers/${offer.slug}`}
      />

      <div className="min-h-screen bg-[#0F0F12] text-white flex flex-col selection:bg-red-900 selection:text-white">
        
        {/* Top Campaign Bar */}
        <header className="border-b border-white/10 bg-[#121216]/90 backdrop-blur-md sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 group">
              <span className="font-heading font-black text-lg tracking-wider text-white group-hover:text-red-400 transition-colors">
                JADMAA <span className="text-red-500 font-normal">VARMAKALAI</span>
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-red-950/80 text-red-300 border border-red-800/50">
                <Flame className="w-3 h-3 text-amber-400" />
                LIMITED-TIME COURSE OFFER
              </span>

              <button
                onClick={handleCopyLink}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Copy campaign link"
                aria-label="Copy campaign link"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </header>

        {/* SECTION 1: CAMPAIGN HERO (Editorial Two-Column Layout) */}
        <section className="relative overflow-hidden pt-8 pb-14 sm:pt-12 sm:pb-20 border-b border-white/10">
          {/* Subtle Ambient Crimson Glow */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-950/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-72 h-72 bg-red-900/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              {/* Left Column: Headline, Narrative & Pricing */}
              <div className="lg:col-span-7 space-y-6 text-left">
                
                {/* Campaign Tag & Savings Pill */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-red-900/40 text-red-300 border border-red-700/50">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Special Campaign Offer
                  </span>
                  {offer.discountPercent > 0 && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Save {offer.discountPercent}%
                    </span>
                  )}
                  <span className="text-xs font-medium text-gray-400">
                    • Online Training Program
                  </span>
                </div>

                {/* Course Name Pre-Title */}
                <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-red-400">
                  {offer.course.title}
                </p>

                {/* Primary Promotional Headline */}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading text-white leading-[1.15] tracking-tight">
                  {offer.title}
                </h1>

                {/* Short Description */}
                {offer.shortDescription && (
                  <p className="text-base sm:text-lg text-gray-300 leading-relaxed font-sans max-w-xl">
                    {offer.shortDescription}
                  </p>
                )}

                {/* Course Quick Attributes */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-1 text-xs">
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                    <span className="block text-[10px] uppercase font-bold text-gray-400">Category</span>
                    <span className="font-semibold text-white">{offer.course.category || 'Varma Kalai'}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                    <span className="block text-[10px] uppercase font-bold text-gray-400">Level</span>
                    <span className="font-semibold text-white">{offer.course.level || 'All Levels'}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                    <span className="block text-[10px] uppercase font-bold text-gray-400">Duration</span>
                    <span className="font-semibold text-white">{offer.course.duration || 'Self-Paced'}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                    <span className="block text-[10px] uppercase font-bold text-gray-400">Curriculum</span>
                    <span className="font-semibold text-white">{offer.course.totalLessons} Lessons</span>
                  </div>
                </div>

                {/* Countdown Timer (When Enabled) */}
                {offer.countdownEnabled && timeLeft && !timeLeft.isExpired && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/60 via-black/80 to-red-950/60 border border-red-900/50 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-red-300">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                        Campaign Offer Closes In:
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">IST (Asia/Kolkata)</span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center pt-1 font-mono">
                      <div className="bg-black/70 p-2 rounded-lg border border-white/10">
                        <span className="text-xl sm:text-2xl font-black text-white block">
                          {String(timeLeft.days).padStart(2, '0')}
                        </span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Days</span>
                      </div>
                      <div className="bg-black/70 p-2 rounded-lg border border-white/10">
                        <span className="text-xl sm:text-2xl font-black text-white block">
                          {String(timeLeft.hours).padStart(2, '0')}
                        </span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Hours</span>
                      </div>
                      <div className="bg-black/70 p-2 rounded-lg border border-white/10">
                        <span className="text-xl sm:text-2xl font-black text-white block">
                          {String(timeLeft.minutes).padStart(2, '0')}
                        </span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Mins</span>
                      </div>
                      <div className="bg-black/70 p-2 rounded-lg border border-white/10">
                        <span className="text-xl sm:text-2xl font-black text-red-400 block">
                          {String(timeLeft.seconds).padStart(2, '0')}
                        </span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Secs</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pricing & Hero CTA */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-3xl sm:text-4xl font-black font-heading text-white">
                        ₹{offer.offerPrice.toLocaleString('en-IN')}
                      </span>
                      {offer.originalPrice > offer.offerPrice && (
                        <span className="text-lg text-gray-400 line-through">
                          ₹{offer.originalPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-green-400">
                      Save ₹{offer.discountAmount.toLocaleString('en-IN')} with this link
                    </span>
                  </div>

                  <button
                    onClick={handleBookNow}
                    disabled={isExpired || paymentStep === 'PROCESSING' || paymentStep === 'VERIFYING'}
                    className={`flex-1 sm:max-w-xs py-3.5 px-6 rounded-lg font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all ${
                      isExpired
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/10'
                        : 'bg-red-700 hover:bg-red-600 text-white shadow-red-900/50 hover:scale-[1.02] active:scale-[0.98] cursor-pointer border border-red-500/30'
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
                        : 'BOOK THIS COURSE'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Trust Line */}
                <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                    256-bit Razorpay Checkout
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    Official JADMAA Certification
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    Immediate Lifetime Access
                  </span>
                </div>

              </div>

              {/* Right Column: Hero Visual Showcase */}
              <div className="lg:col-span-5">
                <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-[#141418] group">
                  
                  {/* Decorative Frame Line */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 z-10" />

                  {/* Image */}
                  <div className="aspect-[4/3] sm:aspect-[16/11] w-full overflow-hidden relative">
                    <img
                      src={imageSource}
                      alt={offer.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F12] via-transparent to-black/30" />
                  </div>

                  {/* Floating Overlay Details */}
                  <div className="p-5 space-y-3 relative z-10 -mt-10 bg-gradient-to-t from-[#141418] via-[#141418] to-transparent">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                        <span className="text-xs font-bold text-gray-200">Admissions Open</span>
                      </div>
                      <span className="text-xs font-mono text-gray-400">
                        {offer.course.totalLessons} HD Video Lessons
                      </span>
                    </div>

                    <p className="text-xs text-gray-400 line-clamp-2">
                      {offer.course.subtitle || offer.course.description}
                    </p>

                    {offer.bookingLimit && (
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[11px] font-semibold text-gray-400">
                          <span>Seats Claimed:</span>
                          <span className="text-red-400 font-bold">
                            {offer.currentBookings} / {offer.bookingLimit}
                          </span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-red-600 h-full rounded-full"
                            style={{
                              width: `${Math.min(100, Math.round((offer.currentBookings / offer.bookingLimit) * 100))}%`
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION 2: WHAT YOU WILL LEARN & SYLLABUS (Clean Readable Parchment) */}
        <section className="py-14 sm:py-20 bg-[#FAF6F0] text-[#1C1917] border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-10 text-left">
            
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#B12B2B]">
                Curriculum & Syllabus
              </span>
              <h2 className="text-2xl sm:text-3xl font-black font-heading text-[#1C1917]">
                What You Will Learn in This Course
              </h2>
              <p className="text-sm text-gray-600 max-w-2xl leading-relaxed">
                Step-by-step curriculum directly formulated from traditional Tamil Varmakalai martial science and healing techniques.
              </p>
            </div>

            {/* Campaign Narrative */}
            {offer.description && (
              <div className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm text-sm leading-relaxed whitespace-pre-line text-gray-700">
                {offer.description}
              </div>
            )}

            {/* Modules and Lessons */}
            {offer.course.modules && offer.course.modules.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-800">
                  Course Modules & Lessons Breakdown ({offer.course.totalLessons} Lessons)
                </h3>

                <div className="space-y-2.5">
                  {offer.course.modules.map((m, idx) => {
                    const isOpen = openModuleIndex === idx;
                    return (
                      <div
                        key={m.id}
                        className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm transition"
                      >
                        <button
                          onClick={() => setOpenModuleIndex(isOpen ? null : idx)}
                          className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-md bg-[#FAF6F0] text-[#B12B2B] font-bold text-xs flex items-center justify-center border border-gray-200">
                              {idx + 1}
                            </span>
                            <div>
                              <h4 className="text-sm font-bold text-gray-900">{m.title}</h4>
                              <p className="text-[11px] text-gray-500">{m.lessonCount} Lessons</p>
                            </div>
                          </div>
                          {isOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                        </button>

                        {isOpen && (
                          <div className="p-4 pt-1 border-t border-gray-100 bg-[#FAF6F0]/50 space-y-2">
                            {m.lessons.map((l) => (
                              <div
                                key={l.id}
                                className="flex items-center justify-between py-2 px-3 rounded-lg bg-white border border-gray-200 text-xs"
                              >
                                <div className="flex items-center gap-2.5">
                                  <Play className="w-3.5 h-3.5 text-[#B12B2B] shrink-0" />
                                  <span className="font-medium text-gray-800">{l.title}</span>
                                  {l.isFreePreview && (
                                    <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.2 rounded font-bold">
                                      Free Preview
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-gray-500 font-mono">{l.duration}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-white border border-gray-200 text-sm text-gray-600">
                {offer.course.longDescription || offer.course.description}
              </div>
            )}

          </div>
        </section>

        {/* SECTION 3: COURSE BENEFITS & TRADITIONAL LINEAGE */}
        <section className="py-14 sm:py-20 border-b border-white/10 bg-[#121216]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-10 text-left">
            
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-red-400">
                Traditional Discipline
              </span>
              <h2 className="text-2xl sm:text-3xl font-black font-heading text-white">
                Why Study with JADMAA Varmakalai
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="w-9 h-9 rounded-lg bg-red-950/60 text-red-400 flex items-center justify-center border border-red-800/40">
                  <Compass className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white">Authentic Asan Lineage</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Preserving centuries-old knowledge of vital pressure points (Varma Pulligal), combat applications and natural body alignment.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="w-9 h-9 rounded-lg bg-red-950/60 text-red-400 flex items-center justify-center border border-red-800/40">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white">Defence & Therapeutic Health</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Learn practical self-protection techniques alongside natural healing points for nervous system balance and wellness.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="w-9 h-9 rounded-lg bg-red-950/60 text-red-400 flex items-center justify-center border border-red-800/40">
                  <Award className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white">Recognized Academy Certification</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Receive an authenticated JADMAA certificate of completion upon finishing all lessons in the course curriculum.
                </p>
              </div>
            </div>

            {/* Instructor Feature */}
            {offer.course.instructor && (
              <div className="p-6 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-neutral-800 shrink-0 border border-white/10">
                  {offer.course.instructor.avatarUrl ? (
                    <img
                      src={offer.course.instructor.avatarUrl}
                      alt={offer.course.instructor.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-red-400 text-xl font-heading">
                      {offer.course.instructor.displayName.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="text-center sm:text-left space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-red-400">Master Instructor</p>
                  <h3 className="text-base font-bold text-white">{offer.course.instructor.displayName}</h3>
                  {offer.course.instructor.title && (
                    <p className="text-xs text-gray-400">{offer.course.instructor.title}</p>
                  )}
                  {offer.course.instructor.bio && (
                    <p className="text-xs text-gray-300 pt-1 leading-relaxed max-w-2xl">{offer.course.instructor.bio}</p>
                  )}
                </div>
              </div>
            )}

          </div>
        </section>

        {/* SECTION 4: CONVERSION & BOOKING CARD */}
        <section className="py-14 sm:py-20 border-b border-white/10 bg-[#0F0F12]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="rounded-2xl bg-gradient-to-b from-[#18181D] to-[#121216] border border-red-900/40 p-6 sm:p-10 shadow-2xl space-y-6 text-left relative overflow-hidden">
              
              <div className="space-y-1">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-red-400">
                  Enrollment Checkout
                </span>
                <h3 className="text-2xl sm:text-3xl font-black font-heading text-white">
                  Claim Promotional Access to {offer.course.title}
                </h3>
              </div>

              {/* Price Details */}
              <div className="p-4 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Special Price</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl font-black text-red-400 font-heading">
                      ₹{offer.offerPrice.toLocaleString('en-IN')}
                    </span>
                    {offer.originalPrice > offer.offerPrice && (
                      <span className="text-base text-gray-500 line-through">
                        ₹{offer.originalPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 rounded-md bg-green-900/60 text-green-300 border border-green-700/50 text-xs font-bold">
                    Save ₹{offer.discountAmount.toLocaleString('en-IN')}
                  </span>
                  <p className="text-[10px] text-gray-400 mt-1">One-time payment</p>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleBookNow}
                disabled={isExpired || paymentStep === 'PROCESSING' || paymentStep === 'VERIFYING'}
                className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xl transition-all ${
                  isExpired
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/10'
                    : 'bg-red-700 hover:bg-red-600 text-white shadow-red-900/50 hover:scale-[1.01] active:scale-[0.99] cursor-pointer border border-red-500/30'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>
                  {paymentStep === 'PROCESSING'
                    ? 'Preparing Secure Checkout...'
                    : paymentStep === 'VERIFYING'
                    ? 'Verifying Payment...'
                    : isExpired
                    ? 'Campaign Offer Closed'
                    : `ENROLL NOW FOR ₹${offer.offerPrice.toLocaleString('en-IN')}`}
                </span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              {/* Terms and Conditions (If Specified) */}
              {offer.termsAndConditions && (
                <div className="pt-2 border-t border-white/10 text-xs text-gray-400 space-y-1">
                  <span className="font-bold text-gray-300">Terms & Conditions:</span>
                  <p className="whitespace-pre-line leading-relaxed">{offer.termsAndConditions}</p>
                </div>
              )}

              {/* Help & Support Details */}
              <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
                <span>Need assistance before enrolling?</span>
                <div className="flex items-center gap-4 text-gray-300 font-semibold">
                  <a href={`tel:${offer.supportPhone}`} className="hover:text-red-400 transition flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-red-400" />
                    <span>{offer.supportPhone}</span>
                  </a>
                  <a href={`mailto:${offer.supportEmail}`} className="hover:text-red-400 transition flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-red-400" />
                    <span>{offer.supportEmail}</span>
                  </a>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION 6: FOOTER */}
        <footer className="py-8 bg-black border-t border-white/10 text-xs text-gray-500 text-center space-y-2">
          <p>© {new Date().getFullYear()} JADMAA Varmakalai Academy. All rights reserved.</p>
          <div className="flex items-center justify-center gap-4 text-gray-400">
            <Link to="/courses" className="hover:text-white transition">All Courses</Link>
            <span>•</span>
            <Link to="/about" className="hover:text-white transition">About Academy</Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-white transition">Contact</Link>
          </div>
        </footer>

        {/* MOBILE STICKY BOTTOM BAR */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#121216]/95 backdrop-blur-md border-t border-white/15 p-3 px-4 flex items-center justify-between shadow-2xl">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-heading text-red-400">
                ₹{offer.offerPrice.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-gray-500 line-through">
                ₹{offer.originalPrice.toLocaleString('en-IN')}
              </span>
            </div>
            <span className="text-[10px] font-bold text-amber-300">
              Save {offer.discountPercent}%
            </span>
          </div>

          <button
            onClick={handleBookNow}
            disabled={isExpired || paymentStep === 'PROCESSING' || paymentStep === 'VERIFYING'}
            className={`px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md transition ${
              isExpired
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-red-700 hover:bg-red-600 text-white'
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
