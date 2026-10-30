import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { EditableText } from '../components/common/EditableText';
import { ResponsiveImage } from '../components/common/ResponsiveImage';

const careerSteps = [
  {
    step: 'Step 1 – Basic Level',
    bullets: [
      'Learn Varmakalai fundamentals and training etiquette.',
      'Build physical fitness, flexibility, coordination, and discipline.',
      'Develop confidence through practical self-defence techniques.'
    ]
  },
  {
    step: 'Step 2 – Intermediate Level',
    bullets: [
      'Enhance technical skills with advanced movements and applications.',
      'Improve speed, precision, endurance, and situational awareness.',
      'Participate in workshops, demonstrations, and events.'
    ]
  },
  {
    step: 'Step 3 – Advanced Level',
    bullets: [
      'Master advanced Varmakalai techniques and practical applications.',
      'Learn leadership, mentoring, and training methodologies.',
      'Prepare for instructor development and higher responsibilities.'
    ]
  },
  {
    step: 'Step 4 – Assistant Instructor',
    paragraph: 'Outstanding students may be invited to assist senior instructors during classes. This stage helps develop teaching ability, communication skills, classroom management, and practical coaching experience.'
  },
  {
    step: 'Step 5 – Certified Instructor',
    paragraph: "After meeting JADMAA's training standards and assessment requirements, eligible candidates may become certified instructors and teach under JADMAA Varmakalai."
  },
  {
    step: 'Step 6 – Branch Trainer',
    paragraph: 'Experienced instructors may be offered opportunities to lead training programs, conduct workshops, and support the growth of existing or new branches.'
  }
];

const opportunities = [
  'Varmakalai Instructor',
  "Women's Self-Defence Trainer",
  "Children's Martial Arts Coach",
  'Fitness & Conditioning Trainer',
  'Workshop & Seminar Trainer',
  'School & College Program Instructor',
  'Corporate Self-Defence Trainer',
  'Branch Training Coordinator',
  'Varma Treatment Specialist'
];

