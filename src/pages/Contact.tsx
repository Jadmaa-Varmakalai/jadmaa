import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { Phone, Mail, CheckCircle2, MessageCircle, Send, Loader2 } from 'lucide-react';
import { EditableText } from '../components/common/EditableText';
import { courseApi } from '../lib/api/courseApi';
import type { Course } from '../types';
import { adminApi } from '../lib/api/adminApi';

type EnquiryType = 'ONLINE_CLASS' | 'OFFLINE_CLASS' | 'VARMA_TREATMENT';

export const Contact: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialType: EnquiryType = (() => {
    const t = (searchParams.get('type') || searchParams.get('enquiryType') || '').toLowerCase();
    if (t === 'treatment' || t === 'varma_treatment') return 'VARMA_TREATMENT';
    if (t === 'offline' || t === 'offline_class') return 'OFFLINE_CLASS';
    return 'ONLINE_CLASS';
  })();

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    enquiryType: initialType,
    selectedCourse: '',
    city: 'Thanjavur',
    message: ''
  });

  const [courses, setCourses] = useState<Course[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [lastSubmittedData, setLastSubmittedData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const t = (searchParams.get('type') || searchParams.get('enquiryType') || '').toLowerCase();
    if (t === 'treatment' || t === 'varma_treatment') {
      setFormData(prev => ({ ...prev, enquiryType: 'VARMA_TREATMENT' }));
    }
  }, [searchParams]);

  useEffect(() => {
    courseApi.getCourses().then((list) => {
      setCourses(list);
      if (list.length > 0 && !formData.selectedCourse) {
        setFormData((prev) => ({ ...prev, selectedCourse: list[0].title }));
      }
    }).catch((err) => {
      console.warn('Failed to load courses for contact dropdown:', err);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.name.trim() || !formData.mobile.trim()) {
      alert('Please fill in your name and mobile number.');
      return;
    }

    setSubmitting(true);

    const isTreatment = formData.enquiryType === 'VARMA_TREATMENT';
    const isOnline = formData.enquiryType === 'ONLINE_CLASS';
    const isOffline = formData.enquiryType === 'OFFLINE_CLASS';

    const payload = {
      name: formData.name.trim(),
      mobile: formData.mobile.trim(),
      email: formData.email.trim(),
      category: isTreatment ? 'TREATMENT' : 'CLASS',
      type: formData.enquiryType,
      courseTitle: isOnline ? (formData.selectedCourse || 'Online Varmakalai Training') : undefined,
      location: (isOffline || isTreatment) ? formData.city : undefined,
      message: formData.message.trim(),
    };

    try {
      await adminApi.submitEnquiry(payload);
      setLastSubmittedData(payload);
      setSubmitted(true);
    } catch (err: any) {
      console.error('Submission failed:', err);
      // Still show success or allow graceful fallback
      setLastSubmittedData(payload);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const getWhatsAppMessageUrl = () => {
    if (!lastSubmittedData) return '';
    const typeLabel =
      lastSubmittedData.type === 'ONLINE_CLASS'
        ? `Online Class (${lastSubmittedData.courseTitle || 'Varmakalai'})`
        : lastSubmittedData.type === 'OFFLINE_CLASS'
        ? `Offline Class (Branch: ${lastSubmittedData.location || 'Thanjavur'})`
        : `Varma Treatment (Branch: ${lastSubmittedData.location || 'Thanjavur'})`;

    const text = encodeURIComponent(
      `Hello JADMAA,\n\nI have submitted an enquiry:\n- Name: ${lastSubmittedData.name}\n- Mobile: ${lastSubmittedData.mobile}\n- Interest: ${typeLabel}${lastSubmittedData.message ? `\n- Note: ${lastSubmittedData.message}` : ''}\n\nPlease get in touch with me.`
    );
    // Primary academy contact: +91 93452 20020
    return `https://wa.me/919345220020?text=${text}`;
  };

  return (
    <>
      <SEO 
        title="Contact JADMAA Varmakalai | We'd Love to Hear From You"
        description="Contact JADMAA Varmakalai for admissions, trial classes, or Varma treatment across our Thanjavur, Kumbakonam, and Ariyalur branches."
      />

      <div className="bg-[#FAF6F0] min-h-screen font-body text-[#2B2521] text-left">
        
        {/* Banner Section */}
        <section className="bg-jadmaa-cream py-12 border-b border-jadmaa-border text-left" data-aos="fade-up">
          <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 space-y-3">
            <span className="text-base md:text-lg font-bold text-jadmaa-red uppercase tracking-wider block">
              <EditableText settingKey="contact.hero.eyebrow" defaultText="Get In Touch" />
            </span>
            <h2 className="font-heading font-medium text-3xl sm:text-4xl lg:text-5xl text-jadmaa-charcoal">
              <EditableText settingKey="contact.title" defaultText="Contact JADMAA Varmakalai" />
            </h2>
            <p className="text-base md:text-lg text-jadmaa-textMuted max-w-2xl">
              <EditableText 
                settingKey="contact.description" 
                defaultText="Whether you're interested in joining our Varmakalai (Varma Kalai) martial arts training programs, booking a trial class, asking about Varma treatment, or becoming part of our instructor network, our team is here to help."
                multiline
              />
            </p>
          </div>
        </section>

        {/* Contact Info + Enquiry Form Grid */}
        <section className="py-12 bg-[#FAF6F0] border-b border-[#E8DDD0]">
          <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Phone, Email, Connect */}
              <div className="lg:col-span-5 space-y-6" data-aos="fade-up">
                
                {/* Phone Card */}
                <div className="bg-white p-6 rounded-[14px] border border-[#E8DDD0] space-y-3">
                  <h4 className="font-heading font-semibold text-[18px] text-[#2B2521] leading-[1.2]">
                    Phone
                  </h4>
                  <ul className="space-y-2 text-[15px] font-body text-[#2B2521]">
                    <li>
                      <a href="tel:+919345220020" className="inline-flex items-center space-x-2.5 text-[#2B2521] hover:text-[#B12B2B] transition-colors">
                        <Phone className="w-4 h-4 text-[#B12B2B]" />
                        <span>+91 93452 20020</span>
                      </a>
                    </li>
                    <li>
                      <a href="tel:+919655457500" className="inline-flex items-center space-x-2.5 text-[#2B2521] hover:text-[#B12B2B] transition-colors">
                        <Phone className="w-4 h-4 text-[#B12B2B]" />
                        <span>+91 96554 57500</span>
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Email Card */}
                <div className="bg-white p-6 rounded-[14px] border border-[#E8DDD0] space-y-3">
                  <h4 className="font-heading font-semibold text-[18px] text-[#2B2521] leading-[1.2]">
                    Email
                  </h4>
                  <ul className="text-[15px] font-body text-[#2B2521]">
                    <li>
                      <a href="mailto:info@jadmaa.com" className="inline-flex items-center space-x-2.5 text-[#2B2521] hover:text-[#B12B2B] transition-colors">
                        <Mail className="w-4 h-4 text-[#B12B2B]" />
                        <span>info@jadmaa.com</span>
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Connect With Us Card */}
                <div className="bg-white p-6 rounded-[14px] border border-[#E8DDD0] space-y-3">
                  <h4 className="font-heading font-semibold text-[18px] text-[#2B2521] leading-[1.2]">
                    Connect With Us
                  </h4>
                  <p className="font-body text-[15px] text-[#5C5148] leading-[1.6]">
                    Stay connected with JADMAA Varmakalai for training updates, workshops, self-defence tips, and student success stories.
                  </p>
                  <div className="pt-1">
                    <a 
                      href="https://whatsapp.com/channel/0029VbDzWmJKQuJDkFXMU03d"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-[#B12B2B] hover:bg-[#8F2020] text-white font-semibold text-[15px] px-6 py-2.5 rounded-[8px] transition-colors"
                    >
                      Join Our WhatsApp Channel
                    </a>
                  </div>
                </div>

              </div>

              {/* Right Column: Enquiry Form */}
              <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-[14px] border border-[#E8DDD0] space-y-4" data-aos="fade-up" data-aos-delay="100">
                <div>
                  <h3 className="font-heading font-semibold text-[22px] text-[#2B2521] leading-[1.2]">
                    Send Us an Enquiry
                  </h3>
                  <p className="font-body text-[15px] text-[#5C5148] leading-[1.6] mt-1">
                    Fill out the form below and our team will get back to you as soon as possible.
                  </p>
                </div>

                {submitted ? (
                  <div className="p-6 sm:p-8 bg-[#FAF6F0] rounded-[12px] border border-[#E8DDD0] text-center space-y-4">
                    <CheckCircle2 className="w-12 h-12 text-[#228B22] mx-auto" />
                    <div>
                      <h4 className="font-heading font-bold text-[20px] text-[#2B2521]">Thank you for your enquiry!</h4>
                      <p className="font-body text-[14px] text-[#5C5148] mt-1">
                        Our master instructors will reach out to you at <strong>{lastSubmittedData?.mobile}</strong> shortly.
                      </p>
                    </div>

                    {/* Instant WhatsApp Connect */}
                    <div className="bg-white p-4 rounded-[10px] border border-[#E8DDD0] space-y-2 text-left">
                      <p className="text-xs font-semibold text-[#5C5148] uppercase tracking-wider">
                        Want a faster response?
                      </p>
                      <p className="text-sm text-[#2B2521]">
                        You can send this enquiry directly to our Aasan via WhatsApp with one click:
                      </p>
                      <a
                        href={getWhatsAppMessageUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-semibold text-[14px] rounded-[8px] transition-colors shadow-sm"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Send via WhatsApp to +91 93452 20020
                      </a>
                    </div>

                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setLastSubmittedData(null);
                      }}
                      className="text-[13px] font-semibold text-[#B12B2B] hover:underline cursor-pointer pt-2"
                    >
                      ← Submit another enquiry
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#5C5148] mb-1">Full Name *</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. Ramesh Kumar"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-[8px] border border-[#E8DDD0] bg-white text-[15px] text-[#2B2521] placeholder-[#5C5148]/60 focus:border-[#B12B2B] outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-[#5C5148] mb-1">Mobile / WhatsApp Number *</label>
                        <input 
                          type="tel"
                          required
                          placeholder="e.g. 9876543210"
                          value={formData.mobile}
                          onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-[8px] border border-[#E8DDD0] bg-white text-[15px] text-[#2B2521] placeholder-[#5C5148]/60 focus:border-[#B12B2B] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#5C5148] mb-1">Email Address (Optional)</label>
                        <input 
                          type="email"
                          placeholder="name@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-[8px] border border-[#E8DDD0] bg-white text-[15px] text-[#2B2521] placeholder-[#5C5148]/60 focus:border-[#B12B2B] outline-none"
                        />
                      </div>
                    </div>

                    {/* Primary Interest Selector */}
                    <div>
                      <label className="block text-xs font-semibold text-[#5C5148] mb-1.5">What are you looking for? *</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, enquiryType: 'ONLINE_CLASS' })}
                          className={`py-2 px-3 text-xs sm:text-sm font-semibold rounded-[8px] border transition-all text-center cursor-pointer ${
                            formData.enquiryType === 'ONLINE_CLASS'
                              ? 'bg-[#B12B2B] text-white border-[#B12B2B] shadow-sm'
                              : 'bg-white text-[#2B2521] border-[#E8DDD0] hover:border-[#B12B2B]/50'
                          }`}
                        >
                          🌐 Online Class
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, enquiryType: 'OFFLINE_CLASS' })}
                          className={`py-2 px-3 text-xs sm:text-sm font-semibold rounded-[8px] border transition-all text-center cursor-pointer ${
                            formData.enquiryType === 'OFFLINE_CLASS'
                              ? 'bg-[#B12B2B] text-white border-[#B12B2B] shadow-sm'
                              : 'bg-white text-[#2B2521] border-[#E8DDD0] hover:border-[#B12B2B]/50'
                          }`}
                        >
                          🥋 Offline Class
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, enquiryType: 'VARMA_TREATMENT' })}
                          className={`py-2 px-3 text-xs sm:text-sm font-semibold rounded-[8px] border transition-all text-center cursor-pointer ${
                            formData.enquiryType === 'VARMA_TREATMENT'
                              ? 'bg-[#0E7490] text-white border-[#0E7490] shadow-sm'
                              : 'bg-white text-[#2B2521] border-[#E8DDD0] hover:border-[#0E7490]/50'
                          }`}
                        >
                          🌿 Varma Treatment
                        </button>
                      </div>
                    </div>

                    {/* Conditional Field: If Online Class, show Courses dropdown */}
                    {formData.enquiryType === 'ONLINE_CLASS' && (
                      <div className="animate-in fade-in duration-200">
                        <label className="block text-xs font-semibold text-[#5C5148] mb-1">Select Online Course *</label>
                        <select
                          value={formData.selectedCourse}
                          onChange={(e) => setFormData({ ...formData, selectedCourse: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-[8px] border border-[#E8DDD0] bg-white text-[15px] text-[#2B2521] focus:border-[#B12B2B] outline-none"
                        >
                          {courses.length > 0 ? (
                            courses.map((c) => (
                              <option key={c.id} value={c.title}>
                                {c.title}
                              </option>
                            ))
                          ) : (
                            <>
                              <option value="Basic Varmakalai Training">Basic Varmakalai Training</option>
                              <option value="Intermediate Varmakalai Training">Intermediate Varmakalai Training</option>
                              <option value="Advanced Varmakalai Training">Advanced Varmakalai Training</option>
                              <option value="Kids Self-Defence Training">Kids Self-Defence Training</option>
                              <option value="Self-Defence Training for ALL">Self-Defence Training for ALL</option>
                              <option value="Women's Self-Defence Program">Women's Self-Defence Program</option>
                              <option value="Weight Loss Training">Weight Loss Training</option>
                            </>
                          )}
                        </select>
                      </div>
                    )}

                    {/* Conditional Field: If Offline Class or Varma Treatment, show Branch / City selector */}
                    {(formData.enquiryType === 'OFFLINE_CLASS' || formData.enquiryType === 'VARMA_TREATMENT') && (
                      <div className="animate-in fade-in duration-200">
                        <label className="block text-xs font-semibold text-[#5C5148] mb-1">
                          Preferred Branch / Location *
                        </label>
                        <select
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-[8px] border border-[#E8DDD0] bg-white text-[15px] text-[#2B2521] focus:border-[#B12B2B] outline-none"
                        >
                          <option value="Thanjavur">📍 Thanjavur</option>
                          <option value="Kumbakonam">📍 Kumbakonam</option>
                          <option value="Ariyalur">📍 Ariyalur</option>
                        </select>
                        <p className="text-[12px] text-[#5C5148] mt-1">
                          {formData.enquiryType === 'VARMA_TREATMENT'
                            ? 'Our Varma therapists are available for direct consultations across these 3 branches.'
                            : 'Daily martial arts classes and batch sessions run across these 3 locations.'}
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-[#5C5148] mb-1">Any specific questions or health notes?</label>
                      <textarea
                        rows={3}
                        placeholder={
                          formData.enquiryType === 'VARMA_TREATMENT'
                            ? 'Please mention your health issue or pain area (e.g. back pain, joint stiffness)...'
                            : 'Ask about timings, fee structure, batch schedules, or age eligibility...'
                        }
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-[8px] border border-[#E8DDD0] bg-white text-[15px] text-[#2B2521] placeholder-[#5C5148]/60 focus:border-[#B12B2B] outline-none resize-none"
                      ></textarea>
                    </div>

                    {errorMessage && (
                      <p className="text-[13px] text-[#B12B2B]">{errorMessage}</p>
                    )}

                    <div>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="bg-[#B12B2B] hover:bg-[#8F2020] disabled:opacity-60 text-white font-semibold text-[15px] px-7 py-3 rounded-[8px] transition-colors cursor-pointer w-full sm:w-auto inline-flex items-center justify-center gap-2"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Sending Enquiry...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Submit Enquiry
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>

            </div>
          </div>
        </section>

        {/* Our Branches Section */}
        <section className="py-12 bg-[#FAF6F0] border-b border-[#E8DDD0]">
          <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 space-y-6">
            <h2 className="font-heading font-medium text-2xl sm:text-3xl lg:text-[34px] text-[#2B2521] leading-[1.15]">
              Our Branches
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Branch 1: Thanjavur */}
              <div className="bg-white p-5 sm:p-6 rounded-[14px] border border-[#E8DDD0] space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <h4 className="font-heading font-semibold text-[18px] text-[#2B2521] leading-[1.2]">
                    📍 Thanjavur Branch
                  </h4>
                  <p className="font-body text-[15px] text-[#5C5148] leading-[1.6]">
                    48, Carmel Nagar, Kaattuthottam,<br />
                    Near Mariamman Kovil Park,<br />
                    Thanjavur, Tamil Nadu.
                  </p>
                </div>
                <div className="w-full h-[220px] rounded-[10px] overflow-hidden border border-[#E8DDD0]">
                  <iframe 
                    src="https://maps.google.com/maps?q=JADMAA%20Varmakalai%2C%20Thanjavur%20-%20Nagapattinam%20Rd%2C%20Mariamman%20Kovil%2C%20Pulianthoppu%2C%20Thanjavur%2C%20Tamil%20Nadu%20613501&t=m&z=17&output=embed&iwloc=near"
                    title="JADMAA Varmakalai, Thanjavur"
                    className="w-full h-full border-0"
                    loading="lazy"
                  ></iframe>
                </div>
              </div>

              {/* Branch 2: Kumbakonam */}
              <div className="bg-white p-5 sm:p-6 rounded-[14px] border border-[#E8DDD0] space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <h4 className="font-heading font-semibold text-[18px] text-[#2B2521] leading-[1.2]">
                    📍 Kumbakonam Branch
                  </h4>
                  <p className="font-body text-[15px] text-[#5C5148] leading-[1.6]">
                    SVS Trader,<br />
                    Melakkaveri GH Back Side,<br />
                    Swamimalai Main Road,<br />
                    Kumbakonam, Tamil Nadu.
                  </p>
                </div>
                <div className="w-full h-[220px] rounded-[10px] overflow-hidden border border-[#E8DDD0]">
                  <iframe 
                    src="https://maps.google.com/maps?q=JADMAA%20Varmakalai%2C%20Jadma%20Varmakalai%20GH%20backside%2C%20Swamimalai%20Rd%2C%20Melacavery%2C%20Kumbakonam%2C%20Tamil%20Nadu%20612001&t=m&z=17&output=embed&iwloc=near"
                    title="JADMAA Varmakalai, Kumbakonam"
                    className="w-full h-full border-0"
                    loading="lazy"
                  ></iframe>
                </div>
              </div>

              {/* Branch 3: Ariyalur */}
              <div className="bg-white p-5 sm:p-6 rounded-[14px] border border-[#E8DDD0] space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <h4 className="font-heading font-semibold text-[18px] text-[#2B2521] leading-[1.2]">
                    📍 Ariyalur Branch
                  </h4>
                  <p className="font-body text-[15px] text-[#5C5148] leading-[1.6]">
                    Mr. Perfect Gym,<br />
                    Ariyalur, Tamil Nadu.
                  </p>
                </div>
                <div className="w-full h-[220px] rounded-[10px] overflow-hidden border border-[#E8DDD0]">
                  <iframe 
                    src="https://maps.google.com/maps?q=JADMAA%20Varmakalai%2C%20Mr.%20Perfect%20Gym%2C%20Ariyalur%2C%20Tamil%20Nadu&t=m&z=15&output=embed&iwloc=near"
                    title="JADMAA Varmakalai, Ariyalur"
                    className="w-full h-full border-0"
                    loading="lazy"
                  ></iframe>
                </div>
              </div>

            </div>
          </div>
        </section>

      </div>
    </>
  );
};
