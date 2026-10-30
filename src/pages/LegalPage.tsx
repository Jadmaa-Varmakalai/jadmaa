import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { ShieldCheck, FileText, RefreshCw, ArrowLeft } from 'lucide-react';

export const LegalPage: React.FC = () => {
  const location = useLocation();
  const path = location.pathname.toLowerCase();

  let type: 'privacy' | 'terms' | 'refund' = 'privacy';
  if (path.includes('terms')) {
    type = 'terms';
  } else if (path.includes('refund')) {
    type = 'refund';
  }

  const titles = {
    privacy: 'Privacy Policy',
    terms: 'Terms & Conditions',
    refund: 'Refund & Cancellation Policy',
  };

  const descriptions = {
    privacy: 'Learn how JADMAA Varmakalai collects, protects, and manages your personal information.',
    terms: 'Review terms of service, enrollment policies, and usage conditions for JADMAA LMS and Academy programs.',
    refund: 'Understand the cancellation, refund, and fee policies for JADMAA courses and online training programs.',
  };

  return (
    <>
      <SEO
        title={`${titles[type]} | JADMAA Varmakalai`}
        description={descriptions[type]}
      />

      <div className="bg-[#FAF6F0] min-h-screen py-10 px-4 sm:px-6">
        <div className="max-w-[900px] mx-auto text-left">
          
          <div className="mb-6">
            <Link
              to="/"
              className="inline-flex items-center text-sm font-semibold text-[#B12B2B] hover:text-[#8E1C1C] transition-colors gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
          </div>

          <article className="bg-white rounded-2xl p-6 sm:p-10 md:p-12 border border-[#E8DDD0] shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 text-[#B12B2B] flex items-center justify-center border border-red-100">
                {type === 'privacy' && <ShieldCheck className="w-6 h-6" />}
                {type === 'terms' && <FileText className="w-6 h-6" />}
                {type === 'refund' && <RefreshCw className="w-6 h-6" />}
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-[#B12B2B] block">
                  JADMAA Legal &amp; Compliance
                </span>
                <h1 className="font-heading font-bold text-2xl sm:text-3xl text-[#2B2521] leading-tight">
                  {titles[type]}
                </h1>
              </div>
            </div>

            <div className="text-xs text-[#7A6E65] border-b border-[#F0EBE3] pb-4 mb-6">
              Last Updated: October 2026 • JADMAA Varmakalai Academy
            </div>

            <div className="text-[15px] sm:text-[16px] text-[#4A4038] leading-[1.8] space-y-6">
              {type === 'privacy' && (
                <>
                  <section className="space-y-3">
                    <h2 className="font-heading font-bold text-lg sm:text-xl text-[#2B2521]">1. Information We Collect</h2>
                    <p>
                      JADMAA Varmakalai Academy collects basic student registration details including your name, email address, phone number, and branch or training preferences when you register, purchase a course, or submit an inquiry. Payment credentials (such as UPI IDs, cards, and net banking details) are processed securely through certified RBI-compliant payment gateways (Razorpay) and are never stored on our servers.
                    </p>
                  </section>

                  <section className="space-y-3">
                    <h2 className="font-heading font-bold text-lg sm:text-xl text-[#2B2521]">2. How We Use Your Information</h2>
                    <p>
                      We utilize your information solely to deliver your LMS course curriculum, manage certificate issuances, communicate class schedules, provide student support, and verify attendance at in-person training branches in Thanjavur, Kumbakonam, and Ariyalur. We do not sell or lease your personal information to third parties.
                    </p>
                  </section>

                  <section className="space-y-3">
                    <h2 className="font-heading font-bold text-lg sm:text-xl text-[#2B2521]">3. Data Security &amp; Storage</h2>
                    <p>
                      Your student profile data and course progress are maintained in encrypted relational databases and certified cloud storage infrastructure. Access to administrative systems is strictly role-gated with modern password hashing (bcrypt) and cryptographic session verification.
                    </p>
                  </section>

                  <section className="space-y-3">
                    <h2 className="font-heading font-bold text-lg sm:text-xl text-[#2B2521]">4. Contact Our Privacy Officer</h2>
                    <p>
                      For inquiries or data privacy requests, you may contact our administrative team at <a href="mailto:info@jadmaa.com" className="text-[#B12B2B] font-semibold underline">info@jadmaa.com</a> or call our registered helpline at <span className="font-mono text-[#2B2521]">+91 93452 20020</span>.
                    </p>
                  </section>
                </>
              )}

              {type === 'terms' && (
                <>
                  <section className="space-y-3">
                    <h2 className="font-heading font-bold text-lg sm:text-xl text-[#2B2521]">1. Acceptance of Terms</h2>
                    <p>
                      By accessing or purchasing training from JADMAA Varmakalai Academy (online or offline), you agree to abide by these Terms and Conditions and our Academy code of conduct.
                    </p>
                  </section>

                  <section className="space-y-3">
                    <h2 className="font-heading font-bold text-lg sm:text-xl text-[#2B2521]">2. Course Access &amp; Intellectual Property</h2>
                    <p>
                      Course videos, lesson curriculum, and training manuals are the exclusive intellectual property of JADMAA Varmakalai and Master Bojagarajan. Student licenses are strictly personal and non-transferable. Screen recording, unauthorized distribution, or commercial reproduction of proprietary training videos is strictly prohibited.
                    </p>
                  </section>

                  <section className="space-y-3">
                    <h2 className="font-heading font-bold text-lg sm:text-xl text-[#2B2521]">3. Traditional Varma Practice Safety</h2>
                    <p>
                      Varmakalai is a traditional martial art and body science. Students agree to practice techniques only under qualified instructor supervision and never utilize techniques to initiate harm, bullying, or violence. Students with pre-existing medical conditions should consult a physician before rigorous physical training.
                    </p>
                  </section>

                  <section className="space-y-3">
                    <h2 className="font-heading font-bold text-lg sm:text-xl text-[#2B2521]">4. Certificate Eligibility</h2>
                    <p>
                      Official verified certificates are granted only upon 100% completion of course lessons and verification of technical proficiency by authorized JADMAA instructors.
                    </p>
                  </section>
                </>
              )}

              {type === 'refund' && (
                <>
                  <section className="space-y-3">
                    <h2 className="font-heading font-bold text-lg sm:text-xl text-[#2B2521]">1. Online Digital LMS Courses</h2>
                    <p>
                      Due to the immediate access granted to proprietary recorded video lessons, digital course fees are non-refundable once enrollment has been unlocked and course content accessed. If you experience technical access issues, our support team will resolve them promptly.
                    </p>
                  </section>

                  <section className="space-y-3">
                    <h2 className="font-heading font-bold text-lg sm:text-xl text-[#2B2521]">2. In-Person Branch Enrollments</h2>
                    <p>
                      Students enrolling for offline training batches may request a batch transfer or refund prior to the commencement of their batch. Once in-person classes have commenced, fees paid are non-refundable but may be frozen or transferred to another session with written management approval.
                    </p>
                  </section>

                  <section className="space-y-3">
                    <h2 className="font-heading font-bold text-lg sm:text-xl text-[#2B2521]">3. Duplicate or Accidental Transactions</h2>
                    <p>
                      In the event of duplicate billing or payment gateway glitches where multiple deductions occurred for a single course, the excess deduction will be refunded in full to the original payment source within 5–7 business days via Razorpay.
                    </p>
                  </section>

                  <section className="space-y-3">
                    <h2 className="font-heading font-bold text-lg sm:text-xl text-[#2B2521]">4. Refund Inquiries</h2>
                    <p>
                      To request assistance with any payment or billing query, please email <a href="mailto:info@jadmaa.com" className="text-[#B12B2B] font-semibold underline">info@jadmaa.com</a> with your Order ID or transaction reference.
                    </p>
                  </section>
                </>
              )}
            </div>

            <div className="mt-10 pt-6 border-t border-[#E8DDD0] flex flex-wrap gap-4 text-xs font-semibold text-[#7A6E65]">
              <Link to="/privacy-policy" className={`hover:text-[#B12B2B] transition-colors ${type === 'privacy' ? 'text-[#B12B2B] underline' : ''}`}>
                Privacy Policy
              </Link>
              <span>•</span>
              <Link to="/terms" className={`hover:text-[#B12B2B] transition-colors ${type === 'terms' ? 'text-[#B12B2B] underline' : ''}`}>
                Terms &amp; Conditions
              </Link>
              <span>•</span>
              <Link to="/refund-policy" className={`hover:text-[#B12B2B] transition-colors ${type === 'refund' ? 'text-[#B12B2B] underline' : ''}`}>
                Refund Policy
              </Link>
            </div>
          </article>

        </div>
      </div>
    </>
  );
};
