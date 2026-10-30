import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { SEO } from '../../components/common/SEO';
import { offerApi } from '../../lib/api/offerApi';
import type { PublicOfferDetails } from '../../lib/api/offerApi';
import { loadRazorpayScript } from '../../lib/razorpay';
import { useAuth } from '../../context/AuthContext';
import {
  PremiumCampaignLandingPage,
  adaptOfferToCampaignData,
} from '../../components/campaigns';
import {
  AlertTriangle, Check, Copy, X, Send,
  BookOpen, ChevronDown, ChevronUp, Play
} from 'lucide-react';

export const OfferLandingPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();

  const [offer, setOffer] = useState<PublicOfferDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setPaymentStep] = useState<'IDLE' | 'PROCESSING' | 'VERIFYING' | 'SUCCESS' | 'FAILED'>('IDLE');
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
          if (res.data.category === 'ONLINE_COURSE') {
            setEnquiryBranch('Online');
          } else if (res.data.branchLocation) {
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Online Course Razorpay Payment Flow
  const handleCourseBooking = async () => {
    if (!offer || !offer.isBookable) {
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
          color: offer.primaryColor || '#A91414',
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

  // Secondary Action Handler
  const handleSecondaryAction = () => {
    if (!offer) return;
    if (offer.secondaryCtaUrl) {
      if (offer.secondaryCtaUrl.startsWith('http')) {
        window.open(offer.secondaryCtaUrl, '_blank');
      } else {
        navigate(offer.secondaryCtaUrl);
      }
    } else if (offer.course) {
      navigate(`/courses/${offer.course.id}`);
    } else {
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
        setEnquirySuccessData({
          bookingNumber: res.data.bookingNumber,
          customerName: res.data.customerName || enquiryName
        });
      } else {
        setEnquiryError(res.error?.message || 'Failed to submit registration. Please try again.');
      }
    } catch (err: any) {
      setEnquiryError(err.message || 'An error occurred while submitting your enquiry.');
    } finally {
      setEnquirySubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F4EB] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#A91414] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#6B3C2B]">
            Loading JADMAA Campaign...
          </span>
        </div>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="min-h-[75vh] bg-[#F8F4EB] flex items-center justify-center p-4 text-center">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-[#D9C4A8] space-y-5 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-[#A91414] flex items-center justify-center mx-auto border border-red-200">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold font-serif text-[#17120E]">
            Campaign Unavailable
          </h2>
          <p className="text-sm text-[#5C5148] leading-relaxed">
            {error || 'This promotional offer has expired or is currently not active.'}
          </p>
          <div className="pt-2">
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#A91414] hover:bg-[#7E1515] text-white font-bold text-xs shadow-md transition cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Browse All Courses &amp; Programs</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isExpired = offer.computedStatus === 'EXPIRED';
  const campaignData = adaptOfferToCampaignData(offer);

  return (
    <>
      <SEO
        title={`${offer.title} | JADMAA Varmakalai Campaign`}
        description={offer.shortDescription || offer.description}
        image={campaignData.heroImage}
        url={`/offers/${offer.slug}`}
      />

      <div className="min-h-screen bg-[#F8F4EB] text-[#17120E] flex flex-col">
        {/* Navigation / Share Top-Bar */}
        <div className="bg-[#F8F4EB] border-b border-[#EAD8BD]">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between text-xs">
            <nav className="flex items-center gap-2 text-[#6B3C2B] truncate pr-4">
              <Link to="/" className="hover:text-[#A91414] transition font-semibold">Home</Link>
              <span>/</span>
              <Link to="/courses" className="hover:text-[#A91414] transition">Campaigns</Link>
              <span>/</span>
              <span className="font-bold text-[#17120E] truncate">{offer.title}</span>
            </nav>

            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-white border border-[#D9C4A8] hover:bg-gray-50 text-[#17120E] text-xs font-bold transition shrink-0 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-700" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Link Copied!' : 'Share Campaign'}</span>
            </button>
          </div>
        </div>

        {/* Expired Campaign Announcement Bar */}
        {isExpired && (
          <div className="bg-amber-100 border-b border-amber-300 px-4 py-2 text-center text-amber-900 text-xs font-bold flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>This promotional campaign has concluded. Special promotional registrations are now closed.</span>
          </div>
        )}

        {/* MASTER REUSABLE PREMIUM CAMPAIGN LANDING PAGE */}
        <PremiumCampaignLandingPage
          campaign={campaignData}
          onPrimaryAction={handlePrimaryAction}
          onSecondaryAction={handleSecondaryAction}
        />

        {/* ONLINE COURSE CURRICULUM PREVIEW (Optional Accordion if tied to a course) */}
        {offer.category === 'ONLINE_COURSE' && offer.course && offer.course.modules && offer.course.modules.length > 0 && (
          <section className="bg-[#FAF6F0] border-t border-[#E8DDD0] py-14 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-10">
                <span className="text-xs font-bold tracking-widest uppercase text-[#B12B2B]">
                  Included Curriculum
                </span>
                <h2 className="text-2xl sm:text-3xl font-black font-serif text-[#17120E] mt-1">
                  What You Will Learn in This Course
                </h2>
                <p className="text-sm text-[#5C5148] mt-2">
                  Complete syllabus included with lifetime access upon enrolment.
                </p>
              </div>

              <div className="space-y-3">
                {offer.course.modules.map((mod: any, idx: number) => {
                  const isOpen = openModuleIndex === idx;
                  return (
                    <div
                      key={mod.id || idx}
                      className="rounded-xl border border-[#E8DDD0] bg-white overflow-hidden shadow-2xs"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenModuleIndex(isOpen ? null : idx)}
                        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50/70 transition cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg bg-red-50 text-[#A91414] font-bold text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-bold text-sm text-[#17120E] block">{mod.title}</span>
                            {mod.lessons && (
                              <span className="text-xs text-[#7D332B]">
                                {mod.lessons.length} {mod.lessons.length === 1 ? 'lesson' : 'lessons'}
                              </span>
                            )}
                          </div>
                        </div>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                      </button>

                      {isOpen && mod.lessons && mod.lessons.length > 0 && (
                        <div className="px-5 pb-4 pt-1 border-t border-gray-100 space-y-2">
                          {mod.lessons.map((lesson: any, lIdx: number) => (
                            <div key={lesson.id || lIdx} className="flex items-center justify-between text-xs py-1.5 text-gray-700">
                              <div className="flex items-center gap-2">
                                <Play className="w-3.5 h-3.5 text-[#A91414]" />
                                <span>{lesson.title}</span>
                              </div>
                              {lesson.duration && <span className="text-gray-400 text-[11px] font-mono">{lesson.duration}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="text-center mt-8">
                <button
                  type="button"
                  onClick={handlePrimaryAction}
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#A91414] text-white font-bold rounded-lg hover:bg-[#7E1515] transition shadow-md cursor-pointer"
                >
                  <span>{campaignData.primaryCtaText}</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* REGISTRATION / ENQUIRY MODAL (For Treatments, Offline Classes, Camps, Events) */}
        {isEnquiryModalOpen && (
          <div className="campaign-modal-overlay">
            <div className="campaign-modal-content">
              <button
                type="button"
                onClick={() => {
                  setIsEnquiryModalOpen(false);
                  setEnquirySuccessData(null);
                  setEnquiryError(null);
                }}
                className="campaign-modal-close"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>

              {enquirySuccessData ? (
                <div className="campaign-modal-success">
                  <div className="campaign-modal-success-badge">
                    <Check className="w-8 h-8" />
                  </div>
                  <h3 className="campaign-modal-title">
                    Registration Confirmed!
                  </h3>
                  <p className="campaign-modal-subtitle">
                    Thank you, <strong>{enquirySuccessData.customerName}</strong>. Your session request has been securely recorded.
                  </p>
                  <div className="my-5 p-4 rounded bg-[#EAD8BD]/40 border border-[#D9C4A8] text-center">
                    <span className="block text-[11px] font-bold text-[#6B3C2B] uppercase tracking-wider">
                      Your Reference Number
                    </span>
                    <strong className="block text-2xl font-mono text-[#A91414] mt-1">
                      {enquirySuccessData.bookingNumber}
                    </strong>
                  </div>
                  <p className="text-xs text-[#5C5148] leading-relaxed mb-6">
                    Our senior master / coordinator will contact you via WhatsApp/Phone shortly with appointment timings and session instructions.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEnquiryModalOpen(false);
                      setEnquirySuccessData(null);
                    }}
                    className="campaign-modal-submit"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <div className="campaign-modal-header">
                    <span className="campaign-modal-category">
                      {campaignData.category}
                    </span>
                    <h3 className="campaign-modal-title">
                      {campaignData.primaryCtaText}
                    </h3>
                    <p className="campaign-modal-subtitle">
                      Complete your details below to register for this special campaign.
                    </p>
                  </div>

                  <form onSubmit={handleEnquirySubmit}>
                    {enquiryError && (
                      <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                        <span>{enquiryError}</span>
                      </div>
                    )}

                    <div className="campaign-form-group">
                      <label className="campaign-form-label">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={enquiryName}
                        onChange={(e) => setEnquiryName(e.target.value)}
                        placeholder="Your full name"
                        className="campaign-form-input"
                      />
                    </div>

                    <div className="campaign-form-group">
                      <label className="campaign-form-label">
                        Phone / WhatsApp Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={enquiryPhone}
                        onChange={(e) => setEnquiryPhone(e.target.value)}
                        placeholder="+91 93452 20020"
                        className="campaign-form-input"
                      />
                    </div>

                    <div className="campaign-form-group">
                      <label className="campaign-form-label">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        value={enquiryEmail}
                        onChange={(e) => setEnquiryEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        className="campaign-form-input"
                      />
                    </div>

                    {offer.category !== 'ONLINE_COURSE' && (
                      <div className="campaign-form-group">
                        <label className="campaign-form-label">
                          Preferred Academy Branch
                        </label>
                        <select
                          value={enquiryBranch}
                          onChange={(e) => setEnquiryBranch(e.target.value)}
                          className="campaign-form-select"
                        >
                          <option value="Thanjavur">Thanjavur (Headquarters)</option>
                          <option value="Kumbakonam">Kumbakonam Branch</option>
                          <option value="Ariyalur">Ariyalur Branch</option>
                        </select>
                      </div>
                    )}

                    <div className="campaign-form-group">
                      <label className="campaign-form-label">
                        Notes or Specific Requirements (Optional)
                      </label>
                      <textarea
                        rows={2}
                        value={enquiryNotes}
                        onChange={(e) => setEnquiryNotes(e.target.value)}
                        placeholder="Describe your health goals, preferred dates, or query..."
                        className="campaign-form-textarea resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={enquirySubmitting}
                      className="campaign-modal-submit"
                    >
                      <Send className="w-4 h-4" />
                      <span>{enquirySubmitting ? 'Submitting Registration...' : 'Confirm Registration'}</span>
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
