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
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
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
          color: offer.primaryColor || '#B12B2B',
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

            if (verifyRes.success && verifyRes.data) {
              setPaymentStep('SUCCESS');
              const { enrollmentId, courseId } = verifyRes.data;
              if (courseId) {
                navigate(`/learn/${courseId}?enrolled=true`);
              } else if (enrollmentId) {
                navigate('/dashboard/my-courses');
              } else {
                navigate('/dashboard');
              }
            } else {
              setPaymentStep('FAILED');
              alert(verifyRes.error?.message || 'Payment verification failed. Please contact support.');
            }
          } catch (err: any) {
            setPaymentStep('FAILED');
            alert(err.message || 'Payment verification failed.');
          }
        }
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.open();
    } catch (err: any) {
      setPaymentStep('FAILED');
      alert(err.message || 'An error occurred during booking initiation.');
    }
  };

  // Primary Action Handler based on Campaign Type
  const handlePrimaryAction = () => {
    if (!offer) return;
    if (offer.category === 'ONLINE_COURSE' && offer.course) {
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
      <div className="min-h-[70vh] bg-[#FAF6F0] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-3 border-[#B12B2B] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#5C5148]">Loading campaign details...</p>
        </div>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="min-h-[70vh] bg-[#FAF6F0] flex items-center justify-center p-4 text-center">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-[#E8DDD0] space-y-5 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-[#B12B2B] flex items-center justify-center mx-auto border border-red-200">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold font-heading text-[#2B2521]">
            Campaign Unavailable
          </h2>
          <p className="text-sm text-[#5C5148] leading-relaxed">
            {error || 'This promotional offer has expired or is currently not active.'}
          </p>
          <div className="pt-2">
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#B12B2B] hover:bg-[#8F1E1E] text-white font-bold text-xs shadow-md transition cursor-pointer"
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
  const primaryBrandColor = offer.primaryColor || '#B12B2B';

  return (
    <>
      <SEO
        title={`${offer.title} | JADMAA Varmakalai Campaign`}
        description={offer.shortDescription || offer.description}
        image={imageSource}
        url={`/offers/${offer.slug}`}
      />

      <div className="min-h-screen bg-[#FAF6F0] text-[#2B2521] flex flex-col font-body">
        
        {/* Breadcrumb & Share Sub-bar */}
        <div className="bg-[#FAF6F0] border-b border-[#E8DDD0]/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between text-xs">
            <nav className="flex items-center gap-2 text-[#5C5148] truncate pr-4">
              <Link to="/" className="hover:text-[#B12B2B] transition">Home</Link>
              <span>/</span>
              <Link to="/courses" className="hover:text-[#B12B2B] transition">Courses & Programs</Link>
              <span>/</span>
              <span className="font-semibold text-[#2B2521] truncate">{offer.title}</span>
            </nav>

            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E8DDD0] hover:bg-gray-50 text-[#2B2521] text-xs font-semibold shadow-2xs transition shrink-0 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Link Copied!' : 'Share'}</span>
            </button>
          </div>
        </div>

        {/* Expired Campaign Announcement Bar */}
        {isExpired && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-center text-amber-900 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 animate-fadeIn">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>This promotional campaign has concluded. Special promotional registrations are now closed.</span>
          </div>
        )}

        {/* SECTION 1: CAMPAIGN HERO (Site-Integrated Editorial Warm Theme) */}
        <section className="relative overflow-hidden border-b border-[#E8DDD0] bg-gradient-to-b from-[#F5EFE6] via-[#FAF6F0] to-[#FAF6F0]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              {/* LEFT SECTION: Details, Pricing, Countdown & CTAs */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Category Pill + Savings + Branch */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold tracking-widest uppercase bg-red-100 text-[#B12B2B] border border-red-200/80">
                    {categoryTitle}
                  </span>

                  {offer.discountPercent > 0 && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-amber-100 text-amber-900 border border-amber-300">
                      {offer.discountPercent}% LIMITED DISCOUNT
                    </span>
                  )}

                  {offer.branchLocation && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white border border-[#E8DDD0] text-[#5C5148]">
                      <MapPin className="w-3 h-3 text-[#B12B2B]" />
                      {offer.branchLocation}
                    </span>
                  )}
                </div>

                {/* Main Headline */}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading leading-[1.15] tracking-tight text-[#2B2521]">
                  {offer.title}
                </h1>

                {/* Supporting Description */}
                <p className="text-base sm:text-lg text-[#5C5148] leading-relaxed max-w-2xl font-normal">
                  {offer.shortDescription || offer.description}
                </p>

                {/* Offer Pricing / Value Badge */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E8DDD0] shadow-sm max-w-xl">
                  {offer.pricingType === 'ENQUIRY_ONLY' ? (
                    <div>
                      <span className="text-2xl sm:text-3xl font-black font-heading text-[#B12B2B]">
                        Consultation & Registration Open
                      </span>
                      <p className="text-xs text-[#5C5148] mt-1">
                        Complimentary consultation and point diagnosis with certified Aasan
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-[11px] font-bold tracking-wider text-[#8C7E72] uppercase">
                        Promotional Campaign Price
                      </p>
                      <div className="flex items-baseline gap-3 mt-1.5 flex-wrap">
                        <span
                          className="text-3xl sm:text-4xl font-black font-heading tracking-tight"
                          style={{ color: primaryBrandColor }}
                        >
                          ₹{offer.offerPrice.toLocaleString('en-IN')}
                        </span>
                        {offer.originalPrice > offer.offerPrice && (
                          <span className="text-lg text-[#8C7E72] line-through font-medium">
                            ₹{offer.originalPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                        {offer.discountAmount > 0 && (
                          <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded">
                            Save ₹{offer.discountAmount.toLocaleString('en-IN')} ({offer.discountPercent}% OFF)
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Real-time Countdown Timer */}
                {timeLeft && !timeLeft.isExpired && (
                  <div className="space-y-2 max-w-xl">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#8C7E72] uppercase tracking-wider">
                      <Clock className="w-4 h-4 text-[#B12B2B]" />
                      <span>Promotional Window Closing Soon</span>
                    </div>

                    <div className="grid grid-cols-4 gap-2.5 max-w-md">
                      <div className="p-3 rounded-xl bg-white border border-[#E8DDD0] text-center shadow-2xs">
                        <span className="block text-2xl sm:text-3xl font-black font-mono text-[#2B2521]">
                          {String(timeLeft.days).padStart(2, '0')}
                        </span>
                        <span className="text-[10px] text-[#8C7E72] font-bold uppercase tracking-wider">Days</span>
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-[#E8DDD0] text-center shadow-2xs">
                        <span className="block text-2xl sm:text-3xl font-black font-mono text-[#2B2521]">
                          {String(timeLeft.hours).padStart(2, '0')}
                        </span>
                        <span className="text-[10px] text-[#8C7E72] font-bold uppercase tracking-wider">Hours</span>
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-[#E8DDD0] text-center shadow-2xs">
                        <span className="block text-2xl sm:text-3xl font-black font-mono text-[#2B2521]">
                          {String(timeLeft.minutes).padStart(2, '0')}
                        </span>
                        <span className="text-[10px] text-[#8C7E72] font-bold uppercase tracking-wider">Mins</span>
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-[#E8DDD0] text-center shadow-2xs">
                        <span className="block text-2xl sm:text-3xl font-black font-mono text-[#B12B2B]">
                          {String(timeLeft.seconds).padStart(2, '0')}
                        </span>
                        <span className="text-[10px] text-[#8C7E72] font-bold uppercase tracking-wider">Secs</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-md">
                  <button
                    onClick={handlePrimaryAction}
                    disabled={isExpired || paymentStep === 'PROCESSING'}
                    style={{ backgroundColor: primaryBrandColor }}
                    className="flex-1 px-8 py-4 rounded-xl text-white font-bold text-sm tracking-wide shadow-md hover:brightness-110 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>
                      {paymentStep === 'PROCESSING'
                        ? 'Opening Checkout...'
                        : isExpired
                        ? 'Campaign Concluded'
                        : offer.ctaText || (offer.category === 'VARMA_TREATMENT' ? 'Book Treatment Session' : offer.category === 'ONLINE_COURSE' ? 'Claim Offer & Enrol' : 'Register for Campaign')}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <a
                    href={`https://wa.me/919345220020?text=${encodeURIComponent(`Hello JADMAA, I am inquiring about the ${offer.title} promotional offer.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-4 rounded-xl bg-white hover:bg-gray-50 border border-[#E8DDD0] font-bold text-xs sm:text-sm text-[#2B2521] shadow-2xs flex items-center justify-center gap-2 transition"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>WhatsApp Specialist</span>
                  </a>
                </div>

              </div>

              {/* RIGHT SECTION: High-Res Campaign Photograph */}
              <div className="lg:col-span-5 relative mt-6 lg:mt-0">
                <div className="relative mx-auto max-w-md lg:max-w-none">
                  
                  {/* Subtle Brand Accent Shadow */}
                  <div
                    className="absolute -inset-2 rounded-3xl opacity-20 blur-xl pointer-events-none"
                    style={{ backgroundColor: primaryBrandColor }}
                  />

                  {/* Clean Framed Photograph Container */}
                  <div className="relative rounded-3xl overflow-hidden border-4 border-white bg-white shadow-xl group">
                    <img
                      src={imageSource}
                      alt={offer.title}
                      className="w-full h-[380px] sm:h-[460px] lg:h-[520px] object-cover object-top transition duration-500 group-hover:scale-101"
                    />

                    {/* Bottom Status Card */}
                    <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-[#E8DDD0] shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-extrabold text-[#B12B2B] uppercase tracking-widest">
                          Authentic Siddha Lineage
                        </p>
                        <p className="text-sm font-bold text-[#2B2521] mt-0.5">
                          JADMAA Varmakalai Academy
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-red-50 text-[#B12B2B] font-extrabold text-[11px] border border-red-200">
                        1000+ Years
                      </span>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION 2: PROGRAMME / SERVICE DETAILS & ACCORDION */}
        <section className="bg-[#FAF6F0] py-14 sm:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto space-y-12">
            
            {/* Description & Overview */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8DDD0] shadow-xs space-y-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 text-[#B12B2B]">
                Detailed Overview
              </span>
              <h2 className="text-2xl sm:text-3xl font-black font-heading text-[#2B2521] tracking-tight">
                About this {categoryTitle.toLowerCase()}
              </h2>
              <div className="text-base text-[#5C5148] leading-relaxed whitespace-pre-line font-normal">
                {offer.description || offer.shortDescription}
              </div>
            </div>

            {/* Course Curriculum Accordion (when course modules exist) */}
            {offer.course && offer.course.modules && offer.course.modules.length > 0 && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8DDD0] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold font-heading text-[#2B2521]">
                    Course Curriculum & Lessons ({offer.course.totalLessons} Lessons)
                  </h3>
                  <span className="text-xs font-semibold text-[#8C7E72]">
                    {offer.course.duration || 'Self-paced'}
                  </span>
                </div>

                <div className="space-y-3 pt-2">
                  {offer.course.modules.map((module, idx) => (
                    <div
                      key={module.id}
                      className="rounded-xl border border-[#E8DDD0] bg-[#FDFBF7] overflow-hidden"
                    >
                      <button
                        onClick={() => setOpenModuleIndex(openModuleIndex === idx ? null : idx)}
                        className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-[#F5EFE6] transition cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg bg-red-100 text-[#B12B2B] font-bold text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-[#2B2521]">{module.title}</h4>
                            <span className="text-xs text-[#8C7E72] font-medium">{module.lessonCount} Lessons</span>
                          </div>
                        </div>
                        {openModuleIndex === idx ? <ChevronUp className="w-4 h-4 text-[#8C7E72]" /> : <ChevronDown className="w-4 h-4 text-[#8C7E72]" />}
                      </button>

                      {openModuleIndex === idx && (
                        <div className="px-5 pb-4 pt-1 border-t border-[#E8DDD0]/80 divide-y divide-[#E8DDD0]/60 text-xs text-[#5C5148]">
                          {module.lessons.map((lesson) => (
                            <div key={lesson.id} className="py-2.5 flex items-center justify-between gap-2">
                              <span className="flex items-center gap-2">
                                <Play className="w-3.5 h-3.5 text-[#B12B2B]" />
                                <span className="font-medium text-[#2B2521]">{lesson.title}</span>
                              </span>
                              <span className="font-mono text-[#8C7E72]">{lesson.duration}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Offline Branch Location Info (Thanjavur, Kumbakonam & Ariyalur) */}
            {offer.category !== 'ONLINE_COURSE' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 text-[#B12B2B]">
                    Academy Locations
                  </span>
                  <h3 className="text-xl font-bold font-heading text-[#2B2521]">
                    Available Training & Treatment Centers
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Branch 1: Thanjavur */}
                  <div className="p-6 rounded-2xl bg-white border border-[#E8DDD0] shadow-2xs space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-red-100 text-[#B12B2B] flex items-center justify-center">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <h4 className="text-base font-bold text-[#2B2521]">Headquarters: Thanjavur</h4>
                      <p className="text-xs text-[#5C5148] leading-relaxed">
                        Opp. Sastra University Campus, Tirumalaisamudram, Thanjavur, Tamil Nadu 613401.
                      </p>
                    </div>
                    <p className="text-xs font-bold text-[#B12B2B] pt-2 border-t border-[#E8DDD0]/60">
                      Phone: +91 93452 20020
                    </p>
                  </div>

                  {/* Branch 2: Kumbakonam */}
                  <div className="p-6 rounded-2xl bg-white border border-[#E8DDD0] shadow-2xs space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-red-100 text-[#B12B2B] flex items-center justify-center">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <h4 className="text-base font-bold text-[#2B2521]">Branch: Kumbakonam</h4>
                      <p className="text-xs text-[#5C5148] leading-relaxed">
                        Swamimalai Rd, Melacavery, Kumbakonam, Tamil Nadu 612001.
                      </p>
                    </div>
                    <p className="text-xs font-bold text-[#B12B2B] pt-2 border-t border-[#E8DDD0]/60">
                      Phone: +91 93452 20020
                    </p>
                  </div>

                  {/* Branch 3: Ariyalur */}
                  <div className="p-6 rounded-2xl bg-white border border-[#E8DDD0] shadow-2xs space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-red-100 text-[#B12B2B] flex items-center justify-center">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <h4 className="text-base font-bold text-[#2B2521]">Branch: Ariyalur</h4>
                      <p className="text-xs text-[#5C5148] leading-relaxed">
                        Mr. Perfect Gym, Ariyalur, Tamil Nadu.
                      </p>
                    </div>
                    <p className="text-xs font-bold text-[#B12B2B] pt-2 border-t border-[#E8DDD0]/60">
                      Phone: +91 93452 20020
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Terms and Conditions */}
            {offer.termsAndConditions && (
              <div className="p-6 rounded-2xl bg-white border border-[#E8DDD0] shadow-2xs space-y-2">
                <h4 className="text-xs font-bold text-[#2B2521] uppercase tracking-wider">
                  Campaign Terms & Enrollment Conditions
                </h4>
                <div className="text-xs text-[#5C5148] leading-relaxed whitespace-pre-line font-mono">
                  {offer.termsAndConditions}
                </div>
              </div>
            )}

            {/* Support Details */}
            <div className="p-6 rounded-2xl bg-white border border-[#E8DDD0] shadow-2xs flex flex-wrap items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-[#2B2521]">Need assistance with this offer?</h4>
                <p className="text-xs text-[#5C5148] mt-0.5">
                  Reach out directly to our academy admissions and treatment coordinators.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <a
                  href={`tel:${offer.supportPhone}`}
                  className="inline-flex items-center gap-1.5 text-[#B12B2B] hover:underline"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{offer.supportPhone}</span>
                </a>
                <span className="text-[#E8DDD0]">|</span>
                <a
                  href={`mailto:${offer.supportEmail}`}
                  className="inline-flex items-center gap-1.5 text-[#5C5148] hover:text-[#2B2521]"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{offer.supportEmail}</span>
                </a>
              </div>
            </div>

          </div>
        </section>

      </div>

      {/* REGISTRATION / ENQUIRY MODAL (Clean Site Warm UI) */}
      {isEnquiryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white text-[#2B2521] rounded-2xl border border-[#E8DDD0] shadow-2xl p-6 sm:p-7 overflow-hidden">
            
            <button
              onClick={() => {
                setIsEnquiryModalOpen(false);
                setEnquirySuccessData(null);
                setEnquiryError(null);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#8C7E72] hover:text-[#2B2521] hover:bg-gray-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {enquirySuccessData ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-green-50 text-emerald-700 flex items-center justify-center mx-auto border border-green-200">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold font-heading text-[#2B2521]">
                  Registration Confirmed!
                </h3>
                <p className="text-sm text-[#5C5148] leading-relaxed max-w-sm mx-auto">
                  Thank you, <strong>{enquirySuccessData.customerName}</strong>. Your registration for <strong>{offer.title}</strong> has been received.
                </p>
                <div className="p-3 rounded-xl bg-[#FAF6F0] border border-[#E8DDD0] inline-block font-mono text-xs text-[#2B2521] font-bold">
                  Ref No: {enquirySuccessData.bookingNumber}
                </div>
                <p className="text-xs text-[#8C7E72]">
                  Our academy team will contact you via phone / WhatsApp shortly to coordinate your schedule.
                </p>
                <button
                  onClick={() => {
                    setIsEnquiryModalOpen(false);
                    setEnquirySuccessData(null);
                  }}
                  className="mt-3 px-6 py-2.5 rounded-xl bg-[#B12B2B] hover:bg-[#8F1E1E] text-white font-bold text-xs shadow transition cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleEnquirySubmit} className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold tracking-widest uppercase text-[#B12B2B]">
                    Direct Registration & Booking
                  </span>
                  <h3 className="text-xl font-bold font-heading text-[#2B2521] mt-0.5">
                    {offer.title}
                  </h3>
                  <p className="text-xs text-[#5C5148] mt-1">
                    Fill in your contact details below to reserve your slot at the promotional rate.
                  </p>
                </div>

                {enquiryError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{enquiryError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#2B2521] mb-1">
                    Full Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={enquiryName}
                    onChange={(e) => setEnquiryName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8DDD0] text-[#2B2521] text-sm focus:outline-none focus:border-[#B12B2B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2B2521] mb-1">
                    Phone / WhatsApp Number <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={enquiryPhone}
                    onChange={(e) => setEnquiryPhone(e.target.value)}
                    placeholder="+91 93452 20020"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8DDD0] text-[#2B2521] text-sm focus:outline-none focus:border-[#B12B2B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2B2521] mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={enquiryEmail}
                    onChange={(e) => setEnquiryEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8DDD0] text-[#2B2521] text-sm focus:outline-none focus:border-[#B12B2B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2B2521] mb-1">
                    Preferred Branch / Location
                  </label>
                  <select
                    value={enquiryBranch}
                    onChange={(e) => setEnquiryBranch(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8DDD0] text-[#2B2521] text-sm focus:outline-none focus:border-[#B12B2B]"
                  >
                    <option value="Thanjavur">Thanjavur (Headquarters)</option>
                    <option value="Kumbakonam">Kumbakonam Branch</option>
                    <option value="Ariyalur">Ariyalur Branch</option>
                    <option value="Online">Online Consultation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2B2521] mb-1">
                    Notes or Health Concerns (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={enquiryNotes}
                    onChange={(e) => setEnquiryNotes(e.target.value)}
                    placeholder="Describe any pain points, fitness goals, or session queries..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8DDD0] text-[#2B2521] text-sm focus:outline-none focus:border-[#B12B2B] resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={enquirySubmitting}
                    style={{ backgroundColor: primaryBrandColor }}
                    className="w-full py-3 rounded-xl text-white font-bold text-xs sm:text-sm tracking-wide shadow-md hover:brightness-110 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{enquirySubmitting ? 'Submitting...' : 'Confirm Registration'}</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </>
  );
};
