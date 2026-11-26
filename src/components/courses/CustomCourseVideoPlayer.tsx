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
} from 'lucide-react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

export interface CustomVideoPlayerHandle {
  seekTo: (seconds: number) => void;
  play: () => void;
  pause: () => void;
}

interface CustomCourseVideoPlayerProps {
  videoId: string;
  title: string;
  watermarkText?: string;
  onWatchProgress?: (currentTime: number, duration: number) => void;
  onVideoEnded?: () => void;
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

// Load YouTube IFrame API script once
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
  'bottom-14 left-4',
  'bottom-14 right-4',
  'top-1/2 left-1/3 -translate-y-1/2',
];

export const CustomCourseVideoPlayer = forwardRef<
  CustomVideoPlayerHandle,
  CustomCourseVideoPlayerProps
>(({ videoId, title, watermarkText = 'JADMAA Protected', onWatchProgress, onVideoEnded }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerMountRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const controlsTimerRef = useRef<number | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
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

  // Rotate dynamic watermark position every 8 seconds to deter cropping/recording
  useEffect(() => {
    const interval = window.setInterval(() => {
      setWatermarkIdx((prev) => (prev + 1) % WATERMARK_POSITIONS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Screen-recording & piracy protection listeners scoped to player mount
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

    // Intercept browser getDisplayMedia API while on the player page
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

  // Initialize / update YouTube IFrame Player
  useEffect(() => {
    if (!videoId) {
      setIsReady(false);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    let cancelled = false;

    const initPlayer = async () => {
      await loadYouTubeIframeAPI();
      if (cancelled || !playerMountRef.current) return;

      // Destroy previous instance cleanly
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch (_) {}
        ytPlayerRef.current = null;
      }

      // Create fresh mount target inside playerMountRef
      playerMountRef.current.innerHTML = '';
      const targetDiv = document.createElement('div');
      targetDiv.style.width = '100%';
      targetDiv.style.height = '100%';
      playerMountRef.current.appendChild(targetDiv);

      ytPlayerRef.current = new window.YT.Player(targetDiv, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
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
            setCurrentTime(0);
            setIsPlaying(false);
          },
          onStateChange: (event: any) => {
            if (cancelled) return;
            const state = event.data;
            // 1 = PLAYING, 2 = PAUSED, 0 = ENDED
            if (state === 1) {
              setIsPlaying(true);
              const dur = event.target.getDuration?.() || 0;
              if (dur > 0) setDuration(dur);
            } else if (state === 2) {
              setIsPlaying(false);
            } else if (state === 0) {
              setIsPlaying(false);
              setShowControls(true);
              const dur = event.target.getDuration?.() || 0;
              if (dur > 0) setCurrentTime(dur);
              onVideoEnded?.();
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
  }, [videoId]);

  // Poll current time & duration while playing
  useEffect(() => {
    if (!isReady || !isPlaying) return;
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
  }, [isReady, isPlaying, duration, onWatchProgress]);

  // Sync fullscreen state with browser
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
    if (isPlaying) {
      controlsTimerRef.current = window.setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  useImperativeHandle(ref, () => ({
    seekTo: (seconds: number) => {
      const p = ytPlayerRef.current;
      if (!p || typeof p.seekTo !== 'function') return;
      setPrivacyBlocked(false);
      p.seekTo(seconds, true);
      p.playVideo?.();
      setCurrentTime(seconds);
      scheduleHideControls();
    },
    play: () => {
      ytPlayerRef.current?.playVideo?.();
    },
    pause: () => {
      ytPlayerRef.current?.pauseVideo?.();
    },
  }));

  const togglePlay = () => {
    const p = ytPlayerRef.current;
    if (!p || !isReady) return;
    setPrivacyBlocked(false);
    if (isPlaying) {
      p.pauseVideo?.();
      setShowControls(true);
    } else {
      p.playVideo?.();
      scheduleHideControls();
    }
  };

  const skipBy = (delta: number) => {
    const p = ytPlayerRef.current;
    if (!p || !isReady) return;
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
    if (!p || !isReady) return;
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

  if (!videoId) {
    return (
      <div className="aspect-video w-full bg-[#181412] rounded-none sm:rounded-2xl overflow-hidden shadow-md flex flex-col items-center justify-center text-white gap-3">
        <PlayCircle className="w-12 h-12 text-gray-500" />
        <p className="text-sm text-gray-300 font-medium mb-0">Video not available for this lesson</p>
      </div>
    );
  }

  const progressRatio = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={scheduleHideControls}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      className="relative aspect-video w-full bg-black sm:rounded-2xl overflow-hidden shadow-md select-none group"
    >
      {/* Embedded YouTube IFrame (controls=0, no YouTube UI overlays) */}
      <div
        ref={playerMountRef}
        aria-label={title}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Transparent Interaction Shield — blocks YouTube Like/Share/Comment/Logo clicks */}
      <div
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        className="absolute inset-0 z-10 cursor-pointer"
      />

      {/* Dynamic Anti-Piracy Watermark */}
      <div
        className={`absolute z-10 pointer-events-none transition-all duration-1000 px-2.5 py-1 rounded bg-black/25 text-white/40 text-[10px] sm:text-xs font-mono tracking-wider ${WATERMARK_POSITIONS[watermarkIdx]}`}
      >
        {watermarkText}
      </div>

      {/* Center Play Overlay when paused */}
      {!isPlaying && !privacyBlocked && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label="Play video"
          className="absolute inset-0 z-20 m-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#B12B2B]/95 hover:bg-[#8F2020] text-white flex items-center justify-center shadow-xl transition-transform hover:scale-105 cursor-pointer"
        >
          <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current ml-0.5" />
        </button>
      )}

      {/* Privacy / Screen-Recording Blocker Shield */}
      {privacyBlocked && (
        <div className="absolute inset-0 z-30 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 gap-3">
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

      {/* Custom JADMAA Video Player Control Bar */}
      <div
        className={`absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-8 pb-2.5 px-3 sm:px-4 transition-opacity duration-200 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Seek / Timeline Bar */}
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

        {/* Bottom Controls Row */}
        <div className="flex items-center justify-between gap-2 text-white">
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              type="button"
              onClick={togglePlay}
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

            {/* Timestamp */}
            <span className="text-[11px] sm:text-xs font-mono text-white/90 tabular-nums ml-1">
              {formatTime(currentTime)} <span className="text-white/50">/</span> {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-white/60 bg-white/10 px-2 py-0.5 rounded-md">
              <Lock className="w-3 h-3" />
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

CustomCourseVideoPlayer.displayName = 'CustomCourseVideoPlayer';
