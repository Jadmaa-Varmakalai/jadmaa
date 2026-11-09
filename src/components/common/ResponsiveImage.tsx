import React, { useState } from 'react';
import { 
  getOptimizedConfig, 
  getOptimizedBlogThumbnail, 
  getOptimizedImageUrl,
  buildResponsiveSrcSet,
  buildSrcSet 
} from '../../utils/imageUtils';

export interface ResponsiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  priority?: boolean;
  aspectRatio?: string;
  fallbackSrc?: string;
  sizes?: string;
  wrapperClassName?: string;
  showSkeleton?: boolean;
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  priority = false,
  aspectRatio,
  fallbackSrc = '/images/course-basic.jpg',
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  className = '',
  wrapperClassName = '',
  showSkeleton = true,
  width,
  height,
  style,
  onLoad,
  onError,
  ...rest
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true);
    onLoad?.(e);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setHasError(true);
    setIsLoaded(true);
    onError?.(e);
  };

  // Base image attributes
  const commonImgProps = {
    alt: alt || 'JADMAA Varmakalai',
    loading: priority ? ('eager' as const) : ('lazy' as const),
    decoding: 'async' as const,
    fetchPriority: priority ? ('high' as const) : ('auto' as const),
    onLoad: handleLoad,
    onError: handleError,
    className: `${className} transition-opacity duration-300 ${!isLoaded && !priority ? 'opacity-0' : 'opacity-100'}`,
    style: {
      aspectRatio,
      ...style,
    },
    ...rest,
  };

  // 1. Dedicated blog thumbnail (pre-rendered local derivatives or optimized proxy)
  const blogThumbnail = getOptimizedBlogThumbnail(src);
  if (blogThumbnail && !hasError) {
    return (
      <div className={`relative overflow-hidden ${wrapperClassName}`}>
        {showSkeleton && !isLoaded && (
          <div className="absolute inset-0 bg-[#FAF6F0] animate-pulse z-0" aria-hidden="true" />
        )}
        <picture className="block w-full h-full">
          <source type="image/avif" srcSet={blogThumbnail.avif} sizes={sizes} />
          <source 
            type="image/webp" 
            srcSet={blogThumbnail.srcSetWebp || blogThumbnail.webp} 
            sizes={sizes} 
          />
          <img
            src={blogThumbnail.webp || blogThumbnail.jpg}
            width={width}
            height={height}
            {...commonImgProps}
          />
        </picture>
      </div>
    );
  }

  // 2. Pre-calculated local derivatives in our OPTIMIZED_IMAGE_MAP
  const optimizedConfig = getOptimizedConfig(src);
  if (optimizedConfig && !hasError) {
    const { baseName, widths, defaultWidth, defaultHeight } = optimizedConfig;
    const finalWidth = width || defaultWidth;
    const finalHeight = height || defaultHeight;
    const finalAspectRatio = aspectRatio || optimizedConfig.aspectRatio || `${finalWidth}/${finalHeight}`;

    const avifSrcSet = buildSrcSet(baseName, widths, 'avif');
    const webpSrcSet = buildSrcSet(baseName, widths, 'webp');
    const defaultWebp = `/images/optimized/${baseName}.webp`;

    return (
      <div className={`relative overflow-hidden ${wrapperClassName}`}>
        {showSkeleton && !isLoaded && (
          <div className="absolute inset-0 bg-[#FAF6F0] animate-pulse z-0" aria-hidden="true" />
        )}
        <picture className="block w-full h-full">
          <source type="image/avif" srcSet={avifSrcSet} sizes={sizes} />
          <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />
          <img
            src={defaultWebp}
            width={finalWidth}
            height={finalHeight}
            {...commonImgProps}
            style={{
              aspectRatio: finalAspectRatio,
              ...style,
            }}
          />
        </picture>
      </div>
    );
  }

  // 3. Dynamic remote images (e.g. Supabase storage or uploads) -> Auto WebP responsive srcSet
  if ((src?.startsWith('http://') || src?.startsWith('https://') || src?.startsWith('/uploads/')) && !hasError) {
    const defaultOptimizedUrl = getOptimizedImageUrl(src, typeof width === 'number' ? width : 600);
    const responsiveWebpSrcSet = buildResponsiveSrcSet(src, [360, 480, 720, 1200], 'webp');

    return (
      <div className={`relative overflow-hidden ${wrapperClassName}`}>
        {showSkeleton && !isLoaded && (
          <div className="absolute inset-0 bg-[#FAF6F0] animate-pulse z-0" aria-hidden="true" />
        )}
        <picture className="block w-full h-full">
          <source type="image/webp" srcSet={responsiveWebpSrcSet} sizes={sizes} />
          <img
            src={defaultOptimizedUrl}
            width={width}
            height={height}
            {...commonImgProps}
          />
        </picture>
      </div>
    );
  }

  // 4. Standard, fallback, or error image rendering
  const effectiveSrc = hasError ? fallbackSrc : (src || fallbackSrc);

  return (
    <div className={`relative overflow-hidden ${wrapperClassName}`}>
      {showSkeleton && !isLoaded && (
        <div className="absolute inset-0 bg-[#FAF6F0] animate-pulse z-0" aria-hidden="true" />
      )}
      <img
        src={effectiveSrc}
        width={width}
        height={height}
        {...commonImgProps}
      />
    </div>
  );
};
