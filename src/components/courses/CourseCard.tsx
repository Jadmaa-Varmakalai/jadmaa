import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Star, Users, ArrowRight, Video, MapPin } from 'lucide-react';
import type { Course } from '../../types';
import { ResponsiveImage } from '../common/ResponsiveImage';
import { ShareButton } from '../common/ShareButton';

export const isOnlineCourse = (course: Course): boolean => {
  if (!course) return false;
  if ((course as any).isOnline === true || (course as any).trainingType === 'online') return true;
  if (course.slug === 'varmakalai-foundation-free-starter-course' || course.slug === '0-free-varma-foundation' || course.slug === 'varma-foundation') return true;
  if (course.isFree) return true;
  if (typeof course.category === 'string' && course.category.toLowerCase().includes('online')) return true;
  if (course.modules && course.modules.some(m => m.lessons && m.lessons.some(l => (l as any).videoUrl || (l as any).youtubeVideoId))) {
    return true;
  }
  return false;
};

export const getValidCourseThumbnail = (course: Partial<Course>): string => {
  const thumb = course.thumbnail?.trim() || '';
  if (!thumb) return '/images/course-basic.jpg';
  if (thumb.includes('course-weightloss')) return '/images/course-weightloss-career.jpg';
  if (thumb.includes('course-basic')) return '/images/course-basic.jpg';
  if (thumb.includes('logo-1')) return '/images/course-basic.jpg';
  return '/images/course-basic.jpg';
};

