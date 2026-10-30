import React, { useState } from 'react';
import { getOptimizedConfig, getOptimizedBlogThumbnail, buildSrcSet } from '../../utils/imageUtils';

export interface ResponsiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  priority?: boolean;
  aspectRatio?: string;
  fallbackSrc?: string;
  sizes?: string;
  wrapperClassName?: string;
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
  width,
  height,
  style,
  onError,
  ...rest
}) => {
  const [hasError, setHasError] = useState(false);

  // Check if this image has a dedicated blog thumbnail
  const blogThumbnail = getOptimizedBlogThumbnail(src);
  if (blogThumbnail && !hasError) {
    return (
      <picture className={wrapperClassName}>
        <source type="image/avif" srcSet={blogThumbnail.avif} />
        <source type="image/webp" srcSet={blogThumbnail.webp} />
        <img
          src={blogThumbnail.jpg}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          width={width || 600}
          height={height || 400}
          style={{
            aspectRatio: aspectRatio || '16/9',
            ...style,
          }}
          className={className}
          onError={(e) => {
            setHasError(true);
            onError?.(e);
          }}
          {...rest}
        />
      </picture>
    );
  }

  // Check if this image has optimized responsive derivatives in our map
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
      <picture className={wrapperClassName}>
        <source type="image/avif" srcSet={avifSrcSet} sizes={sizes} />
        <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />
        <img
          src={defaultWebp}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          width={finalWidth}
          height={finalHeight}
          style={{
            aspectRatio: finalAspectRatio,
            ...style,
          }}
          className={className}
          onError={(e) => {
            // Fall back to original or fallbackSrc
            setHasError(true);
            onError?.(e);
          }}
          {...rest}
        />
      </picture>
    );
  }

  // Standard or fallback image rendering
  const effectiveSrc = hasError ? fallbackSrc : (src || fallbackSrc);

  return (
    <img
      src={effectiveSrc}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      width={width}
      height={height}
      style={{
        aspectRatio: aspectRatio,
        ...style,
      }}
      className={className}
      onError={(e) => {
        if (!hasError && effectiveSrc !== fallbackSrc) {
          setHasError(true);
        }
        onError?.(e);
      }}
      {...rest}
    />
  );
};

