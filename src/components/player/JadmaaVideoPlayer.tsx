import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  ShieldAlert,
  PlayCircle,
  Lock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { extractYouTubeVideoId, isYouTubeShort } from '../../utils/youtube';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

export interface JadmaaVideoPlayerHandle {
  seekTo: (seconds: number) => void;
  play: () => void;
  pause: () => void;
}

export interface JadmaaVideoPlayerProps {
  videoId: string;
  title: string;
  watermarkText?: string;
  isShort?: boolean;
  onDurationLoaded?: (durationSeconds: number) => void;
  onWatchProgress?: (currentTime: number, duration: number) => void;
  onVideoPaused?: (currentTime: number, duration: number) => void;
  onVideoEnded?: () => void;
  onNextLesson?: () => void;
  hasNextLesson?: boolean;
}

const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Singleton loader for YouTube IFrame API
let ytApiPromise: Promise<void> | null = null;
const loadYouTubeIframeAPI = (): Promise<void> => {
  if (window.YT && window.YT.Player) {
    return Promise.resolve();
  }
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise((resolve) => {
    const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prevReady) prevReady();
      resolve();
    };
    if (!existingScript) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      document.head.appendChild(tag);
    }
  });
  return ytApiPromise;
};

const WATERMARK_POSITIONS = [
  'top-4 left-4',
  'top-4 right-4',
  'bottom-16 left-4',
  'bottom-16 right-4',
  'top-1/3 left-1/3',
];

type FacadeState = 'initial' | 'buffering' | 'playing' | 'paused' | 'ended';

export const JadmaaVideoPlayer = forwardRef<
  JadmaaVideoPlayerHandle,
  JadmaaVideoPlayerProps
