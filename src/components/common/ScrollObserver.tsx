import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';

/**
 * ScrollObserver:
 * 1. Smoothly resets window scroll on route change.
 * 2. Initializes and manages AOS (Animate On Scroll) globally across all devices.
 * 3. Auto-tags standard page sections and refreshes dynamically rendered content.
 */
export const ScrollObserver: React.FC = () => {
  const location = useLocation();

  // Initialize AOS once on mount
  useEffect(() => {
    AOS.init({
      duration: 650,
      easing: 'ease-out-cubic',
      once: true,
      offset: 50,
      delay: 0,
      disable: false, // Explicitly false so it runs on desktop, tablets, and mobile!
      mirror: false,
      anchorPlacement: 'top-bottom',
    });
  }, []);

  // Handle route change: scroll to top and refresh AOS
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });

    // Auto-tag major sections so any page automatically has smooth scroll reveal
    const autoTag = () => {
      document.querySelectorAll('section:not([data-aos]):not(.no-aos), .animate-on-scroll:not([data-aos])').forEach((el) => {
        el.setAttribute('data-aos', 'fade-up');
      });
      AOS.refreshHard();
    };

    autoTag();

    const t1 = setTimeout(() => {
      autoTag();
      AOS.refresh();
    }, 100);

    const t2 = setTimeout(() => {
      autoTag();
      AOS.refresh();
    }, 300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [location.pathname]);

  // Observer to refresh AOS when async content (courses, blogs, testimonials) mounts
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const observer = new MutationObserver(() => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        AOS.refresh();
      }, 100);
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return null;
};
