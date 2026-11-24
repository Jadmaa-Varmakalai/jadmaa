import React, { useState, useRef, useEffect } from 'react';
import { Share2, Check, Copy } from 'lucide-react';

export interface ShareButtonProps {
  title?: string;
  url: string; // Absolute or relative (e.g. /blog/my-slug)
  text?: string;
  className?: string;
  buttonText?: string;
  variant?: 'icon' | 'pill' | 'button';
  iconSize?: number;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  title = 'JADMAA Varmakalai',
  url,
  className = '',
  buttonText,
  variant = 'icon',
  iconSize = 16,
}) => {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // Enforces clean canonical URL (https://jadmaa.com/blog/<slug>) without query params or tracking tokens
  const getCanonicalShareUrl = (): string => {
    if (!url) return 'https://jadmaa.com';

    let clean = url.trim().split('?')[0].split('#')[0];
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      return clean.replace(/^https?:\/\/(localhost(:\d+)?|127\.0\.0\.1(:\d+)?)/i, 'https://jadmaa.com');
    }
    const cleanPath = clean.startsWith('/') ? clean : `/${clean}`;
    return `https://jadmaa.com${cleanPath}`;
  };

  const copyToClipboard = async (shareUrl: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
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

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const shareUrl = getCanonicalShareUrl();

    // 1. Mobile Web Share API:
    // Strictly pass ONLY { url: shareUrl } — zero title, text, or excerpts so WhatsApp / native share sheet
    // receives strictly the raw clean URL.
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ url: shareUrl });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }

    // 2. Desktop fallback:
    // For icon variant, quickly copy URL to clipboard. For button/pill, toggle direct social share menu.
    if (variant === 'icon') {
      await copyToClipboard(shareUrl);
    } else {
      setShowMenu((prev) => !prev);
    }
  };

  const shareUrl = getCanonicalShareUrl();
  const encodedUrl = encodeURIComponent(shareUrl);

  const socialChannels = [
    {
      name: 'WhatsApp',
      href: `https://api.whatsapp.com/send?text=${encodedUrl}`,
      color: 'hover:text-emerald-600 hover:bg-emerald-50',
      icon: (
        <svg className="w-4 h-4 fill-current text-emerald-600" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
      )
    },
    {
      name: 'Telegram',
      href: `https://t.me/share/url?url=${encodedUrl}`,
      color: 'hover:text-sky-600 hover:bg-sky-50',
      icon: (
        <svg className="w-4 h-4 fill-current text-sky-500" viewBox="0 0 24 24">
          <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.944z"/>
        </svg>
      )
    },
    {
      name: 'X (Twitter)',
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}`,
      color: 'hover:text-black hover:bg-gray-100',
      icon: (
        <svg className="w-3.5 h-3.5 fill-current text-black" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      )
    },
    {
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: 'hover:text-blue-600 hover:bg-blue-50',
      icon: (
        <svg className="w-4 h-4 fill-current text-blue-600" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )
    }
  ];

  return (
    <div className="relative inline-flex items-center" ref={menuRef}>
      {variant === 'button' && (
        <button
          type="button"
          onClick={handleShare}
          aria-label={`Share ${title}`}
          title={copied ? 'Link copied!' : `Share ${title}`}
          className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg font-medium text-sm transition-all duration-200 cursor-pointer ${
            copied
              ? 'bg-emerald-600 text-white shadow-xs'
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
      )}

      {variant === 'pill' && (
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
      )}

      {variant === 'icon' && (
        <button
          type="button"
          onClick={handleShare}
          aria-label={`Share ${title}`}
          title={copied ? 'Link copied!' : `Share ${title}`}
          className={`p-2 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center ${
            copied
              ? 'bg-emerald-600 text-white shadow-xs scale-105'
              : 'bg-white/90 hover:bg-[#B12B2B] text-gray-700 hover:text-white shadow-xs border border-gray-200/80 hover:border-[#B12B2B]'
          } ${className}`}
        >
          {copied ? (
            <Check size={iconSize} className="shrink-0 text-white" />
          ) : (
            <Share2 size={iconSize} className="shrink-0 text-inherit" />
          )}
        </button>
      )}

      {/* Quick feedback tooltip when copied directly */}
      {copied && variant === 'icon' && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#1C1714] text-white text-[11px] font-bold rounded shadow-md pointer-events-none whitespace-nowrap z-50 animate-fade-in">
          Copied!
        </span>
      )}

      {/* Direct Social Share Popover (for Desktop fallback) */}
      {showMenu && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-scale-in text-left">
          <div className="px-3 py-1 border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Share URL
          </div>

          <button
            type="button"
            onClick={async (e) => {
              e.preventDefault();
              await copyToClipboard(shareUrl);
              setShowMenu(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {copied ? (
              <Check size={14} className="text-emerald-600" />
            ) : (
              <Copy size={14} className="text-gray-500" />
            )}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Clean URL'}</span>
          </button>

          {socialChannels.map((channel) => (
            <a
              key={channel.name}
              href={channel.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setShowMenu(false)}
              className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 transition-colors ${channel.color}`}
            >
              {channel.icon}
              <span>{channel.name}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
