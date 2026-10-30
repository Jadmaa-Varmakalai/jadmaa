import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { SEO } from '../../components/common/SEO';
import { offerApi } from '../../lib/api/offerApi';
import type { PublicOfferDetails } from '../../lib/api/offerApi';
import { loadRazorpayScript } from '../../lib/razorpay';
import { useAuth } from '../../context/AuthContext';
import {
  Clock, CheckCircle, ShieldCheck, Award, BookOpen,
  ArrowRight, Phone, Mail, AlertTriangle, Users, Play, ChevronDown,
  ChevronUp, Lock, Check, Share2, Copy, Flame, MapPin, Calendar,
  MessageCircle, Send, X, Sparkles
} from 'lucide-react';

const getCategoryDisplay = (category?: string, customCategory?: string) => {
  if (customCategory) return customCategory.toUpperCase();
  switch (category) {
    case 'VARMA_TREATMENT':
      return 'VARMA THERAPY & TREATMENT';
    case 'OFFLINE_CLASS':
      return 'OFFLINE MARTIAL ARTS CLASSES';
    case 'SPECIAL_CAMP':
      return 'INTENSIVE RESIDENTIAL CAMP';
    case 'WORKSHOP':
      return 'MASTER WORKSHOP';
    case 'SEMINAR':
      return 'ACADEMY SEMINAR';
    case 'SPECIAL_EVENT':
      return 'SPECIAL EVENT';
    case 'ACADEMY_PROGRAMME':
      return 'ACADEMY PROGRAMME';
    case 'ONLINE_COURSE':
    default:
      return 'ONLINE MARTIAL ARTS COURSE';
  }
};

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

  // Enquiry / Registration Form modal state
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
  const [enquiryName, setEnquiryName] = useState('');
  const [enquiryPhone, setEnquiryPhone] = useState('');
  const [enquiryEmail, setEnquiryEmail] = useState('');
  const [enquiryBranch, setEnquiryBranch] = useState('Thanjavur');
  const [enquiryNotes, setEnquiryNotes] = useState('');
  const [enquirySubmitting, setEnquirySubmitting] = useState(false);
  const [enquirySuccessData, setEnquirySuccessData] = useState<{ bookingNumber: string; customerName: string } | null>(null);
  const [enquiryError, setEnquiryError] = useState<string | null>(null);

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
          if (res.data.branchLocation) {
            setEnquiryBranch(res.data.branchLocation);
          }
        } else {
          setError(res.error?.message || 'This promotional campaign is currently unavailable or has expired.');
        }
      } catch (err: any) {
        setError(err.message || 'This promotional campaign is currently unavailable or has expired.');
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

  // Online Course Razorpay Payment Flow
  const handleCourseBooking = async () => {
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

      const res = await offerApi.initiateOfferBooking(offer.slug);
      if (!res.success || !res.data) {
        setPaymentStep('FAILED');
        alert(res.error?.message || 'Failed to initiate booking order.');
        return;
      }

      const { keyId, orderId, amount, currency, prefill } = res.data;

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
          color: offer.primaryColor || '#991B1B',
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

  // Primary Action Router
  const handlePrimaryAction = () => {
    if (!offer) return;
    if (offer.category === 'ONLINE_COURSE' && offer.course && !offer.isEnquiryOnly) {
      handleCourseBooking();
    } else if (offer.ctaType === 'CUSTOM_URL' && offer.ctaUrl) {
      if (offer.ctaUrl.startsWith('http')) {
        window.open(offer.ctaUrl, '_blank');
      } else {
        navigate(offer.ctaUrl);
      }
    } else {
      // Open Registration / Enquiry Modal
      setIsEnquiryModalOpen(true);
    }
  };

  // Submit Enquiry / Registration Form
  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offer) return;
    setEnquirySubmitting(true);
    setEnquiryError(null);
    try {
      const res = await offerApi.submitOfferEnquiry(offer.slug, {
        name: enquiryName,
        phone: enquiryPhone,
        email: enquiryEmail,
        branchLocation: enquiryBranch,
        notes: enquiryNotes
      });
      if (res.success && res.data) {
        setEnquirySuccessData(res.data);
      } else {
        setEnquiryError(res.error?.message || 'Failed to submit registration.');
      }
    } catch (err: any) {
      setEnquiryError(err.message || 'Failed to submit registration.');
    } finally {
      setEnquirySubmitting(false);
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

  const isExpired = offer.computedStatus === 'EXPIRED' || (timeLeft ? timeLeft.isExpired : !offer.isBookable);
  const imageSource = offer.bannerImageUrl || (offer.course && offer.course.thumbnailUrl) || '/images/wellness-682x1024.png';
  const categoryTitle = getCategoryDisplay(offer.category, offer.customCategory);
  const primaryBrandColor = offer.primaryColor || '#991B1B';

  return (
    <>
      <SEO
        title={`${offer.title} | JADMAA Varmakalai Campaign`}
        description={offer.shortDescription || offer.description}
        image={imageSource}
        url={`/offers/${offer.slug}`}
      />

      <div className="min-h-screen bg-[#0F0F12] text-white flex flex-col selection:bg-red-900 selection:text-white">
        
        {/* Top Header Navigation */}
        <header className="sticky top-0 z-40 bg-[#0F0F12]/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <img src="/logo.png" alt="JADMAA" className="h-8 w-auto object-contain" />
              <div className="hidden sm:block">
                <span className="font-heading font-black tracking-wider text-sm text-white">JADMAA</span>
                <span className="text-[10px] block tracking-widest text-red-400 font-bold -mt-0.5">VARMAKALAI</span>
              </div>
            </Link>

            <span className="h-4 w-px bg-white/20 hidden sm:block" />

            <span className="text-xs font-semibold text-gray-400 hidden md:block">
              Official Campaign
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-gray-300 flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Share'}</span>
            </button>

            <button
              onClick={handlePrimaryAction}
              disabled={isExpired}
              style={{ backgroundColor: primaryBrandColor }}
              className="px-4 py-1.5 rounded-lg text-white font-bold text-xs tracking-wide shadow-md hover:brightness-110 active:scale-95 transition disabled:opacity-50"
            >
              {isExpired ? 'Campaign Concluded' : offer.ctaText || (offer.category === 'VARMA_TREATMENT' ? 'Book Treatment' : offer.category === 'ONLINE_COURSE' ? 'Enrol Now' : 'Register Now')}
            </button>
          </div>
        </header>

        {/* Expired Campaign Announcement Bar */}
        {isExpired && (
          <div className="bg-amber-950/90 border-b border-amber-600/40 px-4 py-2.5 text-center text-amber-200 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 animate-fadeIn">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>This promotional window has concluded. Registration at this special promotional rate is now closed.</span>
          </div>
        )}

        {/* SECTION 1: SPLIT-SCREEN CAMPAIGN HERO (Reference 3 Composition) */}
        <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-[#141418] via-[#0F0F12] to-[#0A0A0C]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              {/* LEFT SECTION: Details & Countdown */}
              <div className="lg:col-span-7 space-y-6 z-10">
                {/* Category Pill + Savings */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-extrabold tracking-widest uppercase border"
                    style={{
                      backgroundColor: `${primaryBrandColor}22`,
                      borderColor: `${primaryBrandColor}55`,
                      color: '#FCA5A5'
                    }}
                  >
                    {categoryTitle}
                  </span>

                  {offer.discountPercent > 0 && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-amber-500/20 border border-amber-500/40 text-amber-300">
                      {offer.discountPercent}% LIMITED DISCOUNT
                    </span>
                  )}

                  {offer.branchLocation && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-gray-300">
                      <MapPin className="w-3 h-3 text-red-400" />
                      {offer.branchLocation}
                    </span>
                  )}
                </div>

                {/* Main Headline */}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading leading-[1.12] tracking-tight text-white">
                  {offer.title}
                </h1>

                {/* Supporting Description */}
                <p className="text-base sm:text-lg text-gray-300 leading-relaxed max-w-2xl font-light">
                  {offer.shortDescription || offer.description}
                </p>

                {/* Offer Pricing / Value Badge */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex flex-wrap items-baseline gap-4 max-w-xl">
                  {offer.pricingType === 'ENQUIRY_ONLY' ? (
                    <div>
                      <span className="text-2xl sm:text-3xl font-black font-heading text-red-400">
                        Open for Bookings
                      </span>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Free enquiry & consultation with certified Aasan
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                        Promotional Campaign Price
                      </p>
                      <div className="flex items-baseline gap-3 mt-1">
                        <span
                          className="text-3xl sm:text-4xl font-black font-heading"
                          style={{ color: '#F87171' }}
                        >
                          ₹{offer.offerPrice.toLocaleString('en-IN')}
                        </span>
                        {offer.originalPrice > offer.offerPrice && (
                          <span className="text-lg text-gray-500 line-through font-medium">
                            ₹{offer.originalPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                        {offer.discountAmount > 0 && (
                          <span className="text-xs font-extrabold text-green-400 bg-green-950/60 border border-green-800/60 px-2 py-0.5 rounded">
                            Save ₹{offer.discountAmount.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Real-time Countdown Timer */}
                {timeLeft && !timeLeft.isExpired && (
                  <div className="space-y-2 max-w-xl">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-300 uppercase tracking-wider">
                      <Clock className="w-4 h-4 text-red-400" />
                      <span>Promotional Window Closing Soon</span>
                    </div>

                    <div className="grid grid-cols-4 gap-2.5 max-w-md">
                      <div className="p-3 rounded-xl bg-[#18181D] border border-white/10 text-center">
                        <span className="block text-2xl sm:text-3xl font-black font-mono text-white">
                          {String(timeLeft.days).padStart(2, '0')}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Days</span>
                      </div>

                      <div className="p-3 rounded-xl bg-[#18181D] border border-white/10 text-center">
                        <span className="block text-2xl sm:text-3xl font-black font-mono text-white">
                          {String(timeLeft.hours).padStart(2, '0')}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Hours</span>
                      </div>

                      <div className="p-3 rounded-xl bg-[#18181D] border border-white/10 text-center">
                        <span className="block text-2xl sm:text-3xl font-black font-mono text-white">
                          {String(timeLeft.minutes).padStart(2, '0')}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Mins</span>
                      </div>

                      <div className="p-3 rounded-xl bg-[#18181D] border border-white/10 text-center">
                        <span className="block text-2xl sm:text-3xl font-black font-mono text-red-400">
                          {String(timeLeft.seconds).padStart(2, '0')}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Secs</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Primary & Secondary Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-md">
                  <button
                    onClick={handlePrimaryAction}
                    disabled={isExpired || paymentStep === 'PROCESSING'}
                    style={{ backgroundColor: primaryBrandColor }}
                    className="flex-1 px-7 py-4 rounded-xl text-white font-black text-sm tracking-wide shadow-xl shadow-red-950/40 hover:brightness-110 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>
                      {paymentStep === 'PROCESSING'
                        ? 'Opening Checkout...'
                        : offer.ctaText || (offer.category === 'VARMA_TREATMENT' ? 'Book Treatment Session' : offer.category === 'ONLINE_COURSE' ? 'Claim Offer & Enrol' : 'Register for Campaign')}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <a
                    href={`https://wa.me/919345220020?text=${encodeURIComponent(`Hello JADMAA, I am inquiring about the ${offer.title} promotional offer.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-bold text-xs sm:text-sm text-gray-200 flex items-center justify-center gap-2 transition"
                  >
                    <MessageCircle className="w-4 h-4 text-green-400" />
                    <span>WhatsApp Aasan</span>
                  </a>
                </div>
              </div>

              {/* RIGHT SECTION: Large Product/Service Photograph with Diagonal/Curved Cut */}
              <div className="lg:col-span-5 relative mt-6 lg:mt-0">
                <div className="relative mx-auto max-w-md lg:max-w-none">
                  
                  {/* Decorative Background Glow */}
                  <div
                    className="absolute -inset-4 rounded-3xl opacity-30 blur-2xl pointer-events-none"
                    style={{ backgroundColor: primaryBrandColor }}
                  />

                  {/* Shaped Photograph Container inspired by Reference 3 */}
                  <div className="relative rounded-3xl overflow-hidden border border-white/15 bg-[#141418] shadow-2xl group">
                    <img
                      src={imageSource}
                      alt={offer.title}
                      className="w-full h-[380px] sm:h-[460px] lg:h-[540px] object-cover object-top transition duration-500 group-hover:scale-102"
                    />

                    {/* Editorial Diagonal and Vignette Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F12] via-transparent to-black/20 pointer-events-none" />
                    <div
                      className="absolute inset-0 opacity-20 pointer-events-none mix-blend-color-dodge"
                      style={{
                        background: `radial-gradient(circle at 70% 30%, ${primaryBrandColor}, transparent 60%)`
                      }}
                    />

                    <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-black/75 backdrop-blur-md border border-white/10 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-extrabold text-red-400 uppercase tracking-widest">
                          Authentic Siddha Lineage
                        </p>
                        <p className="text-sm font-bold text-white mt-0.5">
                          JADMAA Varmakalai Academy
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-red-600/30 text-red-300 font-extrabold text-[11px] border border-red-500/40">
                        1000+ Years
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION 2: CURRICULUM OR SERVICE DETAILS */}
        <section className="bg-[#FAF6F0] text-[#1F2937] py-14 sm:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto space-y-12">
            
            {/* Description & Overview */}
            <div className="max-w-3xl space-y-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 text-red-800">
                Detailed Overview
              </span>
              <h2 className="text-2xl sm:text-3xl font-black font-heading text-gray-900 tracking-tight">
                About this {categoryTitle.toLowerCase()}
              </h2>
              <div className="text-base text-gray-700 leading-relaxed font-body whitespace-pre-line">
                {offer.description || offer.shortDescription}
              </div>
            </div>

            {/* Course Curriculum Accordion (when course modules exist) */}
            {offer.course && offer.course.modules && offer.course.modules.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold font-heading text-gray-900">
                    Course Curriculum & Lessons ({offer.course.totalLessons} Lessons)
                  </h3>
                  <span className="text-xs font-semibold text-gray-500">
                    {offer.course.duration || 'Self-paced'}
                  </span>
                </div>

                <div className="space-y-3">
                  {offer.course.modules.map((module, idx) => (
                    <div
                      key={module.id}
                      className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm"
                    >
                      <button
                        onClick={() => setOpenModuleIndex(openModuleIndex === idx ? null : idx)}
                        className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-gray-50 transition"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg bg-red-50 text-red-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-gray-900">{module.title}</h4>
                            <span className="text-xs text-gray-500 font-medium">{module.lessonCount} Lessons</span>
                          </div>
                        </div>
                        {openModuleIndex === idx ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </button>

                      {openModuleIndex === idx && (
                        <div className="px-5 pb-4 pt-1 border-t border-gray-100 divide-y divide-gray-100 text-xs text-gray-600">
                          {module.lessons.map((lesson) => (
                            <div key={lesson.id} className="py-2.5 flex items-center justify-between gap-2">
                              <span className="flex items-center gap-2">
                                <Play className="w-3.5 h-3.5 text-gray-400" />
                                <span className="font-medium text-gray-800">{lesson.title}</span>
                              </span>
                              <span className="font-mono text-gray-400">{lesson.duration}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Offline Branch Location Info (for treatments, camps, offline classes) */}
            {offer.category !== 'ONLINE_COURSE' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
                <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-700 flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-gray-900">Headquarters: Thanjavur</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Opp. Sastra University Campus, Tirumalaisamudram, Thanjavur, Tamil Nadu 613401.
                  </p>
                  <p className="text-xs font-semibold text-red-700">Phone: +91 93452 20020</p>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-700 flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-gray-900">Branch: Kumbakonam</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Near Town Hall Road, Kumbakonam, Tamil Nadu 612001.
                  </p>
                  <p className="text-xs font-semibold text-red-700">Phone: +91 96554 57500</p>
                </div>
              </div>
            )}

            {/* Terms and Conditions */}
            {offer.termsAndConditions && (
              <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-2">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Campaign Terms & Enrollment Conditions
                </h4>
                <div className="text-xs text-gray-600 leading-relaxed whitespace-pre-line font-mono">
                  {offer.termsAndConditions}
                </div>
              </div>
            )}

          </div>
        </section>

        {/* SECTION 3: FOOTER SUPPORT */}
        <footer className="mt-auto bg-[#0A0A0C] border-t border-white/10 py-10 px-4 text-center text-xs text-gray-500 space-y-3">
          <p>
            Have questions about this campaign? Contact support at{' '}
            <a href={`mailto:${offer.supportEmail}`} className="text-gray-300 underline font-medium">
              {offer.supportEmail}
            </a>{' '}
            or call{' '}
            <a href={`tel:${offer.supportPhone}`} className="text-gray-300 underline font-medium">
              {offer.supportPhone}
            </a>.
          </p>
          <p>© {new Date().getFullYear()} JADMAA Varmakalai. All rights reserved.</p>
        </footer>

        {/* REGISTRATION / ENQUIRY MODAL */}
        {isEnquiryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-md bg-[#141418] text-white border border-white/15 rounded-2xl p-6 sm:p-7 shadow-2xl">
              
              <button
                onClick={() => {
                  setIsEnquiryModalOpen(false);
                  setEnquirySuccessData(null);
                  setEnquiryError(null);
                }}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>

              {enquirySuccessData ? (
                <div className="text-center space-y-4 py-4">
                  <div className="w-14 h-14 rounded-full bg-green-500/20 text-green-400 border border-green-500/40 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold font-heading text-white">Registration Confirmed!</h3>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Thank you, <strong className="text-white">{enquirySuccessData.customerName}</strong>. Your enquiry number is{' '}
                    <span className="font-mono text-red-400 font-bold">{enquirySuccessData.bookingNumber}</span>.
                  </p>
                  <p className="text-xs text-gray-400">
                    Our master instructors will reach out to your phone number shortly to coordinate dates and schedule.
                  </p>
                  <button
                    onClick={() => {
                      setIsEnquiryModalOpen(false);
                      setEnquirySuccessData(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs transition"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleEnquirySubmit} className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold font-heading text-white">
                      Register for {offer.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Enter your details to reserve your promotional spot.
                    </p>
                  </div>

                  {enquiryError && (
                    <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{enquiryError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={enquiryName}
                      onChange={(e) => setEnquiryName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Phone / WhatsApp Number <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={enquiryPhone}
                      onChange={(e) => setEnquiryPhone(e.target.value)}
                      placeholder="+91 93452 20020"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={enquiryEmail}
                      onChange={(e) => setEnquiryEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Preferred Branch
                    </label>
                    <select
                      value={enquiryBranch}
                      onChange={(e) => setEnquiryBranch(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A20] border border-white/10 text-white text-sm focus:outline-none focus:border-red-500"
                    >
                      <option value="Thanjavur">Thanjavur (Headquarters)</option>
                      <option value="Kumbakonam">Kumbakonam Branch</option>
                      <option value="Online">Online Consultation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Notes or Health Concerns (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={enquiryNotes}
                      onChange={(e) => setEnquiryNotes(e.target.value)}
                      placeholder="Any specific questions or ailments..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-red-500 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={enquirySubmitting}
                    style={{ backgroundColor: primaryBrandColor }}
                    className="w-full py-3 rounded-xl text-white font-bold text-sm shadow-lg hover:brightness-110 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {enquirySubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Registration</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </>
  );
};
