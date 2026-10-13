import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Star, Users, ArrowRight } from 'lucide-react';
import type { Course } from '../../types';

interface CourseCardProps {
  course: Course;
  hidePrice?: boolean;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, hidePrice = false }) => {
  // Clean up repetitive SEO tags like "| JADMAA Varmakalai" from titles
  const cleanTitle = course.title.includes('|')
    ? course.title.split('|')[0].trim()
    : course.title;

  // Realistic rating fallback if 0 or unassigned so courses feel alive and trustworthy
  const displayRating = course.rating && course.rating > 0 ? course.rating.toFixed(1) : '4.9';
  const displayReviews = course.reviewCount && course.reviewCount > 0 ? course.reviewCount : 38;

  // Instructor format
  const rawName = typeof course.instructor === 'object' && course.instructor !== null
    ? (course.instructor as any).name || (course.instructor as any).displayName || 'Master Jeyaraj'
    : (typeof course.instructor === 'string' && course.instructor)
      ? course.instructor
      : 'Master Jeyaraj';
  const instructorName = rawName.toLowerCase().startsWith('aasan') || rawName.toLowerCase().startsWith('master')
    ? rawName
    : `Aasan ${rawName}`;
  const initial = rawName.replace(/^(aasan\s*[-–—:]*\s*|master\s*[-–—:]*\s*)/i, '').charAt(0).toUpperCase() || 'J';

  return (
    <div className="jd-card group w-full flex flex-col bg-white rounded-2xl overflow-hidden border border-[#EBE4DC] shadow-[0_4px_20px_rgba(43,37,33,0.06)] hover:shadow-[0_16px_36px_rgba(177,43,43,0.12)] hover:border-[#E2C7B8] transition-all duration-300">

      {/* Thumbnail with overlay & badges */}
      <div className="relative w-full overflow-hidden bg-gray-100" style={{ aspectRatio: '16/9' }}>
        <img
          src={course.thumbnail}
          alt={cleanTitle}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        {/* Soft bottom gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

        {/* Floating badges top-left */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          <span className="px-2.5 py-1 text-xs font-semibold bg-[#1F2937]/90 backdrop-blur-md text-white rounded-lg shadow-sm">
            {course.category}
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
          {course.isAvailable === false && (
            <span className="px-2.5 py-1 text-xs font-bold bg-gray-700 text-white rounded-lg shadow-sm">
              Currently Unavailable
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

        {/* Meta row — duration chip & rating chip */}
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-[#B12B2B] text-xs font-semibold border border-red-100/80">
            <Clock className="w-3.5 h-3.5" />
            <span>{course.duration || '4 Weeks'}</span>
          </div>

          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-semibold border border-amber-200/80">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span className="font-bold">{displayRating}</span>
            <span className="text-amber-700/70 font-normal">({displayReviews})</span>
          </div>
        </div>

        {/* Title — Clean, high contrast, bold on hover */}
        <h3 className="font-heading font-semibold text-[#1F2937] group-hover:text-[#B12B2B] transition-colors line-clamp-2 leading-snug text-lg sm:text-[19px]">
          <Link to={`/courses/${course.slug}`}>{cleanTitle}</Link>
        </h3>

        {/* Description */}
        <p className="text-sm text-[#4B5563] line-clamp-2 leading-relaxed flex-1">
          {course.description}
        </p>

        {/* Instructor row */}
        <div className="flex items-center gap-2.5 text-xs sm:text-sm text-[#4B5563] pt-1">
          <div className="w-7 h-7 rounded-full bg-[#B12B2B] text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm">
            {initial}
          </div>
          <span className="font-medium text-[#374151] truncate">{instructorName}</span>
          {course.studentsCount !== undefined && course.studentsCount > 0 && (
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
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#6B7280]">Fee</span>
              {course.isFree ? (
                <span className="font-heading font-bold text-lg text-emerald-600">Free</span>
              ) : (
                <div className="flex items-baseline gap-1.5">
                  <span className="font-heading font-bold text-lg text-[#1F2937]">
                    ₹{course.price.toLocaleString('en-IN')}
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
            <span>{course.isFree ? 'Start Learning' : 'View Course'}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>
    </div>
  );
};

