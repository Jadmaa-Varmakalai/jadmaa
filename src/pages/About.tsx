import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { CheckCircle2 } from 'lucide-react';
import { EditableText } from '../components/common/EditableText';
import { ResponsiveImage } from '../components/common/ResponsiveImage';

const whyChooseItems = [
  'Authentic Traditional Varmakalai Training',
  'Structured Beginner, Intermediate & Advanced Programs',
  "Women's Self-Defence Training",
  "Children's Martial Arts Development Programs",
  'Physical Fitness & Weight Management Training',
  'Experienced & Dedicated Instructors',
  'Safe, Friendly & Disciplined Learning Environment',
  'Focus on Confidence, Discipline & Mental Strength',
  'Weekend Training Programs for Working Professionals & Students',
];

const structuredLevels = [
  'Varma strikes',
  'Varma release techniques',
  'Gripping methods',
  'Defensive applications',
  'Physical conditioning',
];

export const About: React.FC = () => {
  return (
    <>
      <SEO 
        title="About JADMAA Varmakalai | Preserving Tradition. Empowering Generations."
        description="Learn about JADMAA Varmakalai, Founder Bojagarajan, master Aasan R. Rajendran lineage, and authentic Varmakalai training in Thanjavur, Kumbakonam, and Ariyalur."
      />

      <div className="bg-[#FAF6F0] min-h-screen font-body text-[#2B2521] text-left">
        
        {/* Section 1: Title & Tagline */}
        <section className="bg-jadmaa-cream py-12 border-b border-jadmaa-border text-left" data-aos="fade-up">
          <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 space-y-3">
            <span className="text-base md:text-lg font-bold text-jadmaa-red uppercase tracking-wider block">
              <EditableText settingKey="about.eyebrow" defaultText="Tradition & Lineage" />
            </span>
            <h2 className="font-heading font-medium text-3xl sm:text-4xl lg:text-5xl text-jadmaa-charcoal">
              <EditableText settingKey="about.title" defaultText="About JADMAA Varmakalai" />
            </h2>
            <p className="text-base md:text-lg text-jadmaa-textMuted max-w-2xl">
              <EditableText settingKey="about.tagline" defaultText="Preserving Tradition. Empowering Generations." />
            </p>
          </div>
        </section>

        {/* Section 2: Image + Intro paragraphs */}
        <section className="py-12 bg-[#FAF6F0] border-b border-[#E8DDD0]" data-aos="fade-up">
          <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              {/* Left Image */}
              <div className="lg:col-span-4 flex justify-center">
                <div className="w-full max-w-[360px] overflow-hidden rounded-[14px]">
                  <ResponsiveImage 
                    src="/images/pose-dab-red-e1785095608624-653x1024.jpg" 
                    alt="Varmakalai practitioner demonstrating a traditional stance" 
                    width={360}
                    height={564}
                    aspectRatio="653/1024"
                    sizes="(max-width: 640px) 100vw, 360px"
                    className="w-full h-auto object-cover rounded-[14px] hover:scale-105 transition-transform duration-500 ease-out"
                  />
                </div>
              </div>

              {/* Right Content */}
              <div className="lg:col-span-8 space-y-4 font-body text-[16px] text-[#5C5148] leading-[1.6]">
                <p>
                  <EditableText 
                    settingKey="about.intro.p1" 
                    defaultText="JADMAA Varmakalai is dedicated to preserving and promoting the ancient Tamil martial art of Varmakalai (also spelled Varma Kalai or Varmakkalai) through structured, professional, and practical training. Our mission is to empower people of all ages with self-defence skills, physical fitness, discipline, confidence, and mental strength while preserving the rich cultural heritage passed down through generations." 
                    multiline={true} 
                  />
                </p>
                <p>
                  <EditableText 
                    settingKey="about.intro.p2" 
                    defaultText="Our training programs are carefully designed for children, teenagers, women, and adults, combining traditional Varmakalai techniques with modern teaching methods in a safe and supportive learning environment. Every student receives step-by-step guidance from experienced instructors." 
                    multiline={true} 
                  />
                </p>
                <p>
                  <EditableText 
                    settingKey="about.intro.p3" 
                    defaultText="At JADMAA, we believe martial arts are more than combat techniques — they are a way of building character, improving focus, enhancing physical health, and developing leadership qualities." 
                    multiline={true} 
                  />
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Section 3: Meet Our Founder */}
        <section className="py-12 bg-[#FAF6F0] border-b border-[#E8DDD0]" data-aos="fade-up">
          <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 space-y-6">
            <h2 className="font-heading font-medium text-2xl sm:text-3xl lg:text-[34px] text-[#2B2521] leading-[1.15]">
              <EditableText settingKey="about.founder.heading" defaultText="Meet Our Founder" />
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Founder Image & caption */}
              <div className="lg:col-span-5 space-y-2.5">
                <div className="w-full overflow-hidden rounded-[14px]">
                  <ResponsiveImage 
                    src="/images/founder.webp" 
                    alt="Bojagarajan with his master Aasan R. Rajendran of Madurai - JADMAA Varmakalai lineage" 
                    width={480}
                    height={360}
                    aspectRatio="4/3"
                    sizes="(max-width: 640px) 100vw, 480px"
                    className="w-full h-auto object-cover rounded-[14px] hover:scale-105 transition-transform duration-500 ease-out"
                  />
                </div>
                <p className="font-body text-[14px] text-[#5C5148] italic">
                  Bojagarajan with his master, Aasan R. Rajendran of Madurai
                </p>
              </div>

              {/* Founder Bio */}
              <div className="lg:col-span-7 space-y-2">
                <span className="font-body text-[13px] font-semibold text-[#5C5148] uppercase tracking-[1px] block">
                  Founder &amp; Chief Instructor
                </span>
                <h3 className="font-heading font-medium text-[22px] sm:text-[26px] text-[#2B2521] leading-[1.2]">
                  Bojagarajan
                </h3>
                <p className="font-body text-[16px] text-[#5C5148] leading-[1.6] pt-2">
                  JADMAA Varmakalai was founded by <strong>Bojagarajan</strong>, a Varmakalai practitioner with over <strong>15 years of experience</strong> in the art. He was trained in traditional Varmakalai under his master, <strong>Aasan R. Rajendran of Madurai</strong>, and carries that lineage forward today — personally training students and instructors across our Thanjavur, Kumbakonam, and Ariyalur branches.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Section 4: Why Choose JADMAA Varmakalai? */}
        <section className="py-12 bg-[#FAF6F0] border-b border-[#E8DDD0]" data-aos="fade-up">
          <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 space-y-6">
            <h2 className="font-heading font-medium text-2xl sm:text-3xl lg:text-[34px] text-[#2B2521] leading-[1.15]">
              Why Choose JADMAA Varmakalai?
            </h2>

            <div className="bg-white p-6 sm:p-8 rounded-[14px] border border-[#E8DDD0]">
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8 font-body text-[15px] text-[#2B2521]">
                {whyChooseItems.map((item) => (
                  <li key={item} className="flex items-start space-x-2.5 animate-list-item group">
                    <CheckCircle2 className="w-4 h-4 text-[#B12B2B] flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <span className="leading-[1.5] group-hover:text-[#B12B2B] transition-colors">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Section 5: Vision & Mission (2 boxes side-by-side) */}
        <section className="py-12 bg-[#FAF6F0] border-b border-[#E8DDD0]" data-aos="fade-up">
          <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-white p-6 sm:p-8 rounded-[14px] border border-[#E8DDD0] space-y-3">
                <h3 className="font-heading font-medium text-[22px] text-[#2B2521] leading-[1.2]">
                  Our Vision
                </h3>
                <p className="font-body text-[16px] text-[#5C5148] leading-[1.6]">
                  To become one of India's most trusted Varmakalai schools by preserving this ancient martial tradition and making it accessible to future generations through quality education and disciplined training.
                </p>
              </div>

              <div className="bg-white p-6 sm:p-8 rounded-[14px] border border-[#E8DDD0] space-y-3">
                <h3 className="font-heading font-medium text-[22px] text-[#2B2521] leading-[1.2]">
                  Our Mission
                </h3>
                <p className="font-body text-[16px] text-[#5C5148] leading-[1.6]">
                  To inspire individuals to live healthier, stronger, and more confident lives by providing authentic Varmakalai education that develops physical fitness, self-defence ability, mental focus, discipline, and respect while protecting the cultural heritage of Tamil martial arts and traditional Varma treatment practices.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Section 6: Your best choice & Learn from best instructors */}
        <section className="py-12 bg-[#FAF6F0] border-b border-[#E8DDD0]" data-aos="fade-up">
          <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-white p-6 sm:p-8 rounded-[14px] border border-[#E8DDD0] space-y-3">
                <h3 className="font-heading font-medium text-[22px] text-[#2B2521] leading-[1.2]">
                  Your best choice for martial arts training
                </h3>
                <p className="font-body text-[16px] text-[#5C5148] leading-[1.6]">
                  Based on this strong traditional foundation, JADMAA Varmakalai Academy was established. Our training system goes beyond self-defense. It is designed as a holistic program that develops: Body-mind coordination, Discipline, Confidence, Energy control, Character development
                </p>
              </div>

              <div className="bg-white p-6 sm:p-8 rounded-[14px] border border-[#E8DDD0] space-y-4">
                <h3 className="font-heading font-medium text-[22px] text-[#2B2521] leading-[1.2]">
                  Learn from the best martial arts instructors around
                </h3>
                <p className="font-body text-[16px] text-[#5C5148] leading-[1.6]">
                  Students are taught structured levels including:
                </p>
                <ul className="space-y-2 font-body text-[15px] text-[#2B2521]">
                  {structuredLevels.map((lvl) => (
                    <li key={lvl} className="flex items-center space-x-2.5 animate-list-item group">
                      <CheckCircle2 className="w-4 h-4 text-[#B12B2B] flex-shrink-0 group-hover:scale-110 transition-transform" />
                      <span className="group-hover:text-[#B12B2B] transition-colors">{lvl}</span>
                    </li>
                  ))}
                </ul>
                <p className="font-body text-[16px] text-[#5C5148] leading-[1.6] pt-1">
                  Each student progresses from beginner to advanced stages, with opportunities to become professional instructors based on skill and discipline.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Section 7: Join Now CTA */}
        <section className="py-12 sm:py-16 bg-[#FAF6F0]" data-aos="fade-up">
          <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
            <p className="font-body text-[16px] text-[#5C5148] leading-[1.6]">
              JADMAA Varmakalai welcomes everyone — from beginners taking their first step into martial arts to dedicated practitioners seeking advanced Varmakalai knowledge. Join us and become part of a community committed to preserving tradition while building strength for the future.
            </p>
            <div>
              <Link 
                to="/contact" 
                className="inline-block bg-[#B12B2B] hover:bg-[#8F2020] text-white font-semibold text-[15px] px-7 py-3 rounded-[8px] transition-colors"
              >
                Join Now
              </Link>
            </div>
          </div>
        </section>

      </div>
    </>
  );
};