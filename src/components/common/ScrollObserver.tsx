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

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            observer.unobserve(entry.target);
            entry.target.classList.add('is-visible');
            entry.target.classList.add('jd-in');
            entry.target.classList.add('aos-animate');
          }
        });
      },
      {
        root: null,
        rootMargin: '0px 0px -6% 0px',
        threshold: 0.08,
      }
    );

    const observeElements = () => {
      const selectors = '[data-aos]:not(.is-observed), .reveal:not(.is-observed), .reveal-on-scroll:not(.is-observed), .reveal-child:not(.is-observed), .jd-reveal:not(.is-observed)';
      document.querySelectorAll(selectors).forEach((el) => {
        el.classList.add('reveal');
        el.classList.add('is-observed');
        
        const delay = el.getAttribute('data-aos-delay');
        if (delay) {
          (el as HTMLElement).style.transitionDelay = `${delay}ms`;
        }

        // Safety sweep: if already in initial viewport, reveal on next frame so above-the-fold content doesn't wait
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight || 800;
        if (rect.top < vh && rect.bottom > 0) {
          requestAnimationFrame(() => {
            el.classList.add('is-visible');
            el.classList.add('jd-in');
            el.classList.add('aos-animate');
          });
        } else {
          observer.observe(el);
        }
      });
    };

    observeElements();

    const mutationObserver = new MutationObserver(() => {
      observeElements();
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [location.pathname]);

  return null;
};
