import React, { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';

export interface ShareButtonProps {
  title: string;
  url: string; // Absolute or relative (e.g. /blog/my-slug)
  text?: string;
  className?: string;
  buttonText?: string;
  variant?: 'icon' | 'pill' | 'button';
  iconSize?: number;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  title,
  url,
  text,
  className = '',
  buttonText,
  variant = 'icon',
  iconSize = 16,
}) => {
  const [copied, setCopied] = useState(false);

  const getFullUrl = () => {
    if (typeof window === 'undefined') return url;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `${window.location.origin}${cleanPath}`;
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const fullUrl = getFullUrl();
    const shareData = {
      title,
      text: text || title,
      url: fullUrl,
    };

    // 1. Try native Web Share API on mobile / supported browsers
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: any) {
        // User aborted share sheet - do not treat as error
        if (err?.name === 'AbortError') return;
      }
    }

    // 2. Fallback to clipboard copy
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(fullUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = fullUrl;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (clipErr) {
      console.warn('Failed to copy to clipboard', clipErr);
    }
  };

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={handleShare}
        aria-label={`Share ${title}`}
        title={copied ? 'Link copied!' : `Share ${title}`}
        className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg font-medium text-sm transition-all duration-200 cursor-pointer ${
          copied
            ? 'bg-emerald-600 text-white shadow-sm'
            : 'bg-[#F2EDE4] hover:bg-[#E8DDD0] text-[#2B2521] border border-[#E8DDD0]'
        } ${className}`}
      >
        {copied ? (
          <>
            <Check size={iconSize} className="text-white shrink-0 animate-scale-in" />
            <span className="text-xs font-bold text-white">Copied!</span>
          </>
        ) : (
          <>
            <Share2 size={iconSize} className="shrink-0 text-inherit" />
            {buttonText && <span>{buttonText}</span>}
          </>
        )}
      </button>
    );
  }

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={handleShare}
        aria-label={`Share ${title}`}
        title={copied ? 'Link copied!' : `Share ${title}`}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer shadow-xs ${
          copied
            ? 'bg-emerald-600 text-white'
            : 'bg-white/90 hover:bg-white text-[#2B2521] border border-gray-200 hover:border-[#B12B2B] hover:text-[#B12B2B]'
        } ${className}`}
      >
        {copied ? (
          <>
            <Check size={13} className="shrink-0" />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <Share2 size={13} className="shrink-0" />
            <span>{buttonText || 'Share'}</span>
          </>
        )}
      </button>
    );
  }

  // Default 'icon' variant
  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleShare}
        aria-label={`Share ${title}`}
        title={copied ? 'Link copied!' : `Share ${title}`}
        className={`p-2 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center ${
          copied
            ? 'bg-emerald-600 text-white shadow-sm scale-105'
            : 'bg-white/90 hover:bg-[#B12B2B] text-gray-700 hover:text-white shadow-sm border border-gray-200/80 hover:border-[#B12B2B]'
        } ${className}`}
      >
        {copied ? (
          <Check size={iconSize} className="shrink-0 text-white" />
        ) : (
          <Share2 size={iconSize} className="shrink-0 text-inherit" />
        )}
      </button>
      {copied && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#1C1714] text-white text-[11px] font-bold rounded shadow-md pointer-events-none whitespace-nowrap z-50 animate-fade-in">
          Copied!
        </span>
      )}
    </div>
  );
};
