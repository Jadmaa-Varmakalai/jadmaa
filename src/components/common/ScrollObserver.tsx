import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';

/**
 * ScrollObserver:
 * 1. Resets window scroll on route change.
 * 2. Uses native browser IntersectionObserver (100% reliable across all laptops, desktops, and mobile)
 *    to trigger smooth fade-up slide animation as elements enter viewport.
 * 3. Also runs AOS for full parity across devices.
 */
export const ScrollObserver: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Initialize AOS with smooth timing
    try {
      AOS.init({
        duration: 850,
        easing: 'ease-out-cubic',
        once: true,
        offset: 40,
        delay: 0,
        disable: false,
        mirror: false,
      });
    } catch (_) {}
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });

    let observer: IntersectionObserver | null = null;
    let mutationObserver: MutationObserver | null = null;

    const setupObserver = () => {
      if (observer) observer.disconnect();

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('aos-animate');
              entry.target.classList.add('is-revealed');
              observer?.unobserve(entry.target);
            }
          });
        },
        {
          root: null,
          rootMargin: '0px 0px -40px 0px',
          threshold: 0.05,
        }
      );

      const elements = document.querySelectorAll(
        '[data-aos], section:not(.no-aos), .reveal-on-scroll'
      );

      elements.forEach((el) => {
        if (!el.getAttribute('data-aos') && el.tagName.toLowerCase() === 'section') {
          el.setAttribute('data-aos', 'fade-up');
        }
        if (!el.classList.contains('is-revealed') && !el.classList.contains('aos-animate')) {
          observer?.observe(el);
        }
      });

      try {
        AOS.refresh();
      } catch (_) {}
    };

    // Run setup immediately, then at 80ms and 250ms for asynchronous content
    setupObserver();
    const t1 = setTimeout(setupObserver, 80);
    const t2 = setTimeout(setupObserver, 250);

    // Watch for dynamically added elements (like loaded courses or blogs)
    mutationObserver = new MutationObserver(() => {
      setupObserver();
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (observer) observer.disconnect();
      if (mutationObserver) mutationObserver.disconnect();
    };
  }, [location.pathname]);

  return null;
};