interface CourseCardProps {
  course: Course;
  hidePrice?: boolean;
  className?: string;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, hidePrice = false, className = '' }) => {
  // Clean repetitive suffix
  const cleanTitle = course.title?.includes('|')
    ? course.title.split('|')[0].trim()
    : (course.title || 'Varmakalai Training');

  // Rating
  const hasRealRating = typeof course.rating === 'number' && course.rating > 0 && typeof course.reviewCount === 'number' && course.reviewCount > 0;
  const displayRating = hasRealRating ? course.rating.toFixed(1) : null;
  const displayReviews = hasRealRating ? course.reviewCount : null;

  // Training type
  const isOnline = isOnlineCourse(course);

  // Safe fallback thumbnail
  const thumbnailSrc = getValidCourseThumbnail(course);

  // Duration
  const durationText = course.duration && course.duration.trim().length > 0
    ? course.duration
    : isOnline ? 'Self-Paced' : '4 Weeks';

  // Safe price calculation
  const hasPrice = typeof course.price === 'number' && !isNaN(course.price);
  const formattedPrice = hasPrice ? course.price.toLocaleString('en-IN') : '0';

  return (
    <div className={`jd-card group w-full flex flex-col bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-[#EBE4DC] shadow-[0_2px_12px_rgba(43,37,33,0.05)] hover:shadow-[0_12px_28px_rgba(177,43,43,0.11)] hover:border-[#E2C7B8] transition-all duration-300 h-full ${className}`}>

      {/* ── 1. Thumbnail with Badges (Aspect 16/10) ── */}
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-gray-100 border-b border-[#F0EBE4]">
        <ResponsiveImage
          src={thumbnailSrc}
          alt={cleanTitle}
          width={400}
          height={250}
          aspectRatio="16/10"
          sizes="(max-width: 640px) 78vw, (max-width: 1024px) 33vw, 290px"
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        {/* Soft bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent pointer-events-none" />

        {/* Format Badges (Top Left) */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1 z-10">
          {isOnline ? (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-700/95 backdrop-blur-xs text-white rounded-md shadow-2xs flex items-center gap-1">
              <Video className="w-2.5 h-2.5" />
              <span>Online</span>
            </span>
          ) : (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-[#8F2020]/95 backdrop-blur-xs text-white rounded-md shadow-2xs flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5" />
              <span>Branch</span>
            </span>
          )}

          {course.isFree && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded-md shadow-2xs">
              FREE
            </span>
          )}

          {course.isPopular && !course.isFree && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-[#B12B2B] text-white rounded-md shadow-2xs">
              Popular
            </span>
          )}
        </div>

        {/* Share Button (Top Right) */}
        <div className="absolute top-2 right-2 z-10">
          <ShareButton
            title={cleanTitle}
            url={`/courses/${course.slug}`}
            variant="icon"
            iconSize={13}
            className="w-7 h-7 bg-white/85 backdrop-blur-xs shadow-2xs hover:bg-white"
          />
        </div>

        {/* Level badge (Bottom Right) */}
        <div className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-md text-[10px] font-bold text-[#1F2937] border border-white/60 shadow-2xs z-10">
          {course.level || 'All Levels'}
        </div>
      </div>

      {/* ── 2. Card Body (p-3 sm:p-4) ── */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between gap-2.5 text-left">

        <div>
          {/* Metadata Row: Duration & Rating / Learners */}
          <div className="flex items-center justify-between text-sm text-[#5C5148] font-medium mb-1.5">
            <div className="inline-flex items-center gap-1.5 text-[#B12B2B] font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span>{durationText}</span>
            </div>

            {hasRealRating ? (
              <div className="inline-flex items-center gap-1 text-amber-700">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                <span className="font-bold">{displayRating}</span>
                <span className="text-gray-400 text-xs">({displayReviews})</span>
              </div>
            ) : typeof course.studentsCount === 'number' && course.studentsCount > 0 ? (
              <div className="inline-flex items-center gap-1 text-[#5C5148] text-sm">
                <Users className="w-3.5 h-3.5 text-gray-400" />
                <span>{course.studentsCount} learners</span>
              </div>
            ) : (
              <span className="text-[#5C5148] text-sm">
                {typeof course.category === 'object' && course.category !== null
                  ? (course.category as any).name
                  : (course.category || 'Varmakalai')}
              </span>
            )}
          </div>

          {/* Title */}
          <Link to={`/courses/${course.slug}`} className="block group-hover:text-[#B12B2B] transition-colors">
            <h3 className="text-lg sm:text-xl font-bold font-serif text-[#2B2521] leading-snug line-clamp-2 min-h-[3rem]">
              {cleanTitle}
            </h3>
          </Link>

          {/* Description */}
          <p className="line-clamp-2 text-sm sm:text-base text-[#5C5148] leading-relaxed font-normal mt-1.5">
            {course.description || course.subtitle || ''}
          </p>
        </div>

        {/* ── 3. Footer: Price + Dual Compact Action Buttons ── */}
        <div className="pt-2 border-t border-[#F0EBE4] space-y-2">
          {/* Price & Guarantee Row */}
          {!hidePrice && (
            <div className="flex items-baseline justify-between text-xs">
              <div className="flex items-baseline gap-1.5">
                {course.isFree ? (
                  <span className="font-heading font-bold text-base text-emerald-600">Free Starter</span>
                ) : (
                  <>
                    <span className="font-heading font-extrabold text-base sm:text-lg text-[#1F2937]">
                      ₹{formattedPrice}
                    </span>
                    {course.originalPrice && course.originalPrice > course.price && (
                      <span className="text-[11px] text-gray-400 line-through">
                        ₹{course.originalPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                  </>
                )}
              </div>
              <span className="text-[10px] text-[#7A6E65] font-medium">
                {isOnline ? 'Lifetime Access' : 'Gurukulam Lineage'}
              </span>
            </div>
          )}

          {/* Dual Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <Link
              to={`/courses/${course.slug}`}
              className="inline-flex items-center justify-center py-2.5 px-4 rounded-lg border border-[#E8DDD0] hover:border-[#B12B2B] hover:bg-[#FAF6F0] text-[#2B2521] hover:text-[#B12B2B] font-medium text-sm transition-colors"
            >
              More Info
            </Link>
            <Link
              to={`/courses/${course.slug}`}
              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg bg-gradient-to-r from-[#B12B2B] to-[#911B1B] hover:from-[#911B1B] hover:to-[#781515] text-white font-medium text-sm shadow-2xs hover:shadow-sm transition-all"
            >
              <span>{course.isFree ? 'Start Free' : 'Enroll'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
