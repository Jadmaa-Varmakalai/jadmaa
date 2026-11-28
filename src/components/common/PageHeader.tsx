import React from 'react';

interface PageHeaderProps {
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  rightSlot?: React.ReactNode;
  className?: string;
}

/**
 * Standardized public page hero header matching the Navbar & Home Hero
 * container width, left alignment, and Cormorant Garamond typography scale.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  eyebrow,
  title,
  subtitle,
  rightSlot,
  className = '',
}) => {
  return (
    <section
      className={`bg-[#FAF6F0] border-b border-[#E8DDD0]/70 pt-10 pb-10 sm:pt-12 sm:pb-12 lg:pt-14 lg:pb-14 text-left ${className}`}
    >
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="min-w-0">
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#B12B2B] mb-2.5 block font-body">
            {eyebrow}
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-[44px] font-semibold text-[#2B2521] tracking-tight leading-[1.15] max-w-2xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 text-sm sm:text-base text-[#5C5148] max-w-2xl leading-relaxed font-normal font-body">
              {subtitle}
            </p>
          )}
        </div>
        {rightSlot && <div className="shrink-0">{rightSlot}</div>}
      </div>
    </section>
  );
};
