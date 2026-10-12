import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, ChevronUp } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

export const Footer: React.FC = () => {
  const { settings } = useSettings();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const phonePrimary = settings['site.footer.phone'] || '+91 93452 20020';
  const phoneSecondary = '+91 96554 57500';
  const email = settings['site.footer.email'] || 'info@jadmaa.com';

  return (
    <footer className="w-full bg-[#2B2521] text-[#E8DDD0] border-t-0 text-left relative font-sans overflow-x-hidden">
      {/* Upper Content Section */}
      <div className="w-full max-w-[1200px] mx-auto px-5 sm:px-6 md:px-8 pt-8 sm:pt-10 pb-6 sm:pb-8">
        
        {/* Mobile: Logo & Social Header (Full width centered above columns) */}
        <div className="w-full flex flex-col items-center text-center mb-8 md:hidden">
          <Link to="/" className="inline-block mb-3">
            <img
              src="/images/logo-1.png"
              alt="JADMAA Varmakalai Academy logo"
              className="w-[120px] h-auto object-contain mx-auto"
            />
          </Link>
          
          <h4 className="font-heading font-bold text-[18px] text-[#FAF6F0] tracking-[0.5px] mb-4">
            JADMAA <span className="text-[#E8615C]">VARMAKALAI</span>
          </h4>

          {/* Social Icons Pill Grid */}
          <div className="flex items-center justify-center space-x-3">
            {/* Instagram */}
            <a
              href={settings['site.footer.social.instagram'] || 'https://www.instagram.com/jadmaavarmakalai/'}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="w-10 h-10 rounded-full bg-[rgba(250,246,240,0.08)] border border-[rgba(250,246,240,0.18)] hover:bg-[#E8615C] text-[#FAF6F0] hover:text-[#2B2521] flex items-center justify-center transition-all duration-200"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>

            {/* Facebook */}
            <a
              href={settings['site.footer.social.facebook'] || 'https://www.facebook.com/profile.php?id=61591816677608'}
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="w-10 h-10 rounded-full bg-[rgba(250,246,240,0.08)] border border-[rgba(250,246,240,0.18)] hover:bg-[#E8615C] text-[#FAF6F0] hover:text-[#2B2521] flex items-center justify-center transition-all duration-200"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.592 0 9 1.583 9 4.615V8z" />
              </svg>
            </a>

            {/* YouTube */}
            <a
              href={settings['site.footer.social.youtube'] || 'https://www.youtube.com/@JADMAAVarmakalai'}
              target="_blank"
              rel="noreferrer"
              aria-label="YouTube"
              className="w-10 h-10 rounded-full bg-[rgba(250,246,240,0.08)] border border-[rgba(250,246,240,0.18)] hover:bg-[#E8615C] text-[#FAF6F0] hover:text-[#2B2521] flex items-center justify-center transition-all duration-200"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
              </svg>
            </a>

            {/* WhatsApp Community */}
            <a
              href="https://chat.whatsapp.com/BOdavYeDSMJ0xREnzyelJh"
              target="_blank"
              rel="noreferrer"
              aria-label="Join JADMAA WhatsApp community"
              className="w-10 h-10 rounded-full bg-[rgba(250,246,240,0.08)] border border-[rgba(250,246,240,0.18)] hover:bg-[#E8615C] text-[#FAF6F0] hover:text-[#2B2521] flex items-center justify-center transition-all duration-200"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Desktop 5-Columns & Mobile 2x2 Grid (50/50 clean split with gap-x-4) */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-x-4 sm:gap-x-6 md:gap-x-6 gap-y-7 sm:gap-y-8">
          
          {/* Desktop Only Column 1: Logo & Socials */}
          <div className="hidden md:flex md:flex-col md:items-center md:text-center">
            <Link to="/" className="inline-block mb-2.5">
              <img
                src="/images/logo-1.png"
                alt="JADMAA Varmakalai Academy logo"
                className="w-[125px] h-auto object-contain mx-auto"
              />
            </Link>
            
            <h4 className="font-heading font-bold text-[17px] text-[#FAF6F0] tracking-[0.5px] mb-3">
              JADMAA <span className="text-[#E8615C]">VARMAKALAI</span>
            </h4>

            {/* Social Icons Pill Grid */}
            <div className="flex items-center justify-center space-x-2">
              <a
                href={settings['site.footer.social.instagram'] || 'https://www.instagram.com/jadmaavarmakalai/'}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="w-8.5 h-8.5 rounded-full bg-[rgba(250,246,240,0.08)] border border-[rgba(250,246,240,0.18)] hover:bg-[#E8615C] text-[#FAF6F0] hover:text-[#2B2521] flex items-center justify-center transition-all duration-200"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              <a
                href={settings['site.footer.social.facebook'] || 'https://www.facebook.com/profile.php?id=61591816677608'}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="w-8.5 h-8.5 rounded-full bg-[rgba(250,246,240,0.08)] border border-[rgba(250,246,240,0.18)] hover:bg-[#E8615C] text-[#FAF6F0] hover:text-[#2B2521] flex items-center justify-center transition-all duration-200"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.592 0 9 1.583 9 4.615V8z" />
                </svg>
              </a>

              <a
                href={settings['site.footer.social.youtube'] || 'https://www.youtube.com/@JADMAAVarmakalai'}
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
                className="w-8.5 h-8.5 rounded-full bg-[rgba(250,246,240,0.08)] border border-[rgba(250,246,240,0.18)] hover:bg-[#E8615C] text-[#FAF6F0] hover:text-[#2B2521] flex items-center justify-center transition-all duration-200"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                </svg>
              </a>

              <a
                href="https://chat.whatsapp.com/BOdavYeDSMJ0xREnzyelJh"
                target="_blank"
                rel="noreferrer"
                aria-label="Join JADMAA WhatsApp community"
                className="w-8.5 h-8.5 rounded-full bg-[rgba(250,246,240,0.08)] border border-[rgba(250,246,240,0.18)] hover:bg-[#E8615C] text-[#FAF6F0] hover:text-[#2B2521] flex items-center justify-center transition-all duration-200"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Branches */}
          <div className="flex flex-col min-w-0">
            <h4 className="font-heading font-semibold text-[17px] text-[#FAF6F0] mb-3 sm:mb-3.5">
              Branches
            </h4>
            <ul className="space-y-3 text-[14px] text-[#E8DDD0]">
              <li className="flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5 text-[#B12B2B] flex-shrink-0" />
                <span className="font-medium text-[#E8DDD0] truncate">Thanjavur</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5 text-[#B12B2B] flex-shrink-0" />
                <span className="font-medium text-[#E8DDD0] truncate">Kumbakonam</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5 text-[#B12B2B] flex-shrink-0" />
                <span className="font-medium text-[#E8DDD0] truncate">Ariyalur</span>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div className="flex flex-col min-w-0">
            <h4 className="font-heading font-semibold text-[17px] text-[#FAF6F0] mb-3 sm:mb-3.5">
              Contact
            </h4>
            <ul className="space-y-3 text-[14px] text-[#E8DDD0]">
              <li>
                <a
                  href={`tel:${phonePrimary.replace(/\s+/g, '')}`}
                  className="flex items-center space-x-2 hover:text-white transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-[#B12B2B] flex-shrink-0" />
                  <span className="font-mono text-[13px] sm:text-[14px] truncate">{phonePrimary}</span>
                </a>
              </li>
              <li>
                <a
                  href={`tel:${phoneSecondary.replace(/\s+/g, '')}`}
                  className="flex items-center space-x-2 hover:text-white transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-[#B12B2B] flex-shrink-0" />
                  <span className="font-mono text-[13px] sm:text-[14px] truncate">{phoneSecondary}</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${email}`}
                  className="flex items-center space-x-2 hover:text-white transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-[#B12B2B] flex-shrink-0" />
                  <span className="text-[13px] sm:text-[14px] break-all">{email}</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Company */}
          <div className="flex flex-col min-w-0">
            <h4 className="font-heading font-semibold text-[17px] text-[#FAF6F0] mb-3 sm:mb-3.5">
              Company
            </h4>
            <ul className="space-y-2 text-[14px] text-[#E8DDD0]">
              <li>
                <Link to="/about" className="hover:text-[#B12B2B] transition-colors block py-0.5">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/courses" className="hover:text-[#B12B2B] transition-colors block py-0.5">
                  Courses
                </Link>
              </li>
              <li>
                <Link to="/treatment" className="text-[#B12B2B] hover:text-[#d33a3a] transition-colors block py-0.5">
                  Varma Treatment
                </Link>
              </li>
              <li>
                <Link to="/careers" className="hover:text-[#B12B2B] transition-colors block py-0.5">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-[#B12B2B] transition-colors block py-0.5">
                  FAQs
                </Link>
              </li>
              <li>
                <Link to="/instructor/login" className="hover:text-[#B12B2B] transition-colors block py-0.5">
                  Instructor Login
                </Link>
              </li>
              <li>
                <Link to="/live-classes" className="hover:text-[#B12B2B] transition-colors block py-0.5">
                  Live Class Enquiry
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-[#B12B2B] transition-colors block py-0.5">
                  Student Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Legal */}
          <div className="flex flex-col min-w-0">
            <h4 className="font-heading font-semibold text-[17px] text-[#FAF6F0] mb-3 sm:mb-3.5">
              Legal
            </h4>
            <ul className="space-y-2 text-[14px] text-[#E8DDD0]">
              <li>
                <Link to="/privacy-policy" className="hover:text-[#B12B2B] transition-colors block py-0.5">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-[#B12B2B] transition-colors block py-0.5">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="hover:text-[#B12B2B] transition-colors block py-0.5">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

        </div>

      </div>

      {/* Divider */}
      <div className="w-full border-t border-[rgba(255,255,255,0.12)] max-w-[1200px] mx-auto px-5 sm:px-6" />

      {/* Bottom Copyright Bar */}
      <div className="w-full py-5 px-5 sm:px-6 text-center text-[13px] sm:text-[14px] text-[#FFFFFF]">
        <p className="m-0">
          &copy; {new Date().getFullYear()} JADMAA Varmakalai. All rights reserved.
        </p>
      </div>

      {/* Astra scroll to top button - bottom right */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="fixed bottom-7 right-7 z-40 w-8.5 h-8.5 rounded bg-[#046BD2] hover:bg-[#0359b0] text-white flex items-center justify-center shadow-md transition-all duration-200"
        >
          <ChevronUp className="w-5 h-5 stroke-[2.5]" />
        </button>
      )}
    </footer>
  );
};
