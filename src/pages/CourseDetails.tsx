import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { CurriculumAccordion } from '../components/courses/CurriculumAccordion';
import { CourseCard } from '../components/courses/CourseCard';
import { 
  Clock, Award, Play, ChevronRight, Share2, 
  BarChart, Users, Phone, Check, Copy, CheckCheck, Loader2, Star
} from 'lucide-react';
import { courseApi } from '../lib/api/courseApi';
import { paymentApi } from '../lib/api/paymentApi';
import { enrollmentApi } from '../lib/api/enrollmentApi';
import { loadRazorpayScript } from '../lib/razorpay';
import { useAuth } from '../context/AuthContext';
import type { Course } from '../types';

type PaymentStep = 'IDLE' | 'CREATING' | 'CHECKOUT_OPEN' | 'VERIFYING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';

export const CourseDetails: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(() => {
    if (!slug) return null;
    const cached = courseApi.getCachedCourses();
    return cached.find(c => c.slug === slug || c.id === slug) || null;
  });
  const [relatedCourses, setRelatedCourses] = useState<Course[]>(() => courseApi.getCachedCourses());
  const [loading, setLoading] = useState<boolean>(() => {
    if (!slug) return true;
    const cached = courseApi.getCachedCourses();
    return !cached.some(c => c.slug === slug || c.id === slug);
  });
  const [error, setError] = useState('');
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('IDLE');
  const [copied, setCopied] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);


  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        if (slug) {
          const courseData = await courseApi.getCourseBySlug(slug);
          if (courseData) {
            setCourse(courseData);
          }
        }
        const allCourses = await courseApi.getCourses();
        if (allCourses && allCourses.length > 0) {
          setRelatedCourses(allCourses);
        }
      } catch (err: any) {
        if (!course) {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchCourseData();
  }, [slug]);


  const getButtonText = () => {
    if (!course) return '';
    if (course.isAvailable === false) return 'Currently Unavailable';
    if (course.isFree) return 'Enroll for Free Now';
    switch (paymentStep) {
      case 'CREATING':
        return 'Preparing secure payment...';
      case 'CHECKOUT_OPEN':
        return 'Complete payment securely';
      case 'VERIFYING':
        return 'Verifying payment...';
      case 'SUCCESS':
        return 'Payment successful';
      case 'FAILED':
        return 'Payment failed — Try Again';
      case 'CANCELLED':
        return 'Payment cancelled — Pay Again';
      case 'IDLE':
      default:
        return `Pay ₹${course.price.toLocaleString('en-IN')}`;
    }
  };

  const handleEnrollClick = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    
    if (!course) return;

    // Block new enrollments while the course is marked unavailable
    if (course.isAvailable === false) {
      alert('This course is currently unavailable for new enrollments. Please check back soon.');
      return;
    }
    
    if (user?.enrolledCourses?.includes(course.id)) {
      navigate(`/learn/${course.id}`);
      return;
    }

    let pollTimer: any = null;
    const stopPolling = () => {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    };

    try {
      setPaymentStep('CREATING');
      if (course.isFree) {
        const res = await enrollmentApi.enrollFree(course.id);
        if (res.success) {
          setPaymentStep('SUCCESS');
          navigate(`/learn/${course.id}`);
        } else {
          setPaymentStep('FAILED');
          alert(res.error?.message || 'Failed to enroll');
        }
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setPaymentStep('FAILED');
        alert('Failed to load Razorpay payment gateway. Please check your internet connection.');
        return;
      }

      // 1. Create order on backend (authoritative course price from DB)
      const orderRes = await paymentApi.createOrder(course.id);
      if (!orderRes.success || !orderRes.data) {
        setPaymentStep('FAILED');
        const errorMsg = (orderRes as any).error?.message || 'Failed to initiate Razorpay order';
        alert(errorMsg);
        return;
      }

      const { keyId, orderId, amount, currency, prefill } = orderRes.data;

      // 2. Configure Razorpay Standard Checkout
      const options = {
        key: keyId,
        amount,
        currency: currency || 'INR',
        name: 'JADMAA Varmakalai',
        description: course.title,
        ...(typeof window !== 'undefined' && window.location.protocol === 'https:'
          ? { image: `${window.location.origin}/logo.png` }
          : {}),
        order_id: orderId,
        // Clean the contact number by removing spaces. Razorpay SDK can drop UPI if contact is malformed.
        prefill: {
          name: prefill?.name || user?.name || '',
          email: prefill?.email || user?.email || '',
          contact: (prefill?.contact || '').replace(/[^0-9+]/g, ''),
        },
        theme: {
          color: '#B12B2B',
          backdrop_color: 'rgba(0, 0, 0, 0.65)',
        },
        modal: {
          backdropclose: false,
          escape: true,
          ondismiss: () => {
            stopPolling();
            setPaymentStep('CANCELLED');
          },
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          stopPolling();
          try {
            setPaymentStep('VERIFYING');
            const verifyRes = await paymentApi.verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
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
        },
      };

      // 3. Start background polling (for desktop QR scanning or if user pays in external app)
      const startTime = Date.now();
      pollTimer = setInterval(async () => {
        // Stop polling after 5 minutes
        if (Date.now() - startTime > 5 * 60 * 1000) {
          stopPolling();
          return;
        }
        try {
          const statusRes = await paymentApi.checkStatus(orderId);
          if (statusRes.success && statusRes.data?.status === 'SUCCESS') {
            stopPolling();
            setPaymentStep('SUCCESS');
            navigate(`/payment/status/${orderId}?status=success`);
          } else if (
            statusRes.success &&
            (statusRes.data?.status === 'FAILED' || statusRes.data?.status === 'CANCELLED')
          ) {
            stopPolling();
            setPaymentStep('FAILED');
          }
        } catch (_) {}
      }, 2500);

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (failResponse: any) => {
        stopPolling();
        console.error('Payment failed:', failResponse.error);
        setPaymentStep('FAILED');
        alert(`Payment Failed: ${failResponse.error?.description || 'Transaction unsuccessful'}`);
      });

      setPaymentStep('CHECKOUT_OPEN');
      rzp.open();
    } catch (err: any) {
      stopPolling();
      console.error('Checkout error:', err);
      setPaymentStep('FAILED');
      alert(err?.message || 'An error occurred during checkout');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-sans text-jadmaa-textMuted">Loading course details...</div>;
  }

  if (error || !course) {
    return <div className="min-h-screen flex items-center justify-center font-sans text-red-500">Error loading course: {error || 'Not found'}</div>;
  }

  // Format clean title without trailing pipe tags if needed
  const displayTitle = course.title.includes('|') 
    ? course.title.split('|')[0].trim() 
    : course.title;

  const aasanDisplayName = course.instructor.name?.toLowerCase().startsWith('aasan')
    ? course.instructor.name
    : `Aasan - ${course.instructor.name}`;

  const isEnrolled = !!(user?.enrolledCourses?.includes(course.id));

  return (
    <>
      <SEO 
        title={`${course.title} | JADMAA Varmakalai`}
        description={course.description}
      />

      {/* Main Container mirroring jadmaa.com Tutor LMS single course layout */}
      <div className="bg-[#FAF8F5] min-h-screen py-8 md:py-12 text-[#212327] font-sans">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
          
          {/* Breadcrumb Trail */}
          <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs md:text-sm text-[#706B65] mb-6">
            <Link to="/" className="hover:text-jadmaa-red transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#BDB9B4]" />
            <Link to="/courses" className="hover:text-jadmaa-red transition-colors">Courses</Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#BDB9B4]" />
            <span className="text-[#212327] font-medium truncate max-w-xs sm:max-w-md md:max-w-lg">
              {displayTitle}
            </span>
          </nav>

          {/* Course Details Header */}
          <header className="mb-8 md:mb-10 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#B12B2B]/10 text-[#B12B2B] border border-[#B12B2B]/20">
                {course.category}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-[#374151] border border-gray-200">
                Level: {course.level || 'Beginner'}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                <span>4.9</span>
                <span className="text-amber-700/70 font-normal">({course.reviewCount || 48} reviews)</span>
              </span>
              {course.isFree && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  FREE STARTER
                </span>
              )}
            </div>

            <h1 className="font-heading font-semibold text-2xl sm:text-3xl lg:text-4xl text-[#111827] leading-tight">
              {displayTitle}
            </h1>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2 border-b border-[#E5E2DC] pb-5">
              <div className="flex items-center gap-3 text-sm text-[#4B5563]">
                <div className="w-8 h-8 rounded-full bg-[#B12B2B] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {course.instructor.name?.charAt(0) || 'M'}
                </div>
                <span>
                  Taught by <strong className="text-[#1F2937]">{aasanDisplayName}</strong>
                </span>
              </div>

              {/* Actions: Share */}
              <div className="flex items-center space-x-3 text-xs md:text-sm">
                <button 
                  onClick={() => setIsShareModalOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg border border-[#D5D0C7] hover:border-jadmaa-red text-[#4A443D] hover:text-jadmaa-red bg-white shadow-sm transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="font-medium">Share Course</span>
                </button>
              </div>
            </div>
          </header>

          {/* Two-Column Grid: Main Content (8 cols) & Sticky Purchase Sidebar (4 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Left Column: Media & Editorial Content (8 cols) */}
            <main className="lg:col-span-8 space-y-8">
              
              {/* Course Featured Banner / Video Frame */}
              <div className="relative rounded-2xl overflow-hidden aspect-[16/9] bg-black shadow-lg border border-[#E5E2DC] group">
                <img 
                  src={course.thumbnail || '/images/course-basic.jpg'} 
                  alt={displayTitle}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/35 flex items-center justify-center backdrop-blur-[1px]">
                  <button 
                    onClick={handleEnrollClick}
                    className="w-16 h-16 rounded-full bg-[#B12B2B] hover:bg-[#8E1C1C] text-white flex items-center justify-center shadow-2xl transition-transform hover:scale-110 ring-4 ring-white/30"
                    aria-label="Preview Course"
                  >
                    <Play className="w-7 h-7 fill-current ml-1" />
                  </button>
                </div>
              </div>

              {/* Quick Course Highlights Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white rounded-xl p-3.5 border border-[#E8DDD0] shadow-sm flex flex-col items-start">
                  <div className="flex items-center gap-1.5 text-xs text-[#B12B2B] font-semibold mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Duration</span>
                  </div>
                  <span className="font-heading font-bold text-sm sm:text-base text-[#111827]">
                    {course.duration || '3 Months'}
                  </span>
                </div>

                <div className="bg-white rounded-xl p-3.5 border border-[#E8DDD0] shadow-sm flex flex-col items-start">
                  <div className="flex items-center gap-1.5 text-xs text-[#B12B2B] font-semibold mb-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>Age Group</span>
                  </div>
                  <span className="font-heading font-bold text-sm sm:text-base text-[#111827]">
                    10+ Years
                  </span>
                </div>

                <div className="bg-white rounded-xl p-3.5 border border-[#E8DDD0] shadow-sm flex flex-col items-start">
                  <div className="flex items-center gap-1.5 text-xs text-[#B12B2B] font-semibold mb-1">
                    <Award className="w-3.5 h-3.5" />
                    <span>Certificate</span>
                  </div>
                  <span className="font-heading font-bold text-sm sm:text-base text-[#111827]">
                    Verified JADMAA
                  </span>
                </div>

                <div className="bg-white rounded-xl p-3.5 border border-[#E8DDD0] shadow-sm flex flex-col items-start">
                  <div className="flex items-center gap-1.5 text-xs text-[#B12B2B] font-semibold mb-1">
                    <BarChart className="w-3.5 h-3.5" />
                    <span>Access</span>
                  </div>
                  <span className="font-heading font-bold text-sm sm:text-base text-[#111827]">
                    Lifetime
                  </span>
                </div>
              </div>

              {/* Main Course Editorial Content */}
              <article className="bg-white rounded-2xl p-6 sm:p-8 md:p-10 shadow-sm border border-[#E5E2DC] space-y-8 text-[#334155] leading-relaxed">
                
                {/* Intro Overview */}
                <div className="space-y-4">
                  <p className="text-base sm:text-lg text-[#334155] leading-relaxed font-normal">
                    {course.description || `${displayTitle} is where almost every JADMAA student begins. Over the course period you build the physical base, the movement vocabulary and the discipline that everything else in Varmakalai rests on. No prior martial arts experience is expected — most people who join this course have never trained in anything before.`}
                  </p>
                </div>

                {/* Section: What Varmakalai actually is */}
                <div className="space-y-4 pt-4 border-t border-[#EFECE6]">
                  <h2 className="font-heading font-bold text-xl sm:text-2xl text-[#111827]">
                    What Varmakalai actually is
                  </h2>
                  <p className="text-base sm:text-lg text-[#334155] leading-relaxed">
                    Varmakalai is a Tamil martial and healing tradition built around the <em>varmam</em> — the vital points of the human body. The same knowledge that lets a trained hand disable an attacker is the knowledge that lets it relieve pain and restore function. That double nature is why Varmakalai was traditionally taught slowly, and why a student is never handed technique before they have earned the control to use it safely.
                  </p>
                  <p className="text-base sm:text-lg text-[#334155] leading-relaxed">
                    This course teaches the foundation of that system. You will not be striking varmam points in your first three months, and you should be cautious of anyone who offers to teach you that on day one.
                  </p>
                </div>

                {/* Section: What you will learn */}
                <div className="space-y-4 pt-4 border-t border-[#EFECE6]">
                  <h2 className="font-heading font-bold text-xl sm:text-2xl text-[#111827]">
                    What you will learn
                  </h2>
                  <ul className="space-y-3.5 text-base sm:text-lg text-[#334155] pl-1">
                    <li className="flex items-start space-x-3">
                      <span className="w-2 h-2 rounded-full bg-jadmaa-red mt-2.5 flex-shrink-0" />
                      <div>
                        <strong>Body conditioning</strong> — the joint mobility, flexibility and core strength Varmakalai movement demands. This is the part most beginners underestimate.
                      </div>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="w-2 h-2 rounded-full bg-jadmaa-red mt-2.5 flex-shrink-0" />
                      <div>
                        <strong>Basic stances and footwork</strong> — the positions from which every technique is delivered, and how to move between them without losing balance.
                      </div>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="w-2 h-2 rounded-full bg-jadmaa-red mt-2.5 flex-shrink-0" />
                      <div>
                        <strong>Hand techniques</strong> — fundamental strikes and blocks, drilled slowly until form holds under pressure.
                      </div>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="w-2 h-2 rounded-full bg-jadmaa-red mt-2.5 flex-shrink-0" />
                      <div>
                        <strong>Adavu fundamentals</strong> — the linked movement sequences that carry the tradition's technique from one generation to the next.
                      </div>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="w-2 h-2 rounded-full bg-jadmaa-red mt-2.5 flex-shrink-0" />
                      <div>
                        <strong>Breathing and focus</strong> — how breath governs power and recovery, taught the traditional way.
                      </div>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="w-2 h-2 rounded-full bg-jadmaa-red mt-2.5 flex-shrink-0" />
                      <div>
                        <strong>Training etiquette</strong> — how a student conducts themselves toward the Aasan, toward fellow students, and toward the art.
                      </div>
                    </li>
                  </ul>
                </div>

                {/* Section: Who this course suits */}
                <div className="space-y-4 pt-4 border-t border-[#EFECE6]">
                  <h2 className="font-heading font-bold text-xl sm:text-2xl text-[#111827]">
                    Who this course suits
                  </h2>
                  <p className="text-base sm:text-lg text-[#334155] leading-relaxed">
                    Beginners of any fitness level from age 10 upward. School and college students, working adults, and parents training alongside their children. If you have a current injury or a medical condition, tell your instructor before you begin — the training is adapted, not cancelled.
                  </p>
                </div>

                {/* Section: How the training runs */}
                <div className="space-y-4 pt-4 border-t border-[#EFECE6]">
                  <h2 className="font-heading font-bold text-xl sm:text-2xl text-[#111827]">
                    How the training runs
                  </h2>
                  <p className="text-base sm:text-lg text-[#334155] leading-relaxed">
                    Supervised sessions and structured curriculum, in small groups so that form is corrected individually. Progress is assessed continuously rather than by a single test, and students who complete the course receive a JADMAA certificate and become eligible for further training.
                  </p>
                </div>

                {/* Section: Before you enroll */}
                <div className="space-y-4 pt-4 border-t border-[#EFECE6]">
                  <h2 className="font-heading font-bold text-xl sm:text-2xl text-[#111827]">
                    Before you enroll
                  </h2>
                  <p className="text-base sm:text-lg text-[#334155] leading-relaxed">
                    If you would like to understand what you are signing up for first, our{' '}
                    <Link to="/courses/varmakalai-foundation-free-starter-course" className="text-jadmaa-red font-medium hover:underline">
                      free Varma Foundation course
                    </Link>{' '}
                    covers the history, the code of conduct and the basic stances at no cost. Many students take that first and then join Basic Varma Training with a clearer idea of what the practice asks of them.
                  </p>
                  
                  <div className="bg-[#FAF8F5] p-5 rounded-xl border border-[#E5E2DC] space-y-2 mt-4 text-sm md:text-base text-[#475569]">
                    <p>
                      <strong className="text-[#1E293B]">Branches:</strong> JADMAA centers in Thanjavur, Kumbakonam and Ariyalur.
                    </p>
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <strong className="text-[#1E293B]">Questions about batch timings or seats:</strong>
                      <a href="tel:+919345220020" className="text-jadmaa-red font-semibold hover:underline inline-flex items-center whitespace-nowrap">
                        <Phone className="w-3.5 h-3.5 mr-1" />
                        <span>+91 93452 20020</span>
                      </a>
                    </p>
                  </div>
                </div>

              </article>

              {/* Course Curriculum Modules & Lessons */}
              {course.modules && course.modules.length > 0 && (
                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#E5E2DC] space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#EFECE6]">
                    <div>
                      <h2 className="font-heading font-bold text-xl sm:text-2xl text-[#111827]">
                        Curriculum & Video Lessons
                      </h2>
                      <p className="text-xs md:text-sm text-[#706B65] mt-1">
                        {course.modules.length} modules • {course.totalLessons} lessons total
                      </p>
                    </div>
                    {isEnrolled && (
                      <Link 
                        to={`/learn/${course.id}`}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors inline-flex items-center space-x-1 self-start sm:self-auto"
                      >
                        <Play className="w-3.5 h-3.5 fill-current mr-1" />
                        <span>Go to Classroom</span>
                      </Link>
                    )}
                  </div>

                  <CurriculumAccordion modules={course.modules} />
                </div>
              )}

              {/* Aasan Profile Section */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#E5E2DC] space-y-6">
                <h2 className="font-heading font-bold text-xl sm:text-2xl text-[#111827]">
                  Aasan Profile
                </h2>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-5">
                  <img 
                    src={course.instructor.avatar || '/images/logo-1.png'} 
                    alt={course.instructor.name}
                    className="w-20 h-20 rounded-full border-2 border-jadmaa-red object-cover bg-white shadow-sm"
                  />
                  <div>
                    <h3 className="font-heading font-bold text-lg sm:text-xl text-[#111827]">
                      {aasanDisplayName}
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-jadmaa-red mt-0.5">
                      {course.instructor.title || 'Master & Founder, JADMAA Varmakalai'}
                    </p>
                    <p className="text-sm md:text-base text-[#475569] mt-2 leading-relaxed">
                      {course.instructor.bio || 'Dedicated to preserving, practicing, and passing down the authentic martial and therapeutic traditions of Varmakalai across Tamil Nadu.'}
                    </p>
                  </div>
                </div>
              </div>

            </main>

            {/* Right Column: Sticky Purchase & Enrollment Sidebar (4 cols) */}
            <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
              
              <div className="bg-white rounded-2xl p-6 md:p-7 shadow-lg border border-[#E0DCD5] space-y-6">
                
                {/* Price Display */}
                <div className="pb-4 border-b border-[#EFECE6]">
                  <p className="text-xs uppercase tracking-wider font-semibold text-[#8C847A]">Course Fee</p>
                  <div className="flex items-baseline space-x-2 mt-1">
                    <span className="font-heading font-extrabold text-3xl sm:text-4xl text-[#111827]">
                      {course.isFree ? 'Free' : `₹${course.price.toLocaleString('en-IN')}`}
                    </span>
                    {!course.isFree && (
                      <span className="text-xs text-[#706B65] font-medium">One-time payment</span>
                    )}
                  </div>
                </div>

                {/* Primary CTA Button (Razorpay Checkout) */}
                {isEnrolled ? (
                  <button
                    onClick={() => navigate(`/learn/${course.id}`)}
                    className="w-full py-4 px-6 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-base rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
                  >
                    <Check className="w-5 h-5 mr-1" />
                    <span>Already Enrolled — Go to Course</span>
                  </button>
                ) : (
                  <div>
                    <button
                      onClick={handleEnrollClick}
                      disabled={course.isAvailable === false || paymentStep === 'CREATING' || paymentStep === 'CHECKOUT_OPEN' || paymentStep === 'VERIFYING' || paymentStep === 'SUCCESS'}
                      className={`w-full py-4 px-6 text-white font-bold text-base rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 ${
                        course.isAvailable === false
                          ? 'bg-gray-400 cursor-not-allowed'
                          : paymentStep === 'SUCCESS'
                          ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                          : paymentStep === 'FAILED'
                          ? 'bg-amber-700 hover:bg-amber-800 cursor-pointer'
                          : paymentStep === 'CANCELLED'
                          ? 'bg-[#B12B2B] hover:bg-[#961F1F] cursor-pointer'
                          : 'bg-[#B12B2B] hover:bg-[#961F1F] cursor-pointer'
                      } disabled:opacity-85 disabled:cursor-wait`}
                    >
                      {(paymentStep === 'CREATING' || paymentStep === 'VERIFYING') && (
                        <Loader2 className="w-5 h-5 animate-spin mr-2 flex-shrink-0" />
                      )}
                      {paymentStep === 'SUCCESS' && (
                        <Check className="w-5 h-5 mr-2 flex-shrink-0" />
                      )}
                      <span>{getButtonText()}</span>
                    </button>
                    
                    {course.isAvailable === false && (
                      <div className="text-center text-xs text-[#5C5148] mt-3 leading-relaxed bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2">
                        This course is <strong>currently unavailable</strong> for new enrollments. Please check back soon or contact us for updates.
                      </div>
                    )}

                    {course.isAvailable !== false && !isLoggedIn && (
                      <div className="text-center text-xs text-[#5C5148] mt-3 leading-relaxed">
                        New student?{' '}
                        <Link to="/register" className="text-[#B12B2B] font-semibold hover:underline">
                          Create your free account
                        </Link>{' '}
                        — it only takes a minute.
                      </div>
                    )}
                  </div>
                )}

                {/* Course Quick Facts (Mirrors tutor-card-footer / Tutor LMS course highlights) */}
                <div className="space-y-3.5 pt-2 border-t border-[#EFECE6] text-sm text-[#475569]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-2 text-[#706B65]">
                      <BarChart className="w-4 h-4 text-jadmaa-red flex-shrink-0" />
                      <span>Level</span>
                    </span>
                    <span className="font-semibold text-[#111827]">{course.level || 'Beginner'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-2 text-[#706B65]">
                      <Clock className="w-4 h-4 text-jadmaa-red flex-shrink-0" />
                      <span>Duration</span>
                    </span>
                    <span className="font-semibold text-[#111827]">{course.duration || '3 Months'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-2 text-[#706B65]">
                      <Users className="w-4 h-4 text-jadmaa-red flex-shrink-0" />
                      <span>Language</span>
                    </span>
                    <span className="font-semibold text-[#111827]">Tamil & English</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-2 text-[#706B65]">
                      <Award className="w-4 h-4 text-jadmaa-red flex-shrink-0" />
                      <span>Certificate</span>
                    </span>
                    <span className="font-semibold text-[#111827]">Upon Completion</span>
                  </div>
                </div>

                {/* Trust and Help Card */}
                <div className="bg-[#FAF8F5] rounded-xl p-4 border border-[#E5E2DC] space-y-2 text-xs text-[#5C5148]">
                  <p className="font-semibold text-[#1E293B]">Need batch timings or assistance?</p>
                  <p>Speak directly to our academy coordinators:</p>
                  <a 
                    href="tel:+919345220020" 
                    className="font-bold text-jadmaa-red text-sm flex items-center space-x-1.5 hover:underline pt-1"
                  >
                    <Phone className="w-4 h-4" />
                    <span>+91 93452 20020</span>
                  </a>
                </div>

              </div>

            </aside>

          </div>

          {/* Related Courses Section */}
          <section className="mt-16 pt-12 border-t border-[#E5E2DC]">
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-[#111827] mb-8">
              Related Varmakalai Programs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedCourses
                .filter(c => c.id !== course.id)
                .slice(0, 3)
                .map(related => (
                  <CourseCard key={related.id} course={related} />
                ))}
            </div>
          </section>

        </div>
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-heading font-bold text-xl text-[#111827]">Share Course</h3>
              <button 
                onClick={() => setIsShareModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
              >
                &times;
              </button>
            </div>

            <p className="text-sm text-gray-600">Copy the course page link below:</p>

            <div className="flex items-center space-x-2">
              <input 
                type="text" 
                readOnly 
                value={window.location.href}
                className="w-full text-xs font-mono bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-gray-700 outline-none select-all"
              />
              <button 
                onClick={handleCopyLink}
                className="px-4 py-2.5 bg-jadmaa-red hover:bg-jadmaa-redDark text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 transition-colors"
              >
                {copied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button 
                onClick={() => setIsShareModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
