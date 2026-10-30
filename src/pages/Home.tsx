import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { CourseCard } from '../components/courses/CourseCard';
import { mockTestimonials } from '../data/testimonials';
import { mockBranches } from '../data/branches';
import { CheckCircle2, ArrowRight, Star, MapPin, HeartPulse, Shield, Award, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { courseApi } from '../lib/api/courseApi';
import type { Course } from '../types';
import { reviewsApi, type Testimonial } from '../lib/api/reviewsApi';
import { CountUp } from '../components/common/CountUp';
import { EditableText } from '../components/common/EditableText';
import { ResponsiveImage } from '../components/common/ResponsiveImage';
import { useSettings } from '../context/SettingsContext';

export const Home: React.FC = () => {
  const { settings, isEditing } = useSettings();

  // Read stats from settings with rock-solid defaults matching JADMAA tradition
  const traditionValue = parseInt(settings['home.stats.tradition.value'] || '1000', 10) || 1000;
  const branchesValue = parseInt(settings['home.stats.branches.value'] || '3', 10) || 3;
  const coursesValue = parseInt(settings['home.stats.courses.value'] || '7', 10) || 7;
  const experienceValue = parseInt(settings['home.stats.experience.value'] || '10', 10) || 10;

  const [featuredCourses, setFeaturedCourses] = useState<Course[]>(() => {
    const cached = courseApi.getCachedCourses();
    return cached.length > 0 ? cached : [];
  });
  const [loading, setLoading] = useState(() => courseApi.getCachedCourses().length === 0);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(() => mockTestimonials as any);

  // Featured Courses Carousel State
  const coursesTrackRef = React.useRef<HTMLDivElement>(null);
  const [coursesDirection, setCoursesDirection] = useState<'left' | 'right'>('right');
  const [coursesPaused, setCoursesPaused] = useState<boolean>(false);
  const [isCoursesDragging, setIsCoursesDragging] = useState<boolean>(false);
  const coursesDragStart = React.useRef<{ startX: number; scrollLeft: number }>({ startX: 0, scrollLeft: 0 });

  // Testimonials Carousel State
  const testimonialsTrackRef = React.useRef<HTMLDivElement>(null);
  const [testimonialsPaused, setTestimonialsPaused] = useState<boolean>(false);
  const [isTestimonialsDragging, setIsTestimonialsDragging] = useState<boolean>(false);
  const testimonialsDragStart = React.useRef<{ startX: number; scrollLeft: number }>({ startX: 0, scrollLeft: 0 });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await courseApi.getCourses();
        if (data && data.length > 0) {
          setFeaturedCourses(data);
          setCoursesError(null);
        } else if (featuredCourses.length === 0) {
          setFeaturedCourses([]);
        }
      } catch (err: any) {
        console.error('Failed to fetch courses', err);
        if (featuredCourses.length === 0) {
          setCoursesError(err?.message || 'Failed to load courses');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
    const fetchTestimonials = async () => {
      try {
        const data = await reviewsApi.getReviews();
        if (data && data.length > 0) {
          setTestimonials(data);
        }
      } catch (err) {
        console.warn('Failed to fetch dynamic testimonials, using default', err);
      }
    };
    fetchTestimonials();
  }, []);

  // Finite ping-pong smooth auto-scroll animation loop for Featured Courses
  useEffect(() => {
    const el = coursesTrackRef.current;
    if (!el) return;

    let animId: number;
    let pauseTimeout: ReturnType<typeof setTimeout> | null = null;
    let isPausedAtEdge = false;
    const speed = 0.8; // pixels per frame

    const step = () => {
      if (!coursesPaused && !isCoursesDragging && !isPausedAtEdge && el) {
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (maxScroll > 10) {
          if (coursesDirection === 'right') {
            el.scrollLeft += speed;
            if (el.scrollLeft >= maxScroll - 2) {
              isPausedAtEdge = true;
              pauseTimeout = setTimeout(() => {
                setCoursesDirection('left');
                isPausedAtEdge = false;
              }, 1500);
            }
          } else {
            el.scrollLeft -= speed;
            if (el.scrollLeft <= 2) {
              isPausedAtEdge = true;
              pauseTimeout = setTimeout(() => {
                setCoursesDirection('right');
                isPausedAtEdge = false;
              }, 1500);
            }
          }
        }
      }
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(animId);
      if (pauseTimeout) clearTimeout(pauseTimeout);
    };
  }, [coursesDirection, coursesPaused, isCoursesDragging, featuredCourses]);

  // Continuous seamless infinite auto-scroll loop for Testimonials (Right to Left: 1 to N)
  useEffect(() => {
    const el = testimonialsTrackRef.current;
    if (!el) return;

    let animId: number;
    const speed = 0.85; // pixels per frame

    const step = () => {
      if (!testimonialsPaused && !isTestimonialsDragging && el) {
        el.scrollLeft += speed;
        // When scrolled past one full set of reviews, seamlessly offset back
        const segmentWidth = el.scrollWidth / 3;
        if (segmentWidth > 0 && el.scrollLeft >= segmentWidth) {
          el.scrollLeft -= segmentWidth;
        }
      }
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [testimonialsPaused, isTestimonialsDragging, testimonials]);

  // Window-level mouse drag handling for Courses track (finite clamped scroll)
  useEffect(() => {
    if (!isCoursesDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const el = coursesTrackRef.current;
      if (!el) return;
      e.preventDefault();
      const maxScroll = el.scrollWidth - el.clientWidth;
      const walk = (e.pageX - coursesDragStart.current.startX) * 1.5;
      el.scrollLeft = Math.max(0, Math.min(maxScroll, coursesDragStart.current.scrollLeft - walk));
    };

    const handleMouseUp = () => {
      setIsCoursesDragging(false);
      setCoursesPaused(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isCoursesDragging]);

  // Window-level mouse drag handling for Testimonials track (infinite wrap)
  useEffect(() => {
    if (!isTestimonialsDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const el = testimonialsTrackRef.current;
      if (!el) return;
      e.preventDefault();
      const walk = (e.pageX - testimonialsDragStart.current.startX) * 1.5;
      el.scrollLeft = testimonialsDragStart.current.scrollLeft - walk;
      const segmentWidth = el.scrollWidth / 3;
      if (segmentWidth > 0) {
        if (el.scrollLeft >= segmentWidth * 2) el.scrollLeft -= segmentWidth;
        if (el.scrollLeft < 0) el.scrollLeft += segmentWidth;
      }
    };

    const handleMouseUp = () => {
      setIsTestimonialsDragging(false);
      setTestimonialsPaused(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isTestimonialsDragging]);

  // Manual roll helpers for Courses
  const scrollCoursesBy = (delta: number, newDirection?: 'left' | 'right') => {
    if (newDirection) setCoursesDirection(newDirection);
    if (coursesTrackRef.current) {
      coursesTrackRef.current.scrollBy({ left: delta, behavior: 'smooth' });
    }
  };

  // Manual roll helpers for Testimonials
  const scrollTestimonialsBy = (delta: number) => {
    if (testimonialsTrackRef.current) {
      testimonialsTrackRef.current.scrollBy({ left: delta, behavior: 'smooth' });
    }
  };

  const wellnessServices = [
    {
      icon: HeartPulse,
      title: 'Pain Management',
      items: ['Neck Pain', 'Shoulder Pain', 'Upper & Lower Back Pain', 'Knee & Joint Pain', 'Muscle Tightness', 'Sports-related Discomfort'],
    },
    {
      icon: Shield,
      title: 'Mobility & Recovery',
      items: ['Muscle Relaxation', 'Joint Mobility Improvement', 'Posture Assessment', 'Movement Restoration', 'Flexibility Enhancement', 'Rehabilitation Support'],
    },
    {
      icon: Award,
      title: 'Wellness Care',
      items: ['Stress Relief', 'Relaxation Therapy', 'Fatigue Management', 'Sleep Wellness Support', 'Body Balance Therapy'],
    },
    {
      icon: Users,
      title: 'Traditional Varma Care',
      items: ['Traditional Varma Assessment', 'Manual Varma Techniques', 'Traditional Therapeutic Methods', 'Preventive Wellness Guidance', 'Lifestyle Recommendations'],
    },
  ];

  return (
    <>
      <SEO 
        title="JADMAA Varmakalai | Varmakalai Training & Self Defence"
        description="Learn traditional Varmakalai and self-defence training at JADMAA. Join structured programs for kids, students, women and adults in Thanjavur, Kumbakonam and Ariyalur."
      />

      {/* 1. HERO SECTION */}
      <section className="relative bg-[#FAF6F0] pt-10 pb-12 md:pt-14 md:pb-16 border-b border-[#E8DDD0] overflow-hidden" data-aos="fade-up">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-5 text-left">
              
              <div className="text-[#B12B2B] text-[12px] md:text-[13px] font-bold tracking-[1.2px] uppercase font-body">
                <EditableText settingKey="home.hero.eyebrow" defaultText="1000+ Year Old Mother of Martial Arts" />
              </div>

              <h2 className="font-heading font-medium text-[clamp(28px,3.8vw,48px)] text-[#2B2521] leading-[1.18] tracking-[-0.5px]">
                <EditableText 
                  settingKey="home.hero.title" 
                  defaultText="Learn the Ancient Science of Varmakalai" 
                />
              </h2>

              <p className="font-body text-[#5C5148] text-[16px] md:text-[17px] leading-[1.6] max-w-xl">
                <EditableText 
                  settingKey="home.hero.subtitle" 
                  defaultText="Empower your body, sharpen your mind, and preserve a timeless tradition through professional Varmakalai (Varma Kalai) martial arts training." 
                  multiline={true}
                />
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-1">
                <Link to="/contact" className="btn-jadmaa-primary">
                  <EditableText settingKey="home.hero.cta1" defaultText="Join Now" />
                </Link>
                <Link to="/contact" className="btn-jadmaa-outline">
                  <EditableText settingKey="home.hero.cta2" defaultText="Book Free Demo Class" />
                </Link>
              </div>

              {/* Hero Stats Row - All 4 in single row on mobile (exact jadmaa.com match) */}
              <div className="pt-6 sm:pt-8 border-t border-[#E8DDD0] flex flex-nowrap items-start justify-between gap-1 sm:gap-4 md:gap-6 text-center sm:text-left">
                <div className="flex-1 min-w-0 max-w-[25%] px-0.5">
                  <div className="font-heading font-bold text-lg sm:text-2xl md:text-3xl text-[#2B2521] leading-tight min-h-[1.25em] flex items-center justify-center sm:justify-start contain-layout">
                    {isEditing ? (
                      <EditableText settingKey="home.stats.tradition.value" defaultText="1000" />
                    ) : (
                      <CountUp end={traditionValue} suffix="+" />
                    )}
                  </div>
                  <div className="font-body text-[10px] sm:text-xs md:text-sm text-[#5C5148] mt-0.5 sm:mt-1 font-medium leading-[1.2] break-words">
                    <EditableText settingKey="home.stats.tradition" defaultText="Years of Tradition" />
                  </div>
                </div>

                <div className="flex-1 min-w-0 max-w-[25%] px-0.5">
                  <div className="font-heading font-bold text-lg sm:text-2xl md:text-3xl text-[#2B2521] leading-tight min-h-[1.25em] flex items-center justify-center sm:justify-start contain-layout">
                    {isEditing ? (
                      <EditableText settingKey="home.stats.branches.value" defaultText="3" />
                    ) : (
                      <CountUp end={branchesValue} />
                    )}
                  </div>
                  <div className="font-body text-[10px] sm:text-xs md:text-sm text-[#5C5148] mt-0.5 sm:mt-1 font-medium leading-[1.2] break-words">
                    <EditableText settingKey="home.stats.branches" defaultText="Branches" />
                  </div>
                </div>

                <div className="flex-1 min-w-0 max-w-[25%] px-0.5">
                  <div className="font-heading font-bold text-lg sm:text-2xl md:text-3xl text-[#2B2521] leading-tight min-h-[1.25em] flex items-center justify-center sm:justify-start contain-layout">
                    {isEditing ? (
                      <EditableText settingKey="home.stats.courses.value" defaultText="7" />
                    ) : (
                      <CountUp end={coursesValue} />
                    )}
                  </div>
                  <div className="font-body text-[10px] sm:text-xs md:text-sm text-[#5C5148] mt-0.5 sm:mt-1 font-medium leading-[1.2] break-words">
                    <EditableText settingKey="home.stats.courses" defaultText="Structured Courses" />
                  </div>
                </div>

                <div className="flex-1 min-w-0 max-w-[25%] px-0.5">
                  <div className="font-heading font-bold text-lg sm:text-2xl md:text-3xl text-[#2B2521] leading-tight min-h-[1.25em] flex items-center justify-center sm:justify-start contain-layout">
                    {isEditing ? (
                      <EditableText settingKey="home.stats.experience.value" defaultText="10" />
                    ) : (
                      <CountUp end={experienceValue} suffix="+" />
                    )}
                  </div>
                  <div className="font-body text-[10px] sm:text-xs md:text-sm text-[#5C5148] mt-0.5 sm:mt-1 font-medium leading-[1.2] break-words">
                    <EditableText settingKey="home.stats.experience" defaultText="Years Aasan Experience" />
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Hero Practitioner Kick Image */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end items-end relative min-h-[380px] sm:min-h-[440px] pt-2 lg:pt-0" data-aos="fade-up" data-aos-delay="100">
              <div className="relative group cursor-pointer animate-jd-hero-float inline-block text-center">
                <ResponsiveImage 
                  src="/images/hero-kick-action-transparent.png" 
                  alt="Varmakalai Practitioner Stance" 
                  priority={true}
                  width={386}
                  height={1024}
                  sizes="(max-width: 640px) 360px, (max-width: 1024px) 480px, 650px"
                  className="max-h-[440px] sm:max-h-[500px] lg:max-h-[600px] xl:max-h-[650px] w-auto object-contain object-bottom drop-shadow-[0_20px_40px_rgba(177,43,43,0.25)] hover:scale-105 transition-transform duration-700 ease-out animate-jd-hero-float"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. ABOUT JADMAA TEASER SECTION */}
      <section className="py-14 lg:py-20 bg-white border-b border-[#EBE3D7] text-left overflow-hidden relative" data-aos="fade-up">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            <div className="lg:col-span-8 space-y-5">
              <span className="text-[12px] md:text-[13px] font-bold text-[#B12B2B] uppercase tracking-[1.4px] font-body block">
                <EditableText settingKey="home.about.eyebrow" defaultText="About JADMAA Varmakalai" />
              </span>
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl lg:text-[38px] text-[#241E1B] leading-[1.18] tracking-tight">
                <EditableText settingKey="home.about.title" defaultText="Ancient Power. Modern Training." />
              </h2>
              <div className="space-y-4 font-body text-[16px] md:text-[16.5px] text-[#554A42] leading-[1.7] max-w-3xl">
                <p>
                  <EditableText 
                    settingKey="home.about.description" 
                    defaultText="JADMAA is dedicated to preserving and promoting the ancient Tamil martial art of Varmakalai (Varma Kalai / Varmakkalai) through structured, professional, and practical training. Our mission is to empower people of all ages with self-defence skills, physical fitness, discipline, confidence, and mental strength while preserving the rich cultural heritage passed down through generations." 
                    multiline={true} 
                  />
                </p>
                <p>
                  <EditableText 
                    settingKey="home.about.description_p2" 
                    defaultText="Our training programs are carefully designed for children, teenagers, women, and adults, combining traditional Varma techniques with modern teaching methods in a safe and supportive learning environment." 
                    multiline={true} 
                  />
                </p>
              </div>
              <div className="pt-2">
                <Link 
                  to="/about" 
                  className="inline-flex items-center gap-1.5 font-bold text-[15px] text-[#B12B2B] hover:text-[#8F2020] transition-colors group font-body"
                >
                  <span><EditableText settingKey="home.about.cta" defaultText="Learn More" /></span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 text-[#B12B2B]" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-4 flex justify-center items-center relative">
              {/* Subtle ambient aura behind martial stance */}
              <div className="absolute w-64 h-64 sm:w-72 sm:h-72 rounded-full bg-[#B12B2B]/5 blur-3xl pointer-events-none -z-0" />
              <div className="relative z-10 w-full max-w-[340px] sm:max-w-[380px]">
                <ResponsiveImage 
                  src="/images/pose-dab-red-transparent.png" 
                  alt="Varmakalai practitioner demonstrating a traditional stance" 
                  width={380}
                  height={595}
                  aspectRatio="653/1024"
                  sizes="(max-width: 640px) 100vw, 380px"
                  className="w-full h-auto object-contain drop-shadow-[0_12px_28px_rgba(0,0,0,0.06)] hover:scale-[1.03] transition-transform duration-500 ease-out"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. WHY CHOOSE JADMAA SECTION */}
      <section className="py-16 bg-[#FAF6F0] border-b border-[#E8DDD0] text-left overflow-hidden" data-aos="fade-up">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-6 space-y-4">
              <span className="text-[12px] md:text-[13px] font-bold text-[#B12B2B] uppercase tracking-[1.2px] font-body block">
                <EditableText settingKey="home.why.eyebrow" defaultText="EXCELLENCE & INTEGRITY" />
              </span>
              <h2 className="font-heading font-bold text-2xl sm:text-3xl lg:text-[34px] text-[#2B2521] leading-[1.2]">
                <EditableText settingKey="home.why.title" defaultText="Why Choose JADMAA?" />
              </h2>
              <p className="font-body text-[16px] text-[#5C5148] leading-[1.65]">
                <EditableText settingKey="home.why.description" defaultText="We bridge ancient Tamil martial traditions with modern structured pedagogy, ensuring safe, effective, and transformative training for all age groups." multiline={true} />
              </p>
              <div className="pt-2">
                <Link to="/about" className="inline-flex items-center space-x-1.5 font-semibold text-[15px] text-[#B12B2B] hover:text-[#8F2020] group font-body">
                  <span><EditableText settingKey="home.why.cta" defaultText="Learn More" /></span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6" data-aos="fade-up" data-aos-delay="100">
              <div className="bg-white p-6 rounded-2xl border border-[#E8DDD0] shadow-sm space-y-4 hover-lift">
                <h3 className="font-heading font-bold text-[20px] text-[#2B2521]">
                  <EditableText settingKey="home.why.box.title" defaultText="Why Students Choose JADMAA" />
                </h3>
                <ul className="space-y-3 text-[15px] md:text-[16px] text-[#5C5148] font-body">
                  <li className="flex items-start space-x-2.5 animate-list-item group">
                    <CheckCircle2 className="w-5 h-5 text-[#B12B2B] flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <span className="group-hover:text-[#B12B2B] transition-colors"><EditableText settingKey="home.why.point1" defaultText="Authentic Gurukulam Varma Training preserved free from commercial dilution." /></span>
                  </li>
                  <li className="flex items-start space-x-2.5 animate-list-item group">
                    <CheckCircle2 className="w-5 h-5 text-[#B12B2B] flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <span className="group-hover:text-[#B12B2B] transition-colors"><EditableText settingKey="home.why.point2" defaultText="Experienced Instructors under qualified Aasan guidance." /></span>
                  </li>
                  <li className="flex items-start space-x-2.5 animate-list-item group">
                    <CheckCircle2 className="w-5 h-5 text-[#B12B2B] flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <span className="group-hover:text-[#B12B2B] transition-colors"><EditableText settingKey="home.why.point3" defaultText="Dedicated branch centers in Thanjavur, Kumbakonam, and Ariyalur." /></span>
                  </li>
                  <li className="flex items-start space-x-2.5 animate-list-item group">
                    <CheckCircle2 className="w-5 h-5 text-[#B12B2B] flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <span className="group-hover:text-[#B12B2B] transition-colors"><EditableText settingKey="home.why.point4" defaultText="Systematic level progression & recognized academy certifications." /></span>
                  </li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. MARTIAL ARTS TRAINING AT JADMAA VARMAKALAI SECTION */}
      <section className="py-12 sm:py-16 bg-white border-b border-[#E8DDD0] text-left overflow-hidden" data-aos="fade-up">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 space-y-10 sm:space-y-12">
          
          {/* Top Row: Left Image & Right Section Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left: Big Martial Arts Stance Image (1st on mobile) */}
            <div className="lg:col-span-5 flex justify-center items-center" data-aos="fade-up">
              <div className="relative group text-center">
                <ResponsiveImage 
                  src="/images/training-stance.png" 
                  alt="Traditional Varmakalai Training Stance at JADMAA" 
                  width={576}
                  height={1024}
                  aspectRatio="576/1024"
                  sizes="(max-width: 640px) 360px, 576px"
                  className="max-h-[380px] sm:max-h-[440px] lg:max-h-[480px] w-auto object-contain drop-shadow-[0_16px_32px_rgba(43,37,33,0.18)] hover:scale-105 transition-transform duration-500 ease-out"
                />
              </div>
            </div>

            {/* Right: Section Heading, Subtitle & Additional Content */}
            <div className="lg:col-span-7 space-y-4" data-aos="fade-up" data-aos-delay="100">
              <span className="text-[12px] md:text-[13px] font-bold text-[#B12B2B] uppercase tracking-[1.2px] font-body block">
                <EditableText settingKey="home.training.eyebrow" defaultText="ACADEMY SYLLABUS" />
              </span>
              <h2 className="font-heading font-bold text-2xl sm:text-3xl lg:text-[36px] text-[#2B2521] leading-[1.15]">
                <EditableText settingKey="home.training.title_v2" defaultText="Martial Arts Training at JADMAA Varmakalai" />
              </h2>
              <p className="font-body text-[16px] sm:text-[18px] text-[#2B2521] font-medium leading-[1.5]">
                <EditableText settingKey="home.training.subtitle" defaultText="What we teach, who it is for, and what you gain from consistent practice." multiline={true} />
              </p>
              <div className="space-y-3 font-body text-[15px] sm:text-[16px] text-[#5C5148] leading-[1.65]">
                <p>
                  <EditableText 
                    settingKey="home.training.description" 
                    defaultText="At JADMAA, our authentic Varmakalai syllabus unites classical martial art discipline, vital point knowledge, effective self-defence techniques, and mental focus. Training is structured systematically from fundamentals to advanced applications under experienced Aasan guidance, ensuring safe practice for learners of all ages." 
                    multiline={true} 
                  />
                </p>
              </div>

              {/* Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center space-x-2.5 text-[14px] sm:text-[15px] font-medium text-[#2B2521] font-body">
                  <CheckCircle2 className="w-4 h-4 text-[#B12B2B] flex-shrink-0" />
                  <span><EditableText settingKey="home.training.highlight1" defaultText="Authentic Tamil Lineage" /></span>
                </div>
                <div className="flex items-center space-x-2.5 text-[14px] sm:text-[15px] font-medium text-[#2B2521] font-body">
                  <CheckCircle2 className="w-4 h-4 text-[#B12B2B] flex-shrink-0" />
                  <span><EditableText settingKey="home.training.highlight2" defaultText="Certified Aasan Guidance" /></span>
                </div>
                <div className="flex items-center space-x-2.5 text-[14px] sm:text-[15px] font-medium text-[#2B2521] font-body">
                  <CheckCircle2 className="w-4 h-4 text-[#B12B2B] flex-shrink-0" />
                  <span><EditableText settingKey="home.training.highlight3" defaultText="Systematic Level Progression" /></span>
                </div>
                <div className="flex items-center space-x-2.5 text-[14px] sm:text-[15px] font-medium text-[#2B2521] font-body">
                  <CheckCircle2 className="w-4 h-4 text-[#B12B2B] flex-shrink-0" />
                  <span><EditableText settingKey="home.training.highlight4" defaultText="All Age Groups & Backgrounds" /></span>
                </div>
              </div>
            </div>

          </div>

          {/* Cards below */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch" data-aos="fade-up">
            
            {/* Box 1: What We Offer */}
            <div className="bg-[#FAF6F0] p-5 sm:p-6 rounded-[14px] border border-[#E8DDD0] space-y-3">
              <h3 className="font-heading font-semibold text-[22px] text-[#2B2521] leading-[1.2]">
                What We Offer
              </h3>
              <ul className="space-y-2 text-[15px] text-[#2B2521] font-body">
                {[
                  'Varmakalai Training',
                  'Kids Self-Defence Training',
                  'Adult Self-Defence Training',
                  "Women's Self-Defence Program",
                  'School Workshops',
                  'College Workshops',
                  'Corporate Self-Defence Workshops',
                  'Personal One-to-One Training',
                  'Certification Programs',
                  'Traditional Varma Treatment Sessions',
                ].map((item) => (
                  <li key={item} className="flex items-start space-x-2.5 animate-list-item group">
                    <CheckCircle2 className="w-4 h-4 text-[#B12B2B] flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <span className="leading-[1.5] group-hover:text-[#B12B2B] transition-colors">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Box 2: Who Can Join? */}
            <div className="bg-[#FAF6F0] p-5 sm:p-6 rounded-[14px] border border-[#E8DDD0] space-y-3">
              <h3 className="font-heading font-semibold text-[22px] text-[#2B2521] leading-[1.2]">
                Who Can Join?
              </h3>
              <ul className="space-y-2 text-[15px] text-[#2B2521] font-body">
                {[
                  'Children (6+ Years)',
                  'School Students',
                  'College Students',
                  'Women',
                  'Working Professionals',
                  'Fitness Enthusiasts',
                  'Martial Arts Learners',
                  'Senior Adults (fitness assessment)',
                ].map((item) => (
                  <li key={item} className="flex items-start space-x-2.5 animate-list-item group">
                    <CheckCircle2 className="w-4 h-4 text-[#B12B2B] flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <span className="leading-[1.5] group-hover:text-[#B12B2B] transition-colors">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Box 3: Benefits of Training */}
            <div className="bg-[#FAF6F0] p-5 sm:p-6 rounded-[14px] border border-[#E8DDD0] space-y-3">
              <h3 className="font-heading font-semibold text-[22px] text-[#2B2521] leading-[1.2]">
                Benefits of Training
              </h3>
              <ul className="space-y-2 text-[15px] text-[#2B2521] font-body">
                {[
                  'Self-Defence Skills',
                  'Improved Fitness',
                  'Better Flexibility',
                  'Faster Reflexes',
                  'Increased Confidence',
                  'Better Focus',
                  'Mental Discipline',
                  'Stress Management',
                  'Leadership Skills',
                  'Healthy Lifestyle',
                ].map((item) => (
                  <li key={item} className="flex items-start space-x-2.5 animate-list-item group">
                    <CheckCircle2 className="w-4 h-4 text-[#B12B2B] flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <span className="leading-[1.5] group-hover:text-[#B12B2B] transition-colors">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

        </div>
      </section>

      {/* 5. FEATURED COURSES SECTION */}
      <section className="py-16 bg-[#FAF6F0] border-b border-[#E8DDD0] text-left" data-aos="fade-up">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4" data-aos="fade-up">
            <div>
              <span className="text-[12px] md:text-[13px] font-bold text-[#B12B2B] uppercase tracking-[1.2px] font-body block">
                <EditableText settingKey="home.courses.eyebrow" defaultText="STRUCTURED CURRICULUM" />
              </span>
              <h2 className="font-heading font-bold text-2xl sm:text-3xl lg:text-[34px] text-[#2B2521] mt-1 leading-[1.2]">
                <EditableText settingKey="home.courses.title" defaultText="Featured Courses" />
              </h2>
              <p className="text-[16px] text-[#5C5148] mt-1 font-body">
                <EditableText settingKey="home.courses.subtitle" defaultText="Online Recorded Courses • Offline Branch Training — explore our self-paced & guided programs." multiline={true} />
              </p>
            </div>
            
            {/* Interactive Direction & Manual Roll Controls */}
            <div className="flex items-center gap-3">
              <Link to="/courses" className="inline-flex items-center space-x-1 font-semibold text-[15px] text-[#B12B2B] hover:text-[#8F2020] group font-body mr-2">
                <span>View all</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>

              {featuredCourses.length > 2 && (
                <>
                  {/* Prev (Scroll Left / Set Left Direction) */}
                  <button
                    type="button"
                    onClick={() => scrollCoursesBy(-360, 'left')}
                    title="Scroll Left (Roll Left)"
                    aria-label="Scroll Courses Left"
                    className={`p-2 sm:p-2.5 rounded-full border transition-all duration-200 ${
                      coursesDirection === 'left'
                        ? 'bg-[#B12B2B] text-white border-[#B12B2B] shadow-sm'
                        : 'bg-white text-[#2B2521] border-[#E8DDD0] hover:bg-[#FAF6F0] hover:border-[#B12B2B]'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  {/* Next (Scroll Right / Set Right Direction) */}
                  <button
                    type="button"
                    onClick={() => scrollCoursesBy(360, 'right')}
                    title="Scroll Right (Roll Right)"
                    aria-label="Scroll Courses Right"
                    className={`p-2 sm:p-2.5 rounded-full border transition-all duration-200 ${
                      coursesDirection === 'right'
                        ? 'bg-[#B12B2B] text-white border-[#B12B2B] shadow-sm'
                        : 'bg-white text-[#2B2521] border-[#E8DDD0] hover:bg-[#FAF6F0] hover:border-[#B12B2B]'
                    }`}
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Carousel Track Container */}
          <div className="relative group">
            <div
              ref={coursesTrackRef}
              className={`flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar py-2 select-none ${
                featuredCourses.length <= 2
                  ? 'justify-start md:justify-center'
                  : 'cursor-grab active:cursor-grabbing justify-start'
              }`}
              onMouseEnter={() => setCoursesPaused(true)}
              onMouseLeave={() => {
                if (!isCoursesDragging) setCoursesPaused(false);
              }}
              onMouseDown={(e) => {
                if (featuredCourses.length <= 2) return;
                setIsCoursesDragging(true);
                coursesDragStart.current = {
                  startX: e.pageX,
                  scrollLeft: coursesTrackRef.current?.scrollLeft || 0,
                };
              }}
              onTouchStart={() => setCoursesPaused(true)}
              onTouchEnd={() => {
                setTimeout(() => setCoursesPaused(false), 2000);
              }}
            >
              {loading ? (
                <div className="w-full text-center py-12 text-[#706B65] flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-[#B12B2B] border-t-transparent rounded-full animate-spin" />
                  <span>Loading authentic courses...</span>
                </div>
              ) : coursesError && featuredCourses.length === 0 ? (
                <div className="w-full text-center py-12 text-red-600">
                  <p className="font-medium">Unable to load courses right now. Please try again.</p>
                </div>
              ) : featuredCourses.length === 0 ? (
                <div className="w-full text-center py-12 text-[#706B65]">
                  <p className="font-medium">No courses available at this time.</p>
                </div>
              ) : (
                featuredCourses.map((course) => (
                  <div
                    key={course.id}
                    className="w-[84vw] max-w-[340px] sm:max-w-none sm:w-[360px] lg:w-[380px] shrink-0"
                  >
                    <CourseCard course={course} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 6. VARMA WELLNESS & TRADITIONAL THERAPY SECTION */}
      <section className="py-8 sm:py-12 bg-white border-b border-[#E8DDD0] text-left overflow-hidden" data-aos="fade-up">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 space-y-6">
          
          <h2 className="font-heading font-bold text-2xl sm:text-3xl lg:text-[34px] text-[#2B2521] leading-[1.15]" data-aos="fade-up">
            <EditableText settingKey="home.wellness.title" defaultText="Varma Treatment & Traditional Wellness" />
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
            
            {/* Left Image - Full size matching section height */}
            <div className="lg:col-span-4 flex flex-col h-full">
              <div className="w-full h-full min-h-[460px] lg:min-h-full overflow-hidden rounded-[14px] shadow-sm flex flex-col bg-[#FAF6F0]">
                <ResponsiveImage 
                  src="/images/wellness-682x1024.png" 
                  alt="Traditional Varma therapy session at JADMAA Varmakalai" 
                  width={682}
                  height={1024}
                  aspectRatio="2/3"
                  sizes="(max-width: 1024px) 100vw, 480px"
                  className="w-full h-full min-h-[460px] lg:min-h-[540px] object-cover object-top rounded-[14px] hover:scale-105 transition-transform duration-700 ease-out"
                />
              </div>
            </div>

            {/* Right Content */}
            <div className="lg:col-span-8 space-y-5 flex flex-col" data-aos="fade-up" data-aos-delay="100">
              <p className="font-body text-[16px] text-[#5C5148] leading-[1.6]">
                <EditableText 
                  settingKey="home.wellness.description" 
                  defaultText="JADMAA also offers traditional Varma treatment and wellness sessions focused on improving mobility, relaxation, and overall well-being. Treatment is provided according to practitioner assessment and individual needs." 
                  multiline={true} 
                />
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {wellnessServices.map((service) => (
                  <div 
                    key={service.title} 
                    className="p-5 sm:p-6 bg-[#FAF6F0] rounded-[14px] border border-[#E8DDD0] space-y-3"
                  >
                    <h4 className="font-heading font-semibold text-[18px] text-[#2B2521] leading-[1.2]">
                      {service.title}
                    </h4>
                    <ul className="space-y-1.5 text-[15px] text-[#2B2521] font-body">
                      {service.items.map((item) => (
                        <li key={item} className="flex items-start space-x-2.5 animate-list-item group">
                          <CheckCircle2 className="w-4 h-4 text-[#B12B2B] flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                          <span className="text-[#5C5148] leading-[1.5] group-hover:text-[#2B2521] transition-colors">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Enquire for Varma Treatment Button */}
              <div className="pt-2">
                <Link
                  to="/contact?type=treatment"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-[#B12B2B] hover:bg-[#8C1E1E] text-white font-bold text-sm rounded-lg shadow-sm transition-all duration-200 group"
                >
                  <span>Enquire for Varma Treatment</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <p className="font-body text-[14px] text-[#5C5148] italic border-t border-[#E8DDD0] pt-4 leading-[1.6]">
                <EditableText 
                  settingKey="home.wellness.disclaimer" 
                  defaultText="Disclaimer: Varma treatment sessions are intended to support general well-being and are not a substitute for professional medical diagnosis or emergency care. Treatment outcomes vary based on individual assessment and condition." 
                  multiline={true} 
                />
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 8. BRANCH LOCATIONS SECTION */}
      <section className="py-16 bg-white border-b border-[#E8DDD0] text-left" data-aos="fade-up">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 space-y-8">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[12px] md:text-[13px] font-bold text-[#B12B2B] uppercase tracking-[1.2px] font-body block">
              <EditableText settingKey="home.branches.eyebrow" defaultText="BRANCH LOCATIONS" />
            </span>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl lg:text-[34px] text-[#2B2521] leading-[1.2]">
              <EditableText settingKey="home.branches.title" defaultText="Our Training Centers" />
            </h2>
            <p className="text-[16px] text-[#5C5148] font-body">
              <EditableText settingKey="home.branches.subtitle" defaultText="Visit our academies across Tamil Nadu for in-person training." multiline={true} />
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mockBranches.map((branch, idx) => (
              <div 
                key={branch.id} 
                className="bg-[#FAF6F0] rounded-lg border border-[#E8DDD0] p-5 space-y-3 hover-lift scroll-card-settle"
                data-aos="fade-up"
                data-aos-delay={(idx + 1) * 100}
              >
                <div className="flex items-center space-x-2 text-[#B12B2B]">
                  <MapPin className="w-4 h-4" />
                  <span className="font-bold text-xs uppercase tracking-wider">{branch.city}</span>
                </div>
                <h3 className="font-heading font-bold text-base text-[#2B2521]">{branch.name}</h3>
                <p className="text-[15px] text-[#5C5148] leading-relaxed font-body">{branch.address}</p>
                <p className="text-[14px] font-bold text-[#2B2521] pt-1 font-body">{branch.phone}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 9. TESTIMONIALS SECTION */}
      <section className="py-16 bg-[#FAF6F0] border-b border-[#E8DDD0] text-left" data-aos="fade-up">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4" data-aos="fade-up">
            <div className="text-left">
              <span className="text-[12px] md:text-[13px] font-bold text-[#B12B2B] uppercase tracking-[1.2px] font-body block">
                <EditableText settingKey="home.testimonials.eyebrow" defaultText="STUDENT REVIEWS" />
              </span>
              <h2 className="font-heading font-bold text-2xl sm:text-3xl lg:text-[34px] text-[#2B2521] leading-[1.2]">
                <EditableText settingKey="home.testimonials.title" defaultText="What Our Students Say" />
              </h2>
            </div>

            {/* Testimonials Controls: Manual Nudge */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => scrollTestimonialsBy(-340)}
                title="Scroll Previous"
                aria-label="Scroll Reviews Left"
                className="p-2 sm:p-2.5 rounded-full border border-[#E8DDD0] bg-white text-[#2B2521] hover:bg-[#FAF6F0] hover:border-[#B12B2B] hover:text-[#B12B2B] shadow-sm transition-all duration-200"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                type="button"
                onClick={() => scrollTestimonialsBy(340)}
                title="Scroll Next"
                aria-label="Scroll Reviews Right"
                className="p-2 sm:p-2.5 rounded-full border border-[#E8DDD0] bg-white text-[#2B2521] hover:bg-[#FAF6F0] hover:border-[#B12B2B] hover:text-[#B12B2B] shadow-sm transition-all duration-200"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          <div className="relative overflow-hidden group">
            {/* Fade effect at the edges */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-16 bg-gradient-to-r from-[#FAF6F0] to-transparent z-10"></div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-16 bg-gradient-to-l from-[#FAF6F0] to-transparent z-10"></div>
            
            <div
              ref={testimonialsTrackRef}
              className="flex gap-6 overflow-x-auto no-scrollbar py-2 cursor-grab active:cursor-grabbing select-none"
              onMouseEnter={() => setTestimonialsPaused(true)}
              onMouseLeave={() => {
                if (!isTestimonialsDragging) setTestimonialsPaused(false);
              }}
              onMouseDown={(e) => {
                setIsTestimonialsDragging(true);
                testimonialsDragStart.current = {
                  startX: e.pageX,
                  scrollLeft: testimonialsTrackRef.current?.scrollLeft || 0,
                };
              }}
              onTouchStart={() => setTestimonialsPaused(true)}
              onTouchEnd={() => setTestimonialsPaused(false)}
            >
              {(() => {
                const baseList = testimonials.length > 0 ? testimonials : (mockTestimonials as any);
                return [...baseList, ...baseList, ...baseList];
              })().map((t: any, idx: number) => (
                <div key={`${t.id}-${idx}`} className="w-[85vw] sm:w-[350px] shrink-0 bg-white rounded-lg border border-[#E8DDD0] p-5 space-y-3 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                  <div className="space-y-2">
                    <div className="flex text-amber-500">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-base md:text-lg text-[#5C5148] italic leading-relaxed">"{t.content}"</p>
                  </div>
                  <div className="pt-2 border-t border-[#E8DDD0] flex items-center space-x-3">
                    {t.avatar ? (
                      <ResponsiveImage src={t.avatar || '/images/logo-1.png'} alt={t.name} width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#E8DDD0] flex items-center justify-center text-[#2B2521] font-bold text-sm">
                        {t.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-heading font-bold text-base text-[#2B2521]">{t.name}</p>
                      <p className="text-sm md:text-base text-[#5C5148]">{t.role}{t.location ? ` • ${t.location}` : ''}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};