>(({
  videoId: rawVideoId,
  title,
  watermarkText = 'JADMAA Protected Stream',
  isShort: explicitIsShort,
  onDurationLoaded,
  onWatchProgress,
  onVideoPaused,
  onVideoEnded,
  onNextLesson,
  hasNextLesson = false,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerMountRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const controlsTimerRef = useRef<number | null>(null);

  // Clean 11-char ID
  const cleanId = extractYouTubeVideoId(rawVideoId) || rawVideoId;
  const isShortDetected = explicitIsShort ?? (isYouTubeShort(rawVideoId) || false);

  const [isReady, setIsReady] = useState(false);
  const [facadeState, setFacadeState] = useState<FacadeState>('initial');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [privacyBlocked, setPrivacyBlocked] = useState(false);
  const [privacyReason, setPrivacyReason] = useState('');
  const [watermarkIdx, setWatermarkIdx] = useState(0);

  // Rotate dynamic watermark every 8 seconds
  useEffect(() => {
    const interval = window.setInterval(() => {
      setWatermarkIdx((prev) => (prev + 1) % WATERMARK_POSITIONS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Screen-recording & piracy protection
  useEffect(() => {
    const triggerShield = (reason: string) => {
      setPrivacyReason(reason);
      setPrivacyBlocked(true);
      try {
        ytPlayerRef.current?.pauseVideo?.();
      } catch (_) {}
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerShield('Playback paused while tab is inactive for content protection.');
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const isScreenCaptureShortcut =
        e.key === 'PrintScreen' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && ['s', 'i', 'j', 'c', '3', '4', '5'].includes(key)) ||
        ((e.ctrlKey || e.metaKey) && ['u', 'p', 's'].includes(key)) ||
        e.key === 'F12';

      if (isScreenCaptureShortcut) {
        e.preventDefault();
        e.stopPropagation();
        triggerShield('Screen capture, printing, and developer inspection are disabled on course videos.');
      }
    };

    let originalGetDisplayMedia: any = null;
    if (navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function') {
      originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
      try {
        Object.defineProperty(navigator.mediaDevices, 'getDisplayMedia', {
          configurable: true,
          value: async () => {
            triggerShield('Screen recording is blocked to protect JADMAA course content.');
            throw new DOMException('Screen recording is disabled for protected course content.', 'NotAllowedError');
          },
        });
      } catch (_) {}
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyDown, true);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyDown, true);
      if (originalGetDisplayMedia && navigator.mediaDevices) {
        try {
          Object.defineProperty(navigator.mediaDevices, 'getDisplayMedia', {
            configurable: true,
            value: originalGetDisplayMedia,
          });
        } catch (_) {}
      }
    };
  }, []);

  // Initialize YouTube Player
  useEffect(() => {
    if (!cleanId) {
      setIsReady(false);
      setFacadeState('initial');
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    let cancelled = false;
    setFacadeState('initial');

    const initPlayer = async () => {
      await loadYouTubeIframeAPI();
      if (cancelled || !playerMountRef.current) return;

      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch (_) {}
        ytPlayerRef.current = null;
      }

      playerMountRef.current.innerHTML = '';
      const targetDiv = document.createElement('div');
      targetDiv.style.width = '100%';
      targetDiv.style.height = '100%';
      playerMountRef.current.appendChild(targetDiv);

      ytPlayerRef.current = new window.YT.Player(targetDiv, {
        host: 'https://www.youtube-nocookie.com',
        videoId: cleanId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 0,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          showinfo: 0,
          iv_load_policy: 3,
          disablekb: 1,
          fs: 0,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            if (cancelled) return;
            setIsReady(true);
            const dur = event.target.getDuration?.() || 0;
            setDuration(dur);
            if (dur > 0) onDurationLoaded?.(Math.round(dur));
          },
          onStateChange: (event: any) => {
            if (cancelled) return;
            const state = event.data;
            // -1 = UNSTARTED, 0 = ENDED, 1 = PLAYING, 2 = PAUSED, 3 = BUFFERING
            if (state === 1) {
              setFacadeState('playing');
              const dur = event.target.getDuration?.() || 0;
              if (dur > 0) {
                setDuration(dur);
                onDurationLoaded?.(Math.round(dur));
              }
            } else if (state === 2) {
              setFacadeState('paused');
              const cur = event.target.getCurrentTime?.() || 0;
              const dur = event.target.getDuration?.() || duration || 0;
              onVideoPaused?.(cur, dur);
            } else if (state === 0) {
              setFacadeState('ended');
              setShowControls(true);
              const dur = event.target.getDuration?.() || 0;
              if (dur > 0) setCurrentTime(dur);
              onVideoEnded?.();
            } else if (state === 3) {
              // Buffering
              if (facadeState === 'initial') {
                setFacadeState('buffering');
              }
            }
          },
        },
      });
    };

    initPlayer();

    return () => {
      cancelled = true;
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch (_) {}
        ytPlayerRef.current = null;
      }
    };
  }, [cleanId]);

  // Poll current playback progress while playing
  useEffect(() => {
    if (!isReady || facadeState !== 'playing') return;
    const interval = window.setInterval(() => {
      const p = ytPlayerRef.current;
      if (!p || typeof p.getCurrentTime !== 'function') return;
      const cur = p.getCurrentTime() || 0;
      const dur = p.getDuration?.() || duration || 0;
      setCurrentTime(cur);
      if (dur > 0) {
        setDuration(dur);
        onWatchProgress?.(cur, dur);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isReady, facadeState, duration, onWatchProgress]);

  // Fullscreen sync
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const scheduleHideControls = useCallback(() => {
    if (controlsTimerRef.current) window.clearTimeout(controlsTimerRef.current);
    setShowControls(true);
    if (facadeState === 'playing') {
      controlsTimerRef.current = window.setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [facadeState]);

  useImperativeHandle(ref, () => ({
    seekTo: (seconds: number) => {
      const p = ytPlayerRef.current;
      if (!p || typeof p.seekTo !== 'function') return;
      setPrivacyBlocked(false);
      p.seekTo(seconds, true);
      p.playVideo?.();
      setCurrentTime(seconds);
      setFacadeState('playing');
      scheduleHideControls();
    },
    play: () => {
      ytPlayerRef.current?.playVideo?.();
    },
    pause: () => {
      ytPlayerRef.current?.pauseVideo?.();
    },
  }));

  const handleStartPlay = () => {
    const p = ytPlayerRef.current;
    if (!p) return;
    setPrivacyBlocked(false);
    p.playVideo?.();
    scheduleHideControls();
  };

  const handlePause = () => {
    const p = ytPlayerRef.current;
    if (!p) return;
    p.pauseVideo?.();
    setFacadeState('paused');
    setShowControls(true);
  };

  const handleResume = () => {
    const p = ytPlayerRef.current;
    if (!p) return;
    setPrivacyBlocked(false);
    p.playVideo?.();
    scheduleHideControls();
  };

  const handleReplay = () => {
    const p = ytPlayerRef.current;
    if (!p) return;
    setPrivacyBlocked(false);
    p.seekTo(0, true);
    p.playVideo?.();
    setCurrentTime(0);
    setFacadeState('playing');
    scheduleHideControls();
  };

  const skipBy = (delta: number) => {
    const p = ytPlayerRef.current;
    if (!p) return;
    const target = Math.max(0, Math.min(duration || 0, currentTime + delta));
    p.seekTo(target, true);
    setCurrentTime(target);
    scheduleHideControls();
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCurrentTime(val);
    ytPlayerRef.current?.seekTo?.(val, true);
    scheduleHideControls();
  };

  const toggleMute = () => {
    const p = ytPlayerRef.current;
    if (!p) return;
    if (isMuted) {
      p.unMute?.();
      p.setVolume?.(volume || 100);
      setIsMuted(false);
    } else {
      p.mute?.();
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    const p = ytPlayerRef.current;
    if (!p) return;
    p.setVolume?.(val);
    if (val === 0) {
      p.mute?.();
      setIsMuted(true);
    } else {
      p.unMute?.();
      setIsMuted(false);
    }
  };

  const cyclePlaybackRate = () => {
    const rates = [1, 1.25, 1.5, 2, 0.75];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(nextRate);
    ytPlayerRef.current?.setPlaybackRate?.(nextRate);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (_) {}
  };

  if (!cleanId) {
    return (
      <div className="aspect-video w-full bg-[#0A0908] sm:rounded-2xl overflow-hidden shadow-md flex flex-col items-center justify-center text-white gap-3 p-6 text-center">
        <PlayCircle className="w-12 h-12 text-gray-500" />
        <p className="text-sm text-gray-300 font-medium mb-0">Video not available for this lesson</p>
      </div>
    );
  }

  const progressRatio = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const isPlaying = facadeState === 'playing';

  return (
    <div
      ref={containerRef}
      onMouseMove={scheduleHideControls}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      className="relative aspect-video w-full max-h-[56vh] xl:max-h-[500px] bg-[#0A0908] sm:rounded-2xl overflow-hidden shadow-md select-none group"
    >
      {/* ── 1. Embedded YouTube IFrame Container (controls=0) ── */}
      <div
        ref={playerMountRef}
        aria-label={title}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* ── 2. Shorts Letterbox Masks (Hides YouTube Shorts logo, channel tags & like/share buttons) ── */}
      {/* Top Banner Mask */}
      <div className="absolute top-0 inset-x-0 h-12 bg-gradient-to-b from-black via-black/90 to-transparent z-10 pointer-events-none" />

      {/* Side Masks for vertical short letterbox margins */}
      <div className="absolute inset-y-0 left-0 w-[24%] bg-black z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-[24%] bg-black z-10 pointer-events-none" />

      {/* Bottom Gradient Mask behind controls */}
      <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black via-black/90 to-transparent z-10 pointer-events-none" />

      {/* ── 3. Transparent Interaction Shield Overlay (Captures clicks while playing) ── */}
      {isPlaying && (
        <div
          onClick={handlePause}
          onDoubleClick={toggleFullscreen}
          className="absolute inset-0 z-15 cursor-pointer"
        />
      )}

      {/* ── 4. Dynamic Moving Anti-Piracy Watermark ── */}
      <div
        className={`absolute z-20 pointer-events-none transition-all duration-1000 px-2.5 py-1 rounded bg-black/40 backdrop-blur-xs text-white/40 text-[10px] sm:text-xs font-mono tracking-wider border border-white/5 ${WATERMARK_POSITIONS[watermarkIdx]}`}
      >
        {watermarkText}
      </div>

      {/* ── 5. FACADE: Pure Black Screen on Page Load (Zero YouTube UI visible) ── */}
      {(facadeState === 'initial' || facadeState === 'buffering') && (
        <div
          onClick={handleStartPlay}
          className="absolute inset-0 z-30 bg-[#0A0908] flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-opacity duration-300"
        >
          {/* Pulsing Central Red Play Button */}
          <div className="relative mb-4 group/playbtn">
            <div className="absolute -inset-3 rounded-full bg-[#B12B2B]/20 blur-md group-hover/playbtn:bg-[#B12B2B]/40 transition duration-300 animate-pulse" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleStartPlay();
              }}
              aria-label="Start lesson video"
              className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#B12B2B] hover:bg-[#8F2020] text-white flex items-center justify-center shadow-2xl transition-all duration-200 transform group-hover/playbtn:scale-105 active:scale-95 cursor-pointer"
            >
              <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-current ml-1" />
            </button>
          </div>

          <h3 className="text-white font-serif font-bold text-base sm:text-xl max-w-lg line-clamp-1 mb-1">
            {title}
          </h3>

          <div className="flex items-center gap-2 text-white/50 text-[11px] font-medium tracking-wide">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>JADMAA Secure Stream</span>
            <span>•</span>
            <span>1080p HD</span>
          </div>
        </div>
      )}

      {/* ── 6. FACADE: Zero YouTube Overlays on Pause (Conceals YouTube "More Videos" drawer) ── */}
      {facadeState === 'paused' && (
        <div
          onClick={handleResume}
          className="absolute inset-0 z-25 bg-black/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-opacity duration-200"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleResume();
            }}
            aria-label="Resume lesson video"
            className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[#B12B2B] hover:bg-[#8F2020] text-white flex items-center justify-center shadow-2xl transition-transform hover:scale-105 cursor-pointer mb-3"
          >
            <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-current ml-1" />
          </button>
          <p className="text-white font-semibold text-sm mb-0">Playback Paused</p>
          <span className="text-white/50 text-xs mt-1">Click anywhere to resume</span>
        </div>
      )}

      {/* ── 7. FACADE: Pure Black Screen on Video End (Conceals YouTube End-Screen Grid) ── */}
      {facadeState === 'ended' && (
        <div className="absolute inset-0 z-30 bg-[#0A0908] flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-3 shadow-lg">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-1">
            Lesson Completed
          </span>
          <h3 className="text-white font-serif font-bold text-base sm:text-xl max-w-md line-clamp-1 mb-4">
            {title}
          </h3>

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={handleReplay}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Replay Lesson</span>
            </button>

            {hasNextLesson && onNextLesson && (
              <button
                type="button"
                onClick={onNextLesson}
                className="inline-flex items-center gap-2 px-5 py-2 bg-[#B12B2B] hover:bg-[#8F2020] text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-md hover:shadow-lg active:scale-95"
              >
                <span>Next Lesson</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── 8. Content Privacy / Screen-Recording Blocker Shield ── */}
      {privacyBlocked && (
        <div className="absolute inset-0 z-35 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 gap-3">
          <div className="w-12 h-12 rounded-full bg-[#B12B2B]/20 border border-[#B12B2B] flex items-center justify-center text-[#B12B2B]">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-white font-bold text-base sm:text-lg">Content Protection Active</h3>
          <p className="text-gray-300 text-xs sm:text-sm max-w-md mb-0">{privacyReason}</p>
          <button
            type="button"
            onClick={() => {
              setPrivacyBlocked(false);
              ytPlayerRef.current?.playVideo?.();
            }}
            className="mt-1 px-5 py-2 bg-[#B12B2B] hover:bg-[#8F2020] text-white text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer"
          >
            Resume Protected Playback
          </button>
        </div>
      )}

      {/* ── 9. Chromeless JADMAA Control Bar (Floating & Auto-Hiding) ── */}
      <div
        className={`absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/95 via-black/70 to-transparent pt-8 pb-2.5 px-3 sm:px-4 transition-opacity duration-200 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Timeline Scrubber */}
        <div className="relative flex items-center mb-2 group/seek">
          <div className="w-full h-1.5 bg-white/25 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#B12B2B] transition-all duration-150"
              style={{ width: `${progressRatio}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.5}
            value={currentTime}
            onChange={handleSeekChange}
            aria-label="Seek video"
            className="absolute inset-0 w-full h-4 opacity-0 cursor-pointer"
          />
        </div>

        {/* Action Controls Row */}
        <div className="flex items-center justify-between gap-2 text-white">
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              type="button"
              onClick={isPlaying ? handlePause : handleResume}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="p-1.5 hover:bg-white/15 rounded-lg transition cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              ) : (
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              )}
            </button>

            <button
              type="button"
              onClick={() => skipBy(-10)}
              title="Rewind 10s"
              aria-label="Rewind 10 seconds"
              className="p-1.5 hover:bg-white/15 rounded-lg transition cursor-pointer hidden xs:inline-flex"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => skipBy(10)}
              title="Forward 10s"
              aria-label="Forward 10 seconds"
              className="p-1.5 hover:bg-white/15 rounded-lg transition cursor-pointer hidden xs:inline-flex"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                className="p-1.5 hover:bg-white/15 rounded-lg transition cursor-pointer"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                aria-label="Volume"
                className="hidden sm:block w-16 accent-[#B12B2B] cursor-pointer h-1"
              />
            </div>

            {/* Timestamps */}
            <span className="text-[11px] sm:text-xs font-mono text-white/90 tabular-nums ml-1">
              {formatTime(currentTime)} <span className="text-white/50">/</span> {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-white/60 bg-white/10 px-2 py-0.5 rounded-md">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>Protected</span>
            </span>

            <button
              type="button"
              onClick={cyclePlaybackRate}
              title="Playback speed"
              className="px-2 py-1 text-[11px] sm:text-xs font-semibold bg-white/10 hover:bg-white/20 rounded-md transition cursor-pointer min-w-[42px]"
            >
              {playbackRate}x
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              className="p-1.5 hover:bg-white/15 rounded-lg transition cursor-pointer"
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

JadmaaVideoPlayer.displayName = 'JadmaaVideoPlayer';
