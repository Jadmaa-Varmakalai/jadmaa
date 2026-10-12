import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { CourseCard } from '../components/courses/CourseCard';
import { mockTestimonials } from '../data/testimonials';
import { mockBranches } from '../data/branches';
import { CheckCircle2, ArrowRight, Star, MapPin, HeartPulse, Shield, Award, Users } from 'lucide-react';
import { courseApi } from '../lib/api/courseApi';
import type { Course } from '../types';
import { reviewsApi, type Testimonial } from '../lib/api/reviewsApi';
import { CountUp } from '../components/common/CountUp';
import { EditableText } from '../components/common/EditableText';

export const Home: React.FC = () => {
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>(() => {
    const cached = courseApi.getCachedCourses();
    return cached.slice(0, 3);
  });
  const [loading, setLoading] = useState(() => courseApi.getCachedCourses().length === 0);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(() => mockTestimonials as any);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await courseApi.getCourses();
        if (data && data.length > 0) {
          setFeaturedCourses(data.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to fetch courses', err);
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
      <section className="relative bg-[#FAF6F0] pt-10 pb-12 md:pt-14 md:pb-16 border-b border-[#E8DDD0] overflow-hidden">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-5 text-left" data-aos="fade-right">
              
              <div className="text-[#B12B2B] text-[12px] md:text-[13px] font-bold tracking-[1.2px] uppercase font-body">
                <EditableText settingKey="home.hero.eyebrow" defaultText="1000+ Year Old Mother of Martial Arts" />
              </div>

              <h1 className="font-heading font-bold text-[clamp(28px,3.8vw,48px)] text-[#2B2521] leading-[1.18] tracking-[-0.5px]">
                <EditableText 
                  settingKey="home.hero.title" 
                  defaultText="Learn the Ancient Science of Varmakalai" 
                />
              </h1>
              
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

              {/* Hero Stats Row */}
              <div className="pt-8 border-t border-[#E8DDD0] grid grid-cols-2 sm:grid-cols-4 gap-4 text-center sm:text-left" data-aos="fade-up" data-aos-delay="100">
                <div>
                  <div className="font-heading font-bold text-2xl sm:text-3xl text-[#2B2521]"><CountUp end={1000} suffix="+" /></div>
                  <div className="font-body text-xs sm:text-sm text-[#5C5148] mt-1 font-medium">
                    <EditableText settingKey="home.stats.tradition" defaultText="Years of Tradition" />
                  </div>
                </div>

                <div>
                  <div className="font-heading font-bold text-2xl sm:text-3xl text-[#2B2521]"><CountUp end={3} /></div>
                  <div className="font-body text-xs sm:text-sm text-[#5C5148] mt-1 font-medium">
                    <EditableText settingKey="home.stats.branches" defaultText="Branches" />
                  </div>
                </div>

                <div>
                  <div className="font-heading font-bold text-2xl sm:text-3xl text-[#2B2521]"><CountUp end={7} /></div>
                  <div className="font-body text-xs sm:text-sm text-[#5C5148] mt-1 font-medium">
                    <EditableText settingKey="home.stats.courses" defaultText="Structured Courses" />
                  </div>
                </div>

                <div>
                  <div className="font-heading font-bold text-2xl sm:text-3xl text-[#2B2521]"><CountUp end={15} suffix="+" /></div>
                  <div className="font-body text-xs sm:text-sm text-[#5C5148] mt-1 font-medium">
                    <EditableText settingKey="home.stats.experience" defaultText="Years Guru Experience" />
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Hero Practitioner Kick Image */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end items-end relative min-h-[440px]" data-aos="fade-left" data-aos-delay="150">
              <div className="relative group cursor-pointer">
                <img 
                  src="/images/hero-kick-action-transparent.png" 
                  alt="Varmakalai Practitioner Stance" 
                  className="max-h-[500px] lg:max-h-[600px] xl:max-h-[650px] w-auto object-contain object-bottom drop-shadow-[0_20px_40px_rgba(177,43,43,0.25)] hover:scale-105 transition-transform duration-700 ease-out"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. ABOUT JADMAA TEASER SECTION */}
      <section className="py-12 lg:py-16 bg-[#FAF6F0] border-b border-[#E8DDD0] text-left overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            <div className="lg:col-span-8 space-y-4" data-aos="fade-up">
              <span className="text-[12px] font-bold text-[#B12B2B] uppercase tracking-[1.2px] font-body block">
                <EditableText settingKey="home.about.eyebrow" defaultText="About JADMAA" />
              </span>
              <h2 className="font-heading font-bold text-2xl sm:text-3xl lg:text-[34px] text-[#2B2521] leading-[1.15]">
                <EditableText settingKey="home.about.title" defaultText="Ancient Power. Modern Training." />
              </h2>
              <div className="space-y-4 font-body text-[16px] text-[#5C5148] leading-[1.6]">
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
                  className="inline-flex items-center space-x-1.5 font-semibold text-[15px] text-[#B12B2B] hover:text-[#8F2020] transition-colors group font-body"
                >
                  <span><EditableText settingKey="home.about.cta" defaultText="Learn More →" /></span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-4 flex justify-center" data-aos="zoom-in" data-aos-delay="150">
              <div className="w-full max-w-[360px] overflow-hidden rounded-[14px]">
                <img 
                  src="https://jadmaa.com/wp-content/uploads/2026/07/pose-dab-red-e1785095608624-653x1024.jpg" 
                  alt="Varmakalai practitioner demonstrating a traditional stance" 
                  className="w-full h-auto object-cover rounded-[14px] hover:scale-105 transition-transform duration-500 ease-out"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. WHY CHOOSE JADMAA SECTION */}
      <section className="py-16 bg-[#FAF6F0] border-b border-[#E8DDD0] text-left overflow-hidden">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-6 space-y-4" data-aos="fade-right">
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

            <div className="lg:col-span-6" data-aos="fade-left" data-aos-delay="100">
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
                    <span className="group-hover:text-[#B12B2B] transition-colors"><EditableText settingKey="home.why.point2" defaultText="Experienced Instructors under Grandmaster A. Jeyaraj guidance." /></span>
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

      {/* 4. VARMA WELLNESS & TRADITIONAL THERAPY SECTION */}
      <section className="py-8 sm:py-12 bg-[#FAF6F0] border-b border-[#E8DDD0] text-left overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          
          <h2 className="font-heading font-bold text-2xl sm:text-3xl lg:text-[34px] text-[#2B2521] leading-[1.15]" data-aos="fade-up">
            <EditableText settingKey="home.wellness.title" defaultText="Varma Treatment & Traditional Wellness" />
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            
            {/* Left Image */}
            <div className="lg:col-span-5 flex justify-center" data-aos="fade-right">
              <div className="w-full max-w-[480px] overflow-hidden rounded-[14px]">
                <img 
                  src="https://jadmaa.com/wp-content/uploads/2026/07/wellness-682x1024.jpg" 
                  alt="Traditional Varma therapy session at JADMAA Varmakalai" 
                  className="w-full h-auto object-cover rounded-[14px] hover:scale-105 transition-transform duration-500 ease-out"
                />
              </div>
            </div>

            {/* Right Content */}
            <div className="lg:col-span-7 space-y-5 flex flex-col" data-aos="fade-left" data-aos-delay="100">
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
                    className="p-5 sm:p-6 bg-white rounded-[14px] border border-[#E8DDD0] space-y-3"
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

      {/* 5. TRAINING AT JADMAA SECTION */}
      <section className="py-8 sm:py-12 bg-[#F3ECE0] border-b border-[#E8DDD0] text-left">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          
          <div className="text-center max-w-3xl mx-auto space-y-2" data-aos="fade-up">
            <h2 className="font-heading font-bold text-2xl sm:text-3xl lg:text-[34px] text-[#2B2521] leading-[1.15]">
              <EditableText settingKey="home.training.title" defaultText="Training at JADMAA" />
            </h2>
            <p className="font-body text-[16px] text-[#5C5148] leading-[1.6]">
              <EditableText settingKey="home.training.subtitle" defaultText="What we teach, who it is for, and what you gain from consistent practice." multiline={true} />
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Box 1: What We Offer */}
            <div className="bg-white p-5 sm:p-6 rounded-[14px] border border-[#E8DDD0] space-y-3">
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
            <div className="bg-white p-5 sm:p-6 rounded-[14px] border border-[#E8DDD0] space-y-3">
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
            <div className="bg-white p-5 sm:p-6 rounded-[14px] border border-[#E8DDD0] space-y-3">
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

      {/* 6. GROWTH & LEADERSHIP / BUILD YOUR FUTURE SECTION */}
      <section className="py-8 sm:py-12 bg-[#FAF6F0] border-b border-[#E8DDD0] text-left overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-3" data-aos="fade-right">
              <span className="text-[12px] font-bold text-[#B12B2B] uppercase tracking-[1.2px] font-body block">
                <EditableText settingKey="home.growth.eyebrow" defaultText="Growth & Leadership" />
              </span>
              <h2 className="font-heading font-bold text-2xl sm:text-3xl lg:text-[34px] text-[#2B2521] leading-[1.15]">
                <EditableText settingKey="home.growth.title" defaultText="Build Your Future Through Traditional Martial Arts (Varmakalai)" />
              </h2>
              <p className="font-body text-[16px] text-[#5C5148] leading-[1.6]">
                <EditableText 
                  settingKey="home.growth.description" 
                  defaultText="Learning doesn't end with a certificate. Dedicated students can grow from student to certified instructor and branch trainer — building a meaningful career while preserving an ancient tradition." 
                  multiline={true} 
                />
              </p>
              <div className="pt-2">
                <Link 
                  to="/careers" 
                  className="inline-flex items-center space-x-1.5 font-semibold text-[15px] text-[#B12B2B] hover:text-[#8F2020] transition-colors group font-body"
                >
                  <span><EditableText settingKey="home.growth.cta" defaultText="Learn More →" /></span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center" data-aos="fade-left" data-aos-delay="100">
              <div className="w-full max-w-[480px] overflow-hidden rounded-[14px]">
                <img 
                  src="https://jadmaa.com/wp-content/uploads/2026/08/file_000000008884820b9a3c789a8c0be531-1024x683.png" 
                  alt="Varmakalai martial arts training session at JADMAA" 
                  className="w-full h-auto object-cover rounded-[14px] hover:scale-105 transition-transform duration-500 ease-out"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 7. FEATURED COURSES SECTION */}
      <section className="py-16 bg-white border-b border-[#E8DDD0] text-left">
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
            <Link to="/courses" className="inline-flex items-center space-x-1 font-semibold text-[15px] text-[#B12B2B] hover:text-[#8F2020] group font-body">
              <span>View all courses</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="mobile-swipe-scroll">
            {loading ? (
              <div className="col-span-3 text-center py-8 text-jadmaa-textMuted">Loading courses...</div>
            ) : featuredCourses.map((course, idx) => (
              <div key={course.id} className="jd-pop reveal-on-scroll">
                <CourseCard course={course} hidePrice />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. BRANCH LOCATIONS SECTION */}
      <section className="py-16 bg-white border-b border-[#E8DDD0] text-left">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 space-y-8">
          
          <div className="text-center max-w-2xl mx-auto space-y-2" data-aos="fade-up">
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
            {mockBranches.map((branch) => (
              <div key={branch.id} className="bg-[#FAF6F0] rounded-lg border border-[#E8DDD0] p-5 space-y-3 hover-lift scroll-card-settle">
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
      <section className="py-16 bg-[#FAF6F0] border-b border-[#E8DDD0] text-left">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2" data-aos="fade-up">
            <span className="text-[12px] md:text-[13px] font-bold text-[#B12B2B] uppercase tracking-[1.2px] font-body block">
              <EditableText settingKey="home.testimonials.eyebrow" defaultText="STUDENT REVIEWS" />
            </span>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl lg:text-[34px] text-[#2B2521] leading-[1.2]">
              <EditableText settingKey="home.testimonials.title" defaultText="What Our Students Say" />
            </h2>
          </div>

          <div className="relative overflow-hidden group">
            {/* Fade effect at the edges */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-16 bg-gradient-to-r from-[#FAF6F0] to-transparent z-10"></div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-16 bg-gradient-to-l from-[#FAF6F0] to-transparent z-10"></div>
            
            <div className="flex animate-marquee min-w-max gap-6 pb-4 hover:[animation-play-state:paused]">
              {[...(testimonials.length > 0 ? testimonials : mockTestimonials as any), ...(testimonials.length > 0 ? testimonials : mockTestimonials as any)].map((t: any, idx: number) => (
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
                      <img src={t.avatar} alt={t.name} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
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