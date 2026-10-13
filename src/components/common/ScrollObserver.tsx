import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollObserver: Scrolls window to top smoothly on route change.
 * Implements a lightweight, consistent scroll reveal system (replacing AOS).
 */
export const ScrollObserver: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    document.documentElement.classList.add('jd-js');

    const reveal = (el: Element) => {
      el.classList.add('is-visible', 'jd-in', 'aos-animate');
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            observer.unobserve(entry.target);
            reveal(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: '40px 0px 40px 0px',
        threshold: 0.05,
      }
    );

    const observeElements = () => {
      const selectors = '[data-aos]:not(.is-observed), .reveal:not(.is-observed), .reveal-on-scroll:not(.is-observed), .reveal-child:not(.is-observed), .jd-reveal:not(.is-observed), main > section:not(.no-reveal):not(.is-observed)';
      const elements = document.querySelectorAll(selectors);
      const vh = window.innerHeight || 800;

      elements.forEach((el) => {
        el.classList.add('reveal', 'is-observed');
        
        const delay = el.getAttribute('data-aos-delay');
        if (delay) {
          (el as HTMLElement).style.transitionDelay = `${delay}ms`;
        }

        // If element is already in or above initial viewport, reveal smoothly
        const rect = el.getBoundingClientRect();
        if (rect.top < vh - 20 && rect.bottom > 0) {
          reveal(el);
        } else {
          observer.observe(el);
        }
      });
    };

    observeElements();

    // Passive scroll listener safety sweep: ensures oncoming elements animate in smoothly on scroll
    const handleScroll = () => {
      const vh = window.innerHeight || 800;
      document.querySelectorAll('.reveal:not(.is-visible), [data-aos]:not(.is-visible)').forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < vh - 20) {
          reveal(el);
          observer.unobserve(el);
        }
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Global failsafe: guarantees no element ever stays hidden if observer or scroll misses
    const failsafeTimer = setTimeout(() => {
      document.querySelectorAll('.reveal, [data-aos], .jd-reveal, .jd-sec').forEach((el) => {
        reveal(el);
      });
    }, 2500);

    const mutationObserver = new MutationObserver(() => {
      observeElements();
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(failsafeTimer);
    };
  }, [location.pathname]);

  return null;
};
