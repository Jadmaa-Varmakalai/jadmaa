import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  schema?: Record<string, any> | Array<Record<string, any>>;
  noindex?: boolean;
}

const DEFAULT_TITLE = 'JADMAA Varmakalai | Varmakalai Courses, Training & Self Defence';
const DEFAULT_DESC = 'Master authentic Varmakalai, traditional Tamil martial arts, and Siddha vital points therapy. Structured courses and certified training in Thanjavur, Kumbakonam & Ariyalur.';
const DEFAULT_KEYWORDS = 'varmakalai course online, learn varma points, varmakalai training, tamil traditional martial arts, varma therapy, self defence for kids and women';
const DEFAULT_IMAGE = 'https://jadmaa.com/images/logo-1.png';
const SITE_URL = 'https://jadmaa.com';

export const SEO: React.FC<SEOProps> = ({
  title,
  description = DEFAULT_DESC,
  keywords = DEFAULT_KEYWORDS,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  schema,
  noindex = false,
}) => {
  const location = useLocation();
  const currentPath = url || location.pathname;
  const canonicalUrl = currentPath.startsWith('http') ? currentPath : `${SITE_URL}${currentPath}`;
  const resolvedImage = image.startsWith('http') ? image : `${SITE_URL}${image.startsWith('/') ? '' : '/'}${image}`;

  const fullTitle = title
    ? (title.includes('JADMAA') ? title : `${title} | JADMAA Varmakalai`)
    : DEFAULT_TITLE;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />

      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="JADMAA Varmakalai" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={resolvedImage} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={resolvedImage} />

      {/* JSON-LD Structured Data Schema */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(Array.isArray(schema) ? schema : [schema])}
        </script>
      )}
    </Helmet>
  );
};

/**
 * Standard Schema Builders for Rich Search Engine Snippets
 */
export const buildCourseSchema = (course: {
  title: string;
  description: string;
  slug: string;
  price?: number;
  instructorName?: string;
  category?: string;
  imageUrl?: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Course',
  name: course.title,
  description: course.description,
  url: `https://jadmaa.com/courses/${course.slug}`,
  image: course.imageUrl || DEFAULT_IMAGE,
  provider: {
    '@type': 'Organization',
    name: 'JADMAA Varmakalai Academy',
    sameAs: 'https://jadmaa.com',
  },
  instructor: {
    '@type': 'Person',
    name: course.instructorName || 'Aasan Bojagarajan',
  },
  hasCourseInstance: {
    '@type': 'CourseInstance',
    courseMode: 'Online',
    courseWorkload: 'Self-paced lifetime access',
  },
  offers: course.price !== undefined ? {
    '@type': 'Offer',
    price: course.price,
    priceCurrency: 'INR',
    category: course.category || 'Varmakalai Training',
    availability: 'https://schema.org/InStock',
  } : undefined,
});

export const buildArticleSchema = (article: {
  title: string;
  description: string;
  slug: string;
  authorName?: string;
  datePublished?: string;
  dateModified?: string;
  imageUrl?: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: article.title,
  description: article.description,
  image: article.imageUrl || DEFAULT_IMAGE,
  url: `https://jadmaa.com/blog/${encodeURIComponent(article.slug)}`,
  datePublished: article.datePublished || new Date().toISOString(),
  dateModified: article.dateModified || article.datePublished || new Date().toISOString(),
  author: {
    '@type': 'Person',
    name: article.authorName || 'Aasan Bojagarajan',
  },
  publisher: {
    '@type': 'Organization',
    name: 'JADMAA Varmakalai',
    logo: {
      '@type': 'ImageObject',
      url: DEFAULT_IMAGE,
    },
  },
});

export const buildMedicalBusinessSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  name: 'JADMAA Varmakalai & Siddha Therapy Centre',
  description: 'Traditional Siddha Varmakalai vital point therapy, chronic pain treatment, and martial arts lineage training.',
  url: 'https://jadmaa.com',
  telephone: '+91 93452 20020',
  medicalSpecialty: 'Traditional Chinese Medicine / Siddha Varma Therapy',
  priceRange: '₹₹',
  address: [
    {
      '@type': 'PostalAddress',
      streetAddress: 'Main Gurukulam Centre',
      addressLocality: 'Thanjavur',
      addressRegion: 'Tamil Nadu',
      addressCountry: 'IN',
    },
    {
      '@type': 'PostalAddress',
      streetAddress: 'Branch Centre',
      addressLocality: 'Kumbakonam',
      addressRegion: 'Tamil Nadu',
      addressCountry: 'IN',
    },
    {
      '@type': 'PostalAddress',
      streetAddress: 'Branch Centre',
      addressLocality: 'Ariyalur',
      addressRegion: 'Tamil Nadu',
      addressCountry: 'IN',
    },
  ],
});
