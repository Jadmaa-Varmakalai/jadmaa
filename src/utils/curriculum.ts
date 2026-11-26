export interface TimestampItem {
  seconds: number;
  timeLabel: string;
  label: string;
}

export function parseTimeToSeconds(timeStr: string): number {
  const parts = timeStr.split(':').map((n) => parseInt(n, 10));
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

export function parseDurationStringToSeconds(durationStr?: string): number {
  if (!durationStr) return 0;
  const minMatch = durationStr.match(/(\d+)\s*min/i);
  const secMatch = durationStr.match(/(\d+)\s*sec/i);
  if (minMatch || secMatch) {
    return (minMatch ? parseInt(minMatch[1], 10) * 60 : 0) + (secMatch ? parseInt(secMatch[1], 10) : 0);
  }
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(durationStr.trim())) {
    return parseTimeToSeconds(durationStr.trim());
  }
  return 0;
}

export function formatCompactDuration(seconds?: number, fallbackStr?: string): string {
  if (seconds && seconds > 0) {
    const rounded = Math.round(seconds);
    const hrs = Math.floor(rounded / 3600);
    const mins = Math.floor((rounded % 3600) / 60);
    const secs = rounded % 60;
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }
  return fallbackStr || '';
}

export function formatSummaryDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  const rounded = Math.round(seconds);
  if (rounded < 60) return `${rounded}s`;
  const hrs = Math.floor(rounded / 3600);
  const mins = Math.floor((rounded % 3600) / 60);
  const secs = rounded % 60;
  if (hrs > 0) {
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  }
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

export function parseTimestamps(text?: string | null, chapters?: any[]): TimestampItem[] {
  const items: TimestampItem[] = [];
  const seen = new Set<number>();

  if (Array.isArray(chapters)) {
    for (const ch of chapters) {
      const secs =
        typeof ch.seconds === 'number'
          ? ch.seconds
          : ch.time
          ? parseTimeToSeconds(String(ch.time))
          : 0;
      const label = ch.title || ch.label || 'Chapter';
      const timeLabel = ch.time || `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
      if (!seen.has(secs)) {
        seen.add(secs);
        items.push({ seconds: secs, timeLabel, label });
      }
    }
  }

  if (text) {
    const lines = text.split('\n');
    const regex = /\b((?:\d{1,2}:)?\d{1,2}:\d{2})\b(?:\s*[-–—|:]?\s*(.+))?/;
    for (const line of lines) {
      const m = line.match(regex);
      if (m && m[1]) {
        const secs = parseTimeToSeconds(m[1]);
        if (!seen.has(secs)) {
          seen.add(secs);
          const cleanLabel = (m[2] || 'Jump to section').trim();
          items.push({ seconds: secs, timeLabel: m[1], label: cleanLabel });
        }
      }
    }
  }

  return items.sort((a, b) => a.seconds - b.seconds);
}
