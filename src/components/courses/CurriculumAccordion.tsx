import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  PlayCircle,
  Lock,
  CheckCircle2,
  Play,
} from 'lucide-react';
import type { Module } from '../../types';
import {
  formatCompactDuration,
  formatSummaryDuration,
  parseDurationStringToSeconds,
  parseTimestamps,
} from '../../utils/curriculum';

interface CurriculumAccordionProps {
  modules: Module[];
  mode?: 'overview' | 'player';
  onSelectLesson?: (lessonId: string) => void;
  onSeekTimestamp?: (lessonId: string, seconds: number) => void;
  activeLessonId?: string;
  currentPlaybackTime?: number;
  completedLessons?: Record<string, boolean>;
  actualDurations?: Record<string, number>;
  courseDescription?: string;
  compactHeader?: boolean;
}

export const CurriculumAccordion: React.FC<CurriculumAccordionProps> = ({
  modules,
  mode = 'overview',
  onSelectLesson,
  onSeekTimestamp,
  activeLessonId,
  currentPlaybackTime = 0,
  completedLessons = {},
  actualDurations = {},
  courseDescription = '',
  compactHeader = false,
}) => {
  const [openModules, setOpenModules] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (modules[0]?.id) initial[modules[0].id] = true;
    return initial;
  });

  const [openLessonChapters, setOpenLessonChapters] = useState<Record<string, boolean>>(() => {
    return activeLessonId ? { [activeLessonId]: true } : {};
  });

  // Automatically open the module and chapters for the active lesson in player mode
  useEffect(() => {
    if (!activeLessonId) return;
    const ownerMod = modules.find((m) =>
      (m.lessons || []).some((l) => l.id === activeLessonId)
    );
    if (ownerMod) {
      setOpenModules((prev) => ({ ...prev, [ownerMod.id]: true }));
    }
    setOpenLessonChapters((prev) => ({ ...prev, [activeLessonId]: true }));
  }, [activeLessonId, modules]);

  const toggleModule = (id: string) => {
    setOpenModules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleLessonChapters = (e: React.MouseEvent, lessonId: string) => {
    e.stopPropagation();
    setOpenLessonChapters((prev) => ({ ...prev, [lessonId]: !prev[lessonId] }));
  };

  // Compute overall course summary stats
  const summaryStats = useMemo(() => {
    let totalLectures = 0;
    let totalSeconds = 0;
    modules.forEach((m) => {
      (m.lessons || []).forEach((l: any) => {
        totalLectures += 1;
        totalSeconds +=
          actualDurations[l.id] ||
          l.durationSeconds ||
          parseDurationStringToSeconds(l.duration);
      });
    });
    return {
      totalSections: modules.length,
      totalLectures,
      totalSeconds,
    };
  }, [modules, actualDurations]);

  const allExpanded = modules.length > 0 && modules.every((m) => openModules[m.id]);

  const toggleAllModules = () => {
    const nextState: Record<string, boolean> = {};
    modules.forEach((m) => {
      nextState[m.id] = !allExpanded;
    });
    setOpenModules(nextState);
  };

  return (
    <div className="space-y-3">
      {/* Top Summary Header */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 text-xs text-[#5C5148] ${
          compactHeader ? 'px-1' : 'pb-1'
        }`}
      >
        <span className="font-medium">
          {summaryStats.totalSections}{' '}
          {summaryStats.totalSections === 1 ? 'section' : 'sections'} •{' '}
          {summaryStats.totalLectures}{' '}
          {summaryStats.totalLectures === 1 ? 'lecture' : 'lectures'}
          {summaryStats.totalSeconds > 0 && (
            <> • {formatSummaryDuration(summaryStats.totalSeconds)} total length</>
          )}
        </span>

        {modules.length > 1 && (
          <button
            type="button"
            onClick={toggleAllModules}
            className="text-xs font-bold text-[#B12B2B] hover:text-[#8F2020] cursor-pointer"
          >
            {allExpanded ? 'Collapse all sections' : 'Expand all sections'}
          </button>
        )}
      </div>

      {/* Bordered Hierarchical Accordion List */}
      <div className="border border-[#E8DDD0] rounded-xl bg-white overflow-hidden divide-y divide-[#E8DDD0]">
        {modules.map((module, index) => {
          const isOpen = !!openModules[module.id];
          const lessons = module.lessons || [];
          const moduleSeconds = lessons.reduce(
            (sum, l: any) =>
              sum +
              (actualDurations[l.id] ||
                l.durationSeconds ||
                parseDurationStringToSeconds(l.duration)),
            0
          );

          const displayModuleTitle = /^module\s*\d+/i.test(module.title)
            ? module.title
            : `Module ${index + 1}: ${module.title}`;

          return (
            <div key={module.id} className="bg-white">
              {/* Level 1 — Module / Section Accordion Header */}
              <button
                type="button"
                onClick={() => toggleModule(module.id)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 bg-[#FAF6F0]/90 hover:bg-[#FAF6F0] text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-[#2B2521] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#2B2521] shrink-0" />
                  )}
                  <div className="min-w-0">
                    <h4 className="font-heading font-bold text-sm sm:text-[15px] text-[#2B2521] truncate">
                      {displayModuleTitle}
                    </h4>
                  </div>
                </div>

                <span className="text-[11px] sm:text-xs font-medium text-[#5C5148] shrink-0 tabular-nums">
                  {lessons.length} {lessons.length === 1 ? 'lecture' : 'lectures'}
                  {moduleSeconds > 0 && ` • ${formatSummaryDuration(moduleSeconds)}`}
                </span>
              </button>

              {/* Level 2 — Lessons / Lectures List */}
              {isOpen && (
                <div className="divide-y divide-[#E8DDD0]/50 bg-white border-t border-[#E8DDD0]">
                  {lessons.map((lesson: any) => {
                    const isActive = activeLessonId === lesson.id;
                    const isCompleted = Boolean(completedLessons[lesson.id]);
                    const lessonSecs =
                      actualDurations[lesson.id] ||
                      lesson.durationSeconds ||
                      parseDurationStringToSeconds(lesson.duration);
                    const durationDisplay = formatCompactDuration(
                      lessonSecs,
                      lesson.duration
                    );

                    const timestamps = parseTimestamps(
                      `${lesson.summary || ''}\n${lesson.description || ''}\n${
                        isActive ? courseDescription : ''
                      }`,
                      lesson.chapters
                    );
                    const hasChapters = timestamps.length > 0;
                    const chaptersOpen = Boolean(openLessonChapters[lesson.id]);

                    // Determine currently playing timestamp for active lesson
                    let activeTsSec = -1;
                    if (isActive && mode === 'player') {
                      for (const ts of timestamps) {
                        if (ts.seconds <= currentPlaybackTime + 0.5) {
                          activeTsSec = ts.seconds;
                        }
                      }
                    }

                    const canClickRow =
                      mode === 'player' ||
                      (Boolean(onSelectLesson) && Boolean(lesson.isFreePreview));

                    return (
                      <div key={lesson.id}>
                        {/* Lecture Row */}
                        <div
                          onClick={() => {
                            if (mode === 'player' || lesson.isFreePreview) {
                              onSelectLesson?.(lesson.id);
                            }
                          }}
                          className={`flex items-center justify-between gap-3 px-4 py-3 text-xs sm:text-sm transition-colors ${
                            canClickRow ? 'cursor-pointer hover:bg-[#FAF6F0]/60' : ''
                          } ${
                            isActive
                              ? 'bg-red-50/75 border-l-4 border-[#B12B2B]'
                              : 'border-l-4 border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {/* Left Icon */}
                            {mode === 'player' ? (
                              isCompleted ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : (
                                <PlayCircle
                                  className={`w-4 h-4 shrink-0 ${
                                    isActive ? 'text-[#B12B2B]' : 'text-[#5C5148]'
                                  }`}
                                />
                              )
                            ) : lesson.isFreePreview ? (
                              <PlayCircle className="w-4 h-4 text-[#B12B2B] shrink-0" />
                            ) : (
                              <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            )}

                            {/* Lesson Title + Inline Chapter Expand Chevron */}
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                className={`truncate ${
                                  isActive
                                    ? 'font-bold text-[#B12B2B]'
                                    : 'font-medium text-[#2B2521]'
                                }`}
                              >
                                {lesson.title}
                              </span>

                              {hasChapters && (
                                <button
                                  type="button"
                                  onClick={(e) => toggleLessonChapters(e, lesson.id)}
                                  aria-label={
                                    chaptersOpen
                                      ? 'Hide timestamps'
                                      : 'Show timestamps'
                                  }
                                  className="p-0.5 rounded hover:bg-[#E8DDD0]/60 text-[#5C5148] shrink-0 cursor-pointer"
                                >
                                  {chaptersOpen ? (
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Right: Optional Preview link + Duration */}
                          <div className="flex items-center gap-3 shrink-0">
                            {mode === 'overview' && lesson.isFreePreview && (
                              <span className="text-[11px] font-bold text-[#B12B2B] underline">
                                Preview
                              </span>
                            )}
                            {durationDisplay && (
                              <span className="text-[#5C5148] font-mono text-[11px] tabular-nums">
                                {durationDisplay}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Level 3 — Expandable Vertical Timestamps / Chapters List */}
                        {hasChapters && chaptersOpen && (
                          <div className="bg-[#FAF6F0]/45 border-t border-[#E8DDD0]/50 divide-y divide-[#E8DDD0]/40">
                            {timestamps.map((ts, tsIdx) => {
                              const isTsActive = isActive && ts.seconds === activeTsSec;
                              return (
                                <button
                                  key={tsIdx}
                                  type="button"
                                  onClick={() => {
                                    if (onSeekTimestamp) {
                                      onSeekTimestamp(lesson.id, ts.seconds);
                                    } else if (lesson.isFreePreview && onSelectLesson) {
                                      onSelectLesson(lesson.id);
                                    }
                                  }}
                                  className={`w-full text-left pl-10 pr-4 py-2 flex items-center justify-between gap-3 text-xs transition cursor-pointer ${
                                    isTsActive
                                      ? 'bg-red-50/80 text-[#B12B2B] font-semibold'
                                      : 'text-[#5C5148] hover:bg-[#FAF6F0] hover:text-[#2B2521]'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Play
                                      className={`w-2.5 h-2.5 shrink-0 ${
                                        isTsActive
                                          ? 'text-[#B12B2B] fill-current'
                                          : 'text-gray-400'
                                      }`}
                                    />
                                    <span className="truncate">{ts.label}</span>
                                  </div>
                                  <span
                                    className={`font-mono text-[11px] shrink-0 tabular-nums px-1.5 py-0.5 rounded ${
                                      isTsActive
                                        ? 'bg-[#B12B2B] text-white font-bold'
                                        : 'text-[#B12B2B] font-semibold'
                                    }`}
                                  >
                                    {ts.timeLabel}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
