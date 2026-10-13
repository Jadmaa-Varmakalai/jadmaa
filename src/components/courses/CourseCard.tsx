import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Star, Users, ArrowRight, Video, MapPin } from 'lucide-react';
import type { Course } from '../../types';

export const isOnlineCourse = (course: Course): boolean => {
  if (!course) return false;
  if ((course as any).isOnline === true || (course as any).trainingType === 'online') return true;
  if (course.slug === 'varmakalai-foundation-free-starter-course' || course.slug === '0-free-varma-foundation' || course.slug === 'varma-foundation') return true;
  if (course.isFree) return true;
  if (course.category?.toLowerCase().includes('online')) return true;
  // Check if it has actual recorded video lessons in LMS
  if (course.modules && course.modules.some(m => m.lessons && m.lessons.some(l => (l as any).videoUrl || (l as any).youtubeVideoId))) {
    return true;
  }
  return false;
};

interface CourseCardProps {
  course: Course;
  hidePrice?: boolean;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, hidePrice = false }) => {
  // Clean up repetitive SEO tags like "| JADMAA Varmakalai" from titles
  const cleanTitle = course.title?.includes('|')
    ? course.title.split('|')[0].trim()
    : (course.title || 'Varmakalai Training');

  // Render rating/review information ONLY when supported by real data
  const hasRealRating = typeof course.rating === 'number' && course.rating > 0 && typeof course.reviewCount === 'number' && course.reviewCount > 0;
  const displayRating = hasRealRating ? course.rating.toFixed(1) : null;
  const displayReviews = hasRealRating ? course.reviewCount : null;

  // Sanitized instructor name — never generate "Aasan info@jadmaa.com"
  let rawInstructor = '';
  if (typeof course.instructor === 'object' && course.instructor !== null) {
    rawInstructor = (course.instructor as any).name || (course.instructor as any).displayName || '';
  } else if (typeof course.instructor === 'string') {
    rawInstructor = course.instructor;
  }

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawInstructor.trim()) || rawInstructor.includes('@');
  const isValidInstructor = rawInstructor.trim().length > 0 && !isEmail && !rawInstructor.toLowerCase().includes('info@');

  const instructorName = isValidInstructor ? rawInstructor.trim() : 'JADMAA Instructor';
  const initial = instructorName.replace(/^(aasan\s*[-–—:]*\s*|master\s*[-–—:]*\s*|dr\.?\s*|mr\.?\s*)/i, '').trim().charAt(0).toUpperCase() || 'J';

  // Training type: recorded online LMS vs offline branch training
  const isOnline = isOnlineCourse(course);

  // Safe fallback thumbnail
  const thumbnailSrc = course.thumbnail && course.thumbnail.trim().length > 0
    ? course.thumbnail
    : '/images/hero-traditional.jpg';

  // Duration
  const durationText = course.duration && course.duration.trim().length > 0
    ? course.duration
    : isOnline ? 'Self-Paced' : '4 Weeks';

  // Safe price calculation
  const hasPrice = typeof course.price === 'number' && !isNaN(course.price);
  const formattedPrice = hasPrice ? course.price.toLocaleString('en-IN') : '0';

  return (
    <div className="jd-card group w-full flex flex-col bg-white rounded-2xl overflow-hidden border border-[#EBE4DC] shadow-[0_4px_20px_rgba(43,37,33,0.06)] hover:shadow-[0_16px_36px_rgba(177,43,43,0.12)] hover:border-[#E2C7B8] transition-all duration-300">

      {/* Thumbnail with overlay & badges */}
      <div className="relative w-full overflow-hidden bg-gray-100" style={{ aspectRatio: '16/9' }}>
        <img
          src={thumbnailSrc}
          alt={cleanTitle}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/hero-traditional.jpg';
          }}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        {/* Soft bottom gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

        {/* Floating badges top-left */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          {/* Format Distinction Badge */}
          {isOnline ? (
            <span className="px-2.5 py-1 text-xs font-bold bg-emerald-700/95 backdrop-blur-md text-white rounded-lg shadow-sm flex items-center gap-1">
              <Video className="w-3 h-3" />
              Recorded Online LMS
            </span>
          ) : (
            <span className="px-2.5 py-1 text-xs font-bold bg-[#8F2020]/95 backdrop-blur-md text-white rounded-lg shadow-sm flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              In-Person Branch
            </span>
          )}

          <span className="px-2.5 py-1 text-xs font-semibold bg-[#1F2937]/90 backdrop-blur-md text-white rounded-lg shadow-sm">
            {course.category || 'Varmakalai'}
          </span>

          {course.isPopular && (
            <span className="px-2.5 py-1 text-xs font-bold bg-gradient-to-r from-[#B12B2B] to-[#D32F2F] text-white rounded-lg shadow-sm">
              Popular
            </span>
          )}
          {course.isFree && (
            <span className="px-2.5 py-1 text-xs font-bold bg-emerald-600 text-white rounded-lg shadow-sm">
              FREE
            </span>
          )}
          {(course.isAvailable === false || (course as any).status === 'HOLD') && (
            <span className="px-2.5 py-1 text-xs font-bold bg-amber-600 text-white rounded-lg shadow-sm">
              On Hold
            </span>
          )}
        </div>

        {/* Level badge bottom-right */}
        <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-[#1F2937] border border-white/60 shadow-sm z-10">
          {course.level || 'All Levels'}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">

        {/* Meta row — duration chip & optional real rating chip */}
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-[#B12B2B] text-xs font-semibold border border-red-100/80">
            <Clock className="w-3.5 h-3.5" />
            <span>{durationText}</span>
          </div>

          {hasRealRating && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-semibold border border-amber-200/80">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span className="font-bold">{displayRating}</span>
              <span className="text-amber-700/70 font-normal">({displayReviews})</span>
            </div>
          )}
        </div>

        {/* Title — Clean, high contrast, bold on hover */}
        <h3 className="font-heading font-semibold text-[#1F2937] group-hover:text-[#B12B2B] transition-colors line-clamp-2 leading-snug text-lg sm:text-[19px]">
          <Link to={`/courses/${course.slug}`}>{cleanTitle}</Link>
        </h3>

        {/* Description */}
        <p className="text-sm text-[#4B5563] line-clamp-2 leading-relaxed flex-1">
          {course.description || course.subtitle || ''}
        </p>

        {/* Instructor row */}
        <div className="flex items-center gap-2.5 text-xs sm:text-sm text-[#4B5563] pt-1">
          <div className="w-7 h-7 rounded-full bg-[#B12B2B] text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm">
            {initial}
          </div>
          <span className="font-medium text-[#374151] truncate">{instructorName}</span>
          {typeof course.studentsCount === 'number' && course.studentsCount > 0 && (
            <span className="ml-auto flex items-center gap-1 text-xs text-[#6B7280]">
              <Users className="w-3.5 h-3.5 text-[#B12B2B]" />
              {course.studentsCount} students
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-[#F0EBE4]" />

        {/* Price + CTA row */}
        <div className="flex items-center justify-between gap-3 pt-0.5">
          {!hidePrice ? (
            <div className="shrink-0 flex flex-col">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#6B7280]">
                {isOnline ? 'Online Course Fee' : 'Branch Training Fee'}
              </span>
              {course.isFree ? (
                <span className="font-heading font-bold text-lg text-emerald-600">Free</span>
              ) : (
                <div className="flex items-baseline gap-1.5">
                  <span className="font-heading font-bold text-lg text-[#1F2937]">
                    ₹{formattedPrice}
                  </span>
                  {course.originalPrice && course.originalPrice > course.price && (
                    <span className="text-xs text-gray-400 line-through">
                      ₹{course.originalPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="shrink-0">
              {course.isFree && (
                <span className="font-heading font-bold text-base text-emerald-600">Free Starter</span>
              )}
            </div>
          )}

          {/* Action Button */}
          <Link
            to={`/courses/${course.slug}`}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#B12B2B] to-[#911B1B] hover:from-[#911B1B] hover:to-[#781515] text-white font-semibold text-xs sm:text-sm shadow-sm hover:shadow-md transition-all group-hover:translate-x-0.5"
          >
            <span>
              {course.isFree
                ? 'Start Learning'
                : isOnline
                ? 'View Course'
                : 'Branch Details'}
            </span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>
    </div>
  );
};

