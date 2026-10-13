import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

export const SEOManager: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;

  let title = 'JADMAA — Varmakalai Training & Traditional Tamil Martial Arts';
  let description = 'Learn authentic Varmakalai, traditional Tamil martial arts, and practical self defence. JADMAA offers expert training for all levels, kids, and women.';
  let isCourse = false;
  let schemaData: any = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "JADMAA Varmakalai",
    "description": description,
    "url": `https://jadmaa.com${path}`,
    "telephone": "+919655457500",
    "address": [
      {
        "@type": "PostalAddress",
        "addressLocality": "Thanjavur",
        "addressRegion": "Tamil Nadu",
        "addressCountry": "IN"
      },
      {
        "@type": "PostalAddress",
        "addressLocality": "Kumbakonam",
        "addressRegion": "Tamil Nadu",
        "addressCountry": "IN"
      },
      {
        "@type": "PostalAddress",
        "addressLocality": "Ariyalur",
        "addressRegion": "Tamil Nadu",
        "addressCountry": "IN"
      }
    ]
  };

  if (path === '/') {
    title = 'JADMAA — Varmakalai Training & Traditional Tamil Martial Arts';
    description = 'Join JADMAA for authentic Varmakalai training. Learn traditional Tamil martial arts, self-defence, and Siddha healing from expert Grandmasters.';
  } else if (path === '/courses' || path === '/courses/') {
    title = 'Varmakalai Courses & Certifications — JADMAA';
    description = 'Enroll in our comprehensive online Varmakalai courses and certifications. Expert martial arts training for beginners to advanced practitioners.';
  } else if (path.includes('/courses/kids-varmakalai')) {
    title = 'Kids Self Defence Training & Varmakalai — JADMAA';
    description = 'Specialized kids self defence training and character building through traditional Varmakalai. Improve your child\'s focus, agility, and confidence.';
    isCourse = true;
  } else if (path.includes('/courses/womens-self-defence')) {
    title = 'Women Self Defence Training — JADMAA Varmakalai';
    description = 'Practical women self defence training using traditional Varma Kalai techniques. Learn instinctive protection and situational awareness.';
    isCourse = true;
  } else if (path.includes('/courses/foundation')) {
    title = 'Varmakalai for Beginners (Foundation) — JADMAA';
    description = 'Start your journey with Varmakalai for beginners. Learn foundational Tamil martial arts stances, breathing, and self-defence mechanics.';
    isCourse = true;
  } else if (path.includes('/courses/intermediate')) {
    title = 'Intermediate Varmakalai Training — JADMAA';
    description = 'Advance your skills with Intermediate Varmakalai training. Master joint manipulation (Pootu) and traditional Adimurai combatives.';
    isCourse = true;
  } else if (path.startsWith('/courses/')) {
    title = 'Online Varmakalai Course — JADMAA';
    description = 'Comprehensive online Varmakalai course featuring traditional Tamil martial arts and self-defence training.';
    isCourse = true;
  } else if (path === '/about') {
    title = 'About JADMAA — Traditional Tamil Martial Arts Academy';
    description = 'Discover the legacy of JADMAA. We are dedicated to preserving and teaching traditional Tamil martial arts and Varmakalai across Tamil Nadu.';
  } else if (path === '/contact') {
    title = 'Contact JADMAA — Varmakalai Training in Thanjavur, Kumbakonam & Ariyalur';
    description = 'Contact JADMAA for Varmakalai classes in Thanjavur, Kumbakonam, and Ariyalur. Join our Tamil martial arts and self-defence training programs.';
  }

  if (isCourse) {
    schemaData = {
      "@context": "https://schema.org",
      "@type": "Course",
      "name": title.split(' — ')[0],
      "description": description,
      "provider": {
        "@type": "Organization",
        "name": "JADMAA Varmakalai",
        "sameAs": "https://jadmaa.com"
      }
    };
  }

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {/* OpenGraph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content="JADMAA Varmakalai" />
      <meta property="og:url" content={`https://jadmaa.com${path}`} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />

      {/* JSON-LD Schema */}
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
    </Helmet>
  );
};
