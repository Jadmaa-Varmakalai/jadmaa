import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { SEO } from '../../components/common/SEO';
import {
  ChevronLeft,
  PlayCircle,
  CheckCircle2,
  Award,
  ArrowLeft,
  ArrowRight,
  Star,
  Users,
  Clock,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ListVideo,
  Bookmark,
} from 'lucide-react';
import { courseApi } from '../../lib/api/courseApi';
import { progressApi } from '../../lib/api/progressApi';
import { useAuth } from '../../context/AuthContext';
import {
  CustomCourseVideoPlayer,
  type CustomVideoPlayerHandle,
} from '../../components/courses/CustomCourseVideoPlayer';
import { extractYouTubeVideoId } from '../../utils/youtube';

interface TimestampItem {
  seconds: number;
  timeLabel: string;
  label: string;
}

const parseTimeToSeconds = (timeStr: string): number => {
  const parts = timeStr.split(':').map((n) => parseInt(n, 10));
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
};

const parseTimestamps = (text?: string, chapters?: any[]): TimestampItem[] => {
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
};

export const LearnCourse: React.FC = () => {
  const { courseId } = useParams();
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const playerRef = useRef<CustomVideoPlayerHandle>(null);
  const completedRef = useRef<Record<string, boolean>>({});
  const markingRef = useRef<Record<string, boolean>>({});
  const lastSavedSecRef = useRef<Record<string, number>>({});

  const [course, setCourse] = useState<any>(null);
  const [activeLessonId, setActiveLessonId] = useState<string>('');
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({});
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const [sidebarTab, setSidebarTab] = useState<'lessons' | 'timestamps'>('lessons');
  const [mobileSectionTab, setMobileSectionTab] = useState<'curriculum' | 'overview'>('curriculum');
  const [descExpanded, setDescExpanded] = useState(false);

  // Keep completedRef synced for async callbacks
  useEffect(() => {
    completedRef.current = completedLessons;
  }, [completedLessons]);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    const fetchData = async () => {
      try {
        if (!courseId) return;

        // Always fetch fresh data so students see the latest video URLs
        const courseData = await courseApi.getCourseForPlayer(courseId);
        setCourse(courseData);

        let completedIds: string[] = [];
        try {
          const progRes = await progressApi.getCourseProgress(courseData.id);
          if (progRes.success && progRes.data) {
            const completedMap: Record<string, boolean> = {};
            completedIds = progRes.data.completedLessonIds || [];
            completedIds.forEach((id: string) => {
              completedMap[id] = true;
            });
            setCompletedLessons(completedMap);
            completedRef.current = completedMap;
            setProgressPercent(progRes.data.percentage || 0);
          }
        } catch (progErr) {
          console.error('Progress load error:', progErr);
        }

        // Set initial active lesson to first unfinished lesson
        let firstUnfinished = courseData.modules?.[0]?.lessons?.[0]?.id;
        for (const m of courseData.modules || []) {
          let found = false;
          for (const l of m.lessons || []) {
            if (!completedIds.includes(l.id)) {
              firstUnfinished = l.id;
              found = true;
              break;
            }
          }
          if (found) break;
        }
        setActiveLessonId(firstUnfinished || courseData.modules?.[0]?.lessons?.[0]?.id || '');
      } catch (err) {
        console.error('Failed to load course player', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, isLoggedIn, navigate, authLoading]);

  // Automatic completion & progress tracker
  const syncLessonCompletion = useCallback(
    async (lessonId: string, watchedSeconds: number, markComplete: boolean) => {
      if (!lessonId || !course) return;
      if (markComplete && (completedRef.current[lessonId] || markingRef.current[lessonId])) {
        return;
      }

      if (markComplete) {
        markingRef.current[lessonId] = true;
      }

      try {
        await progressApi.updateLessonProgress(lessonId, Math.floor(watchedSeconds), markComplete);
        if (markComplete) {
          const updatedMap = { ...completedRef.current, [lessonId]: true };
          completedRef.current = updatedMap;
          setCompletedLessons(updatedMap);
          progressApi.clearCache();

          const progRes = await progressApi.getCourseProgress(course.id);
          if (progRes.success && progRes.data) {
            setProgressPercent(progRes.data.percentage);
          }
        }
      } catch (err) {
        // Handle non-enrolled admin/instructor preview gracefully in UI state
        if (markComplete) {
          const updatedMap = { ...completedRef.current, [lessonId]: true };
          completedRef.current = updatedMap;
          setCompletedLessons(updatedMap);
          let total = 0;
          let done = 0;
          course.modules?.forEach((m: any) => {
            m.lessons?.forEach((l: any) => {
              total += 1;
              if (updatedMap[l.id]) done += 1;
            });
          });
          if (total > 0) setProgressPercent(Math.round((done / total) * 100));
        }
      } finally {
        if (markComplete) {
          markingRef.current[lessonId] = false;
        }
      }
    },
    [course]
  );

  const handleWatchProgress = useCallback(
    (currentTime: number, duration: number) => {
      if (!activeLessonId) return;
      const prevSaved = lastSavedSecRef.current[activeLessonId] || 0;

      // Auto-complete once student watches >= 85% of the video
      if (duration > 0 && currentTime / duration >= 0.85 && !completedRef.current[activeLessonId]) {
        lastSavedSecRef.current[activeLessonId] = currentTime;
        syncLessonCompletion(activeLessonId, currentTime, true);
        return;
      }

      // Periodically save watch position every 15 seconds
      if (Math.abs(currentTime - prevSaved) >= 15) {
        lastSavedSecRef.current[activeLessonId] = currentTime;
        syncLessonCompletion(activeLessonId, currentTime, false);
      }
    },
    [activeLessonId, syncLessonCompletion]
  );

  const handleVideoEnded = useCallback(() => {
    if (!activeLessonId) return;
    if (!completedRef.current[activeLessonId]) {
      syncLessonCompletion(activeLessonId, lastSavedSecRef.current[activeLessonId] || 0, true);
    }
  }, [activeLessonId, syncLessonCompletion]);

  // Flatten lessons for index lookup and prev/next navigation
  const allLessons = useMemo(() => {
    const list: Array<{ lesson: any; moduleTitle: string; moduleIndex: number; globalIndex: number }> = [];
    if (!course?.modules) return list;
    let idx = 0;
    course.modules.forEach((m: any, mIdx: number) => {
      (m.lessons || []).forEach((l: any) => {
        idx += 1;
        list.push({ lesson: l, moduleTitle: m.title, moduleIndex: mIdx, globalIndex: idx });
      });
    });
    return list;
  }, [course]);

  const activeEntry = useMemo(
    () => allLessons.find((item) => item.lesson.id === activeLessonId) || allLessons[0],
    [allLessons, activeLessonId]
  );

  const activeLesson = activeEntry?.lesson;
  const activeLessonTitle = activeLesson?.title || '';
  const activeModuleTitle = activeEntry?.moduleTitle || '';
  const activeVideoUrl = activeLesson?.videoUrl || '';
  const cleanVideoId = extractYouTubeVideoId(activeVideoUrl) || '';

  // Auto-complete text-only lessons (no video) after 3 seconds of viewing
  useEffect(() => {
    if (!activeLessonId || cleanVideoId || completedRef.current[activeLessonId]) return;
    const timer = window.setTimeout(() => {
      syncLessonCompletion(activeLessonId, 0, true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [activeLessonId, cleanVideoId, syncLessonCompletion]);

  const activeIdx = allLessons.findIndex((item) => item.lesson.id === activeLessonId);
  const prevLesson = activeIdx > 0 ? allLessons[activeIdx - 1].lesson : null;
  const nextLesson =
    activeIdx >= 0 && activeIdx < allLessons.length - 1 ? allLessons[activeIdx + 1].lesson : null;

  const lessonTimestamps = useMemo(
    () =>
      parseTimestamps(
        `${activeLesson?.summary || ''}\n${activeLesson?.description || ''}\n${course?.description || ''}`,
        activeLesson?.chapters
      ),
    [activeLesson, course?.description]
  );

  const handleSeekTimestamp = (seconds: number) => {
    playerRef.current?.seekTo(seconds);
  };

  // Render description with clickable timestamps
  const renderDescriptionWithTimestamps = (text: string) => {
    const regex = /(\b(?:\d{1,2}:)?\d{1,2}:\d{2}\b)/g;
    const parts = text.split(regex);
    return parts.map((part, idx) => {
      if (/^(?:\d{1,2}:)?\d{1,2}:\d{2}$/.test(part)) {
        const secs = parseTimeToSeconds(part);
        return (
          <button
            key={idx}
            type="button"
            onClick={() => handleSeekTimestamp(secs)}
            className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded bg-[#B12B2B]/10 text-[#B12B2B] hover:bg-[#B12B2B] hover:text-white font-mono text-xs font-semibold transition cursor-pointer"
          >
            {part}
          </button>
        );
      }
      return <React.Fragment key={idx}>{part}</React.Fragment>;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#B12B2B]/30 border-t-[#B12B2B] rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center p-6 text-center gap-4">
        <p className="text-lg font-bold text-[#2B2521]">Course not found.</p>
        <Link
          to="/my-courses"
          className="px-5 py-2.5 bg-[#B12B2B] text-white text-sm font-semibold rounded-xl"
        >
          Back to My Courses
        </Link>
      </div>
    );
  }

  const instructorName =
    course.instructor?.displayName || course.instructor?.name || 'JADMAA Master';
  const instructorTitle = course.instructor?.title || 'JADMAA Varmakalai Lineage';
  const instructorAvatar = course.instructor?.avatarUrl || course.instructor?.avatar;
  const ratingValue = course.rating || 4.9;
  const reviewCount = course.reviewCount || 120;
  const watermarkIdentity = user
    ? `${user.name || 'Student'} • ${user.email || user.id}`
    : 'JADMAA Protected Stream';

  const fullDescriptionText =
    activeLesson?.summary ||
    activeLesson?.description ||
    course.description ||
    'Master authentic Varmakalai techniques through structured traditional guidance.';

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="min-h-screen bg-[#FAF6F0] text-[#2B2521] select-none"
    >
      <SEO title={`${activeLessonTitle} | ${course.title} | JADMAA`} />

      {/* Print / PDF Save Blocker */}
      <style>{`@media print { body { display: none !important; } }`}</style>

      {/* ── Top Slim Learning Bar ── */}
      <header className="bg-white border-b border-[#E8DDD0] py-2.5 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 shadow-2xs h-[52px]">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/my-courses"
            className="text-[#5C5148] hover:text-[#B12B2B] transition flex items-center gap-1 text-xs sm:text-sm font-semibold shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">My Courses</span>
          </Link>
          <div className="h-4 w-px bg-[#E8DDD0] hidden sm:block shrink-0" />
          <h1 className="font-bold text-[#2B2521] text-xs sm:text-sm md:text-base truncate max-w-[180px] sm:max-w-md">
            {course.title}
          </h1>
        </div>

        <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold shrink-0">
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Protected</span>
          </span>
          <span className="hidden sm:inline text-[#5C5148]">Progress:</span>
          <div className="flex items-center gap-2">
            <div className="w-16 sm:w-24 bg-[#E8DDD0] rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#B12B2B] h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[#2B2521] font-bold tabular-nums">{progressPercent}%</span>
          </div>
        </div>
      </header>

      {/* ── YouTube-Style Responsive Watch Workspace ── */}
      <div className="max-w-[1600px] mx-auto px-0 sm:px-4 lg:px-6 sm:py-4 pb-20 lg:pb-8">
        <div className="flex flex-col lg:grid lg:grid-cols-12 [@media(min-width:768px)_and_(orientation:landscape)]:grid [@media(min-width:768px)_and_(orientation:landscape)]:grid-cols-12 gap-0 sm:gap-5 lg:gap-6 items-start">
          
          {/* ── PRIMARY LEFT COLUMN (Video + Below-Player Info) ── */}
          <div className="w-full lg:col-span-8 [@media(min-width:768px)_and_(orientation:landscape)]:col-span-8 flex flex-col">
            
            {/* Sticky Player on Mobile & Tablet Portrait */}
            <div className="sticky top-[52px] z-30 lg:static [@media(min-width:768px)_and_(orientation:landscape)]:static w-full">
              <CustomCourseVideoPlayer
                ref={playerRef}
                videoId={cleanVideoId}
                title={activeLessonTitle}
                watermarkText={watermarkIdentity}
                onWatchProgress={handleWatchProgress}
                onVideoEnded={handleVideoEnded}
              />
            </div>

            {/* Mobile & Tablet Portrait Tab Switcher */}
            <div className="lg:hidden [@media(min-width:768px)_and_(orientation:landscape)]:hidden bg-white border-b border-[#E8DDD0] px-4 py-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileSectionTab('curriculum')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  mobileSectionTab === 'curriculum'
                    ? 'bg-[#B12B2B] text-white shadow-2xs'
                    : 'bg-[#FAF6F0] text-[#5C5148]'
                }`}
              >
                Curriculum & Timestamps
              </button>
              <button
                type="button"
                onClick={() => setMobileSectionTab('overview')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  mobileSectionTab === 'overview'
                    ? 'bg-[#B12B2B] text-white shadow-2xs'
                    : 'bg-[#FAF6F0] text-[#5C5148]'
                }`}
              >
                Overview, Ratings & Instructor
              </button>
            </div>

            {/* Below-Player Info (Always visible on Desktop/Landscape; Tabbed on Portrait/Mobile) */}
            <div
              className={`px-4 sm:px-0 pt-4 space-y-3 ${
                mobileSectionTab === 'overview'
                  ? 'block'
                  : 'hidden lg:block [@media(min-width:768px)_and_(orientation:landscape)]:block'
              }`}
            >
              {/* 1. Lesson Title & Quick Action Strip (NO Mark as Read Button) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#B12B2B] block mb-0.5">
                    {activeModuleTitle}
                  </span>
                  <h2 className="text-xl lg:text-2xl font-bold font-serif text-[#2B2521] leading-snug">
                    {activeLessonTitle}
                  </h2>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => prevLesson && setActiveLessonId(prevLesson.id)}
                    disabled={!prevLesson}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition min-h-[40px] ${
                      prevLesson
                        ? 'bg-white border-[#E8DDD0] text-[#2B2521] hover:border-[#B12B2B] cursor-pointer'
                        : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>

                  {progressPercent === 100 ? (
                    <Link
                      to="/certificates"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition min-h-[40px] shadow-2xs"
                    >
                      <Award className="w-4 h-4" />
                      <span>View Certificate</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => nextLesson && setActiveLessonId(nextLesson.id)}
                      disabled={!nextLesson}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition min-h-[40px] ${
                        nextLesson
                          ? 'bg-[#B12B2B] hover:bg-[#8F2020] text-white cursor-pointer shadow-2xs'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <span>Next Lesson</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Course Ratings & Progress Row */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#5C5148]">
                <div className="inline-flex items-center gap-1.5 bg-white border border-[#E8DDD0] px-2.5 py-1 rounded-full">
                  <div className="flex items-center text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="font-bold text-[#2B2521]">{ratingValue}</span>
                  <span>({reviewCount} Ratings)</span>
                </div>

                {typeof course.studentsCount === 'number' && course.studentsCount > 0 && (
                  <div className="inline-flex items-center gap-1.5 bg-white border border-[#E8DDD0] px-2.5 py-1 rounded-full">
                    <Users className="w-3.5 h-3.5 text-[#B12B2B]" />
                    <span className="font-medium">{course.studentsCount} Learners</span>
                  </div>
                )}

                <div className="inline-flex items-center gap-1.5 bg-white border border-[#E8DDD0] px-2.5 py-1 rounded-full">
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${
                      completedLessons[activeLessonId] ? 'text-emerald-600' : 'text-[#B12B2B]'
                    }`}
                  />
                  <span className="font-semibold text-[#2B2521]">
                    Course Progress: {progressPercent}%
                  </span>
                </div>
              </div>

              {/* 3. Course Instructor Card */}
              <div className="flex items-center justify-between py-3 border-y border-[#E8DDD0]">
                <div className="flex items-center gap-3">
                  {instructorAvatar ? (
                    <img
                      src={instructorAvatar}
                      alt={instructorName}
                      className="w-10 h-10 rounded-full object-cover border border-[#E8DDD0]"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#B12B2B] text-white font-bold text-sm flex items-center justify-center shrink-0">
                      {instructorName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-bold text-[#2B2521] leading-tight">
                      {instructorName}
                    </h3>
                    <p className="text-xs text-[#5C5148] mb-0">{instructorTitle}</p>
                  </div>
                </div>
              </div>

              {/* 4. Expandable Description & Clickable Timestamps Box */}
              <div className="bg-white border border-[#E8DDD0] rounded-xl p-4">
                <div
                  className={`text-xs sm:text-sm text-[#5C5148] leading-relaxed whitespace-pre-line ${
                    descExpanded ? '' : 'line-clamp-3'
                  }`}
                >
                  {renderDescriptionWithTimestamps(fullDescriptionText)}
                </div>

                {descExpanded && Array.isArray(course.whatYouWillLearn) && course.whatYouWillLearn.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-[#E8DDD0]">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#2B2521] mb-2">
                      Key Techniques & Takeaways
                    </h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-[#5C5148]">
                      {course.whatYouWillLearn.map((point: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#B12B2B] shrink-0 mt-0.5" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setDescExpanded(!descExpanded)}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#B12B2B] hover:text-[#8F2020] cursor-pointer"
                >
                  <span>{descExpanded ? 'Show less' : 'Show more'}</span>
                  {descExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ── SECONDARY RIGHT COLUMN (Course Curriculum & Timestamp Sidebar) ── */}
          <aside
            className={`w-full lg:col-span-4 [@media(min-width:768px)_and_(orientation:landscape)]:col-span-4 lg:sticky lg:top-16 [@media(min-width:768px)_and_(orientation:landscape)]:sticky [@media(min-width:768px)_and_(orientation:landscape)]:top-16 max-h-[calc(100vh-5.5rem)] flex flex-col bg-white border-y sm:border border-[#E8DDD0] sm:rounded-2xl overflow-hidden shadow-2xs ${
              mobileSectionTab === 'curriculum'
                ? 'flex'
                : 'hidden lg:flex [@media(min-width:768px)_and_(orientation:landscape)]:flex'
            }`}
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-[#E8DDD0] bg-[#FAF6F0]/60 space-y-3 shrink-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-bold text-sm sm:text-base text-[#2B2521] truncate">
                    {course.title}
                  </h3>
                  <p className="text-[11px] text-[#5C5148] mb-0">
                    Lesson {activeIdx >= 0 ? activeIdx + 1 : 1} of {allLessons.length}
                  </p>
                </div>
                <span className="text-xs font-bold text-[#B12B2B] bg-red-50 border border-red-100 px-2 py-0.5 rounded-full shrink-0">
                  {progressPercent}%
                </span>
              </div>

              {/* Compact Progress Bar */}
              <div className="w-full bg-[#E8DDD0] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#B12B2B] h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Filter / View Tabs */}
              <div className="grid grid-cols-2 gap-1.5 bg-[#E8DDD0]/50 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setSidebarTab('lessons')}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    sidebarTab === 'lessons'
                      ? 'bg-white text-[#2B2521] shadow-2xs'
                      : 'text-[#5C5148] hover:text-[#2B2521]'
                  }`}
                >
                  <ListVideo className="w-3.5 h-3.5 text-[#B12B2B]" />
                  <span>Lessons</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSidebarTab('timestamps')}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    sidebarTab === 'timestamps'
                      ? 'bg-white text-[#2B2521] shadow-2xs'
                      : 'text-[#5C5148] hover:text-[#2B2521]'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5 text-[#B12B2B]" />
                  <span>Timestamps</span>
                </button>
              </div>
            </div>

            {/* Sidebar Scrollable Body */}
            <div className="overflow-y-auto flex-1 divide-y divide-[#E8DDD0]/60">
              {sidebarTab === 'lessons' ? (
                course.modules?.map((m: any, mIndex: number) => (
                  <div key={m.id}>
                    <div className="px-4 py-2.5 bg-[#FAF6F0]/70 text-xs font-bold text-[#2B2521] border-b border-[#E8DDD0]/50">
                      Module {mIndex + 1}: {m.title}
                    </div>
                    <div className="divide-y divide-[#E8DDD0]/40">
                      {(m.lessons || []).map((l: any, lIndex: number) => {
                        const isCompleted = completedLessons[l.id];
                        const isActive = l.id === activeLessonId;
                        return (
                          <div
                            key={l.id}
                            className={`transition ${
                              isActive
                                ? 'bg-red-50/70 border-l-4 border-[#B12B2B]'
                                : 'hover:bg-[#FAF6F0]/50 border-l-4 border-transparent'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setActiveLessonId(l.id)}
                              className="w-full text-left px-3.5 py-3 flex items-start gap-2.5 text-xs sm:text-sm cursor-pointer"
                            >
                              <div className="mt-0.5 shrink-0">
                                {isCompleted ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                ) : isActive ? (
                                  <PlayCircle className="w-4 h-4 text-[#B12B2B]" />
                                ) : (
                                  <span className="w-4 h-4 rounded-full border border-gray-300 text-[10px] font-semibold text-gray-400 flex items-center justify-center">
                                    {lIndex + 1}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span
                                  className={`block leading-snug ${
                                    isActive
                                      ? 'font-bold text-[#B12B2B]'
                                      : 'font-medium text-[#2B2521]'
                                  }`}
                                >
                                  {l.title}
                                </span>
                                {l.duration && (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-[#5C5148] mt-1">
                                    <Clock className="w-3 h-3" />
                                    {l.duration}
                                  </span>
                                )}
                              </div>
                            </button>

                            {/* Nested Timestamp Chips on Active Lesson */}
                            {isActive && lessonTimestamps.length > 0 && (
                              <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                                {lessonTimestamps.map((ts, tsIdx) => (
                                  <button
                                    key={tsIdx}
                                    type="button"
                                    onClick={() => handleSeekTimestamp(ts.seconds)}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-[#E8DDD0] hover:border-[#B12B2B] text-[11px] text-[#2B2521] hover:text-[#B12B2B] transition cursor-pointer"
                                  >
                                    <span className="font-mono font-bold text-[#B12B2B]">
                                      {ts.timeLabel}
                                    </span>
                                    <span className="truncate max-w-[140px]">{ts.label}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 space-y-2">
                  {lessonTimestamps.length > 0 ? (
                    lessonTimestamps.map((ts, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSeekTimestamp(ts.seconds)}
                        className="w-full text-left p-3 rounded-xl border border-[#E8DDD0] hover:border-[#B12B2B] hover:bg-[#FAF6F0] transition flex items-center gap-3 cursor-pointer"
                      >
                        <span className="px-2 py-1 rounded-md bg-[#B12B2B]/10 text-[#B12B2B] font-mono text-xs font-bold shrink-0">
                          {ts.timeLabel}
                        </span>
                        <span className="text-xs sm:text-sm font-medium text-[#2B2521] truncate">
                          {ts.label}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8 px-4 space-y-1.5">
                      <Clock className="w-8 h-8 text-gray-300 mx-auto" />
                      <p className="text-xs text-[#5C5148] mb-0">
                        No chapter timestamps listed for this lesson. Use the player seek bar to scrub to any part of the video.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* ── Mobile & Tablet Portrait Bottom Navigation Bar ── */}
      <div className="lg:hidden [@media(min-width:768px)_and_(orientation:landscape)]:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E8DDD0] px-4 py-2.5 pb-safe flex items-center justify-between gap-3 shadow-lg">
        <button
          type="button"
          onClick={() => prevLesson && setActiveLessonId(prevLesson.id)}
          disabled={!prevLesson}
          className={`flex items-center justify-center gap-1.5 min-h-[44px] px-4 rounded-xl text-xs font-bold border transition ${
            prevLesson
              ? 'border-[#E8DDD0] text-[#2B2521] hover:border-[#B12B2B] cursor-pointer'
              : 'border-gray-200 text-gray-300 cursor-not-allowed'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <span className="text-[11px] font-semibold text-[#5C5148] tabular-nums">
          {activeIdx >= 0 ? activeIdx + 1 : 1} / {allLessons.length}
        </span>

        {progressPercent === 100 ? (
          <Link
            to="/certificates"
            className="flex items-center justify-center gap-1.5 min-h-[44px] px-4 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-xs"
          >
            <Award className="w-4 h-4" />
            <span>Certificate</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => nextLesson && setActiveLessonId(nextLesson.id)}
            disabled={!nextLesson}
            className={`flex items-center justify-center gap-1.5 min-h-[44px] px-4 rounded-xl text-xs font-bold transition ${
              nextLesson
                ? 'bg-[#B12B2B] text-white hover:bg-[#8F2020] cursor-pointer shadow-xs'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span>Next</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
