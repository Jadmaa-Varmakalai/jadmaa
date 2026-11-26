/**
 * Extracts an 11-character YouTube video ID from any YouTube URL format
 * (Shorts, watch?v=, youtu.be/, embed/, live/) or raw ID.
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  const patterns = [
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i,
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/i,
    /(?:youtube\.com\/watch\?.+&v=)([a-zA-Z0-9_-]{11})/i,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/i,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/i,
    /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/i,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/i,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}

/**
 * Converts any YouTube URL (including /shorts/<id>) into a clean standard
 * /embed/<id> URL with JS API enabled and minimal branding.
 */
export function getCleanEmbedUrl(rawUrl: string): string {
  const videoId = extractYouTubeVideoId(rawUrl);
  if (!videoId) return rawUrl;
  return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&modestbranding=1&rel=0&playsinline=1&controls=0&iv_load_policy=3`;
}