export const Careers: React.FC = () => {
  return (
    <>
      <SEO 
        title="Build Your Future Through Varmakalai (Varma Kalai) Martial Arts | JADMAA"
        description="From student to branch trainer. Explore career pathways as certified Varmakalai instructors, coaches, and trainers at JADMAA."
      />

      <div className="bg-[#FAF6F0] min-h-screen font-body text-[#2B2521] text-left">
        
        {/* Banner Section */}
        <section className="py-8 sm:py-12 bg-[#FAF6F0] border-b border-[#E8DDD0]" data-aos="fade-up">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              <div className="lg:col-span-7 space-y-3" data-aos="fade-up">
                <div className="text-[12px] font-bold tracking-[.08em] uppercase text-[#B12B2B]">
                  Growth &amp; Leadership
                </div>
                <h2 className="font-heading font-medium text-2xl sm:text-3xl lg:text-[40px] text-[#2B2521] leading-[1.15]">
                  <EditableText 
                    settingKey="careers.title" 
                    defaultText="Build Your Future Through Varmakalai (Varma Kalai) Martial Arts" 
                  />
                </h2>
                <div className="text-[#5C5148] text-[15.5px] leading-[1.7] pt-2">
                  At JADMAA Varmakalai, learning doesn't end with earning a certificate. We provide a structured pathway that enables dedicated students to develop their skills, gain teaching experience, and pursue rewarding opportunities in the field of martial arts.
                </div>
              </div>

              <div className="lg:col-span-5 flex justify-center" data-aos="fade-up" data-aos-delay="100">
                <div className="w-full max-w-[480px] overflow-hidden rounded-[14px]">
                  <ResponsiveImage 
                    src="/images/file_000000008884820b9a3c789a8c0be531-1024x683.png"
                    alt="Varmakalai martial arts training session at JADMAA"
                    width={480}
                    height={320}
                    sizes="(max-width: 640px) 100vw, 480px"
                    className="w-full h-auto object-cover rounded-[14px] hover:scale-105 transition-transform duration-500 ease-out"
                  />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* The Pathway: From Student to Branch Trainer */}
        <section className="py-8 sm:py-12 bg-[#FAF6F0] border-b border-[#E8DDD0]" data-aos="fade-up">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            
            <div className="text-center space-y-2">
              <div className="text-[12px] font-bold tracking-[.08em] uppercase text-[#B12B2B]">
                The pathway
              </div>
              <h2 className="font-heading font-bold text-2xl sm:text-3xl lg:text-[34px] text-[#2B2521] leading-[1.15]">
                From Student to Branch Trainer
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {careerSteps.map((stepItem, idx) => (
                <div 
                  key={stepItem.step} 
                  data-aos="fade-up"
                  data-aos-delay={idx * 80}
                  className="bg-white p-5 sm:p-6 rounded-[14px] border border-[#E8DDD0] space-y-3 flex flex-col justify-start"
                >
                  <h5 className="font-heading font-semibold text-[17px] sm:text-[18px] text-[#2B2521] leading-[1.2]">
                    {stepItem.step}
                  </h5>

                  {stepItem.bullets ? (
                    <div className="space-y-1.5 text-[14px] text-[#2B2521]">
                      {stepItem.bullets.map((b) => (
                        <div key={b} className="flex items-start gap-2">
                          <span className="text-[#B12B2B] font-bold">✓</span>
                          <span className="leading-[1.5]">{b}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[#5C5148] text-[14px] leading-[1.7]">
                      {stepItem.paragraph}
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* Where it can lead: Career Opportunities */}
        <section className="py-8 sm:py-12 bg-[#FAF6F0] border-b border-[#E8DDD0]" data-aos="fade-up">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <div className="text-[12px] font-bold tracking-[.08em] uppercase text-[#B12B2B]">
                Where it can lead
              </div>
              <h2 className="font-heading font-bold text-2xl sm:text-3xl lg:text-[34px] text-[#2B2521] leading-[1.15]">
                Career Opportunities
              </h2>
              <p className="text-[#5C5148] text-[15.5px] leading-[1.7]">
                Graduates with the required qualifications and experience may explore opportunities such as:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {opportunities.map((opp, idx) => (
                <div 
                  key={opp} 
                  data-aos="fade-up"
                  data-aos-delay={(idx % 3) * 100}
                  className="bg-white p-4 rounded-[12px] border border-[#E8DDD0] flex items-center gap-3"
                >
                  <div className="w-[22px] h-[22px] rounded-full bg-[#B12B2B] text-white text-[12px] font-bold flex items-center justify-center flex-shrink-0">
                    ✓
                  </div>
                  <div className="text-[14px] font-semibold text-[#2B2521]">
                    {opp}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* Join the path & Grow with JADMAA */}
        <section className="py-8 sm:py-12 bg-[#FAF6F0] border-b border-[#E8DDD0]" data-aos="fade-up">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Who Can Apply? */}
              <div className="bg-white p-6 sm:p-8 rounded-[14px] border border-[#E8DDD0] space-y-3" data-aos="fade-up">
                <div className="text-[12px] font-bold tracking-[.08em] uppercase text-[#B12B2B]">
                  Join the path
                </div>
                <h2 className="font-heading font-bold text-2xl sm:text-3xl text-[#2B2521] leading-[1.15]">
                  Who Can Apply?
                </h2>
                <p className="text-[#5C5148] text-[15.5px] leading-[1.7]">
                  We welcome passionate individuals who:
                </p>
                <div className="space-y-1.5 text-[14.5px] text-[#2B2521] pt-1">
                  <div className="flex items-start gap-2">
                    <span className="text-[#B12B2B] font-bold">✓</span>
                    <span>Are committed to continuous learning.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[#B12B2B] font-bold">✓</span>
                    <span>Demonstrate discipline, integrity, and leadership.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[#B12B2B] font-bold">✓</span>
                    <span>Enjoy teaching and mentoring others.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[#B12B2B] font-bold">✓</span>
                    <span>Wish to preserve and promote the heritage of Varmakalai.</span>
                  </div>
                </div>
              </div>

              {/* Grow with JADMAA */}
              <div className="bg-white p-6 sm:p-8 rounded-[14px] border border-[#E8DDD0] space-y-3 flex flex-col justify-center" data-aos="fade-up" data-aos-delay="100">
                <div className="text-[12px] font-bold tracking-[.08em] uppercase text-[#B12B2B]">
                  Grow with JADMAA
                </div>
                <div className="text-[#5C5148] text-[15.5px] leading-[1.7]">
                  Your journey at JADMAA is more than martial arts training—it is an opportunity to build confidence, develop leadership, preserve an ancient tradition, and create a meaningful career by inspiring others.
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-12 sm:py-16 bg-[#FAF6F0]" data-aos="fade-up">
          <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
            <h2 className="font-heading font-bold text-2xl sm:text-3xl lg:text-[34px] text-[#2B2521] leading-[1.15]">
              Train. Lead. Inspire. Preserve the Legacy.
            </h2>
            <div>
              <Link 
                to="/contact" 
                className="inline-block bg-[#B12B2B] hover:bg-[#8F2020] text-white font-semibold text-[15px] px-8 py-3.5 rounded-[8px] transition-colors shadow-sm hover:shadow-md"
              >
                Enquire About the Instructor Path
              </Link>
            </div>
          </div>
        </section>

      </div>
    </>
  );
};
