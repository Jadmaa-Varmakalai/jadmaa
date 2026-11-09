import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { SEO } from '../../components/common/SEO';
import { ChevronLeft, PlayCircle, CheckCircle, Award, ArrowLeft, ArrowRight } from 'lucide-react';
import { courseApi } from '../../lib/api/courseApi';
import { progressApi } from '../../lib/api/progressApi';
import { useAuth } from '../../context/AuthContext';

const extractYouTubeVideoId = (input: string): string => {
  if (!input) return '';
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:shorts\/|embed\/|v\/|live\/|watch\?v=|watch\?.+&v=))([a-zA-Z0-9_-]{11})/i
  );
  if (match && match[1]) {
    return match[1];
  }
  const fallback = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:shorts\/|embed\/|v\/|live\/|watch\?v=|watch\?.+&v=))([^&?#/]+)/i
  );
  return fallback && fallback[1] ? fallback[1] : trimmed;
};

export const LearnCourse: React.FC = () => {
  const { courseId } = useParams();
  const { isLoggedIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<any>(null);
  const [activeLessonId, setActiveLessonId] = useState<string>('');
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({});
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [loadingCompletes, setLoadingCompletes] = useState<Record<string, boolean>>({});
  const [mobileCurriculumOpen, setMobileCurriculumOpen] = useState(false);

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
        // (even if an admin/instructor updated them after purchase)
        const courseData = await courseApi.getCourseForPlayer(courseId);
        setCourse(courseData);
        
        const progRes = await progressApi.getCourseProgress(courseData.id);
        if (progRes.success && progRes.data) {
          const completedMap: Record<string, boolean> = {};
          progRes.data.completedLessonIds.forEach((id: string) => {
            completedMap[id] = true;
          });
          setCompletedLessons(completedMap);
          setProgressPercent(progRes.data.percentage);
        }

        // Set initial active lesson
        let firstUnfinished = courseData.modules?.[0]?.lessons?.[0]?.id;
        for (const m of courseData.modules) {
          for (const l of m.lessons) {
             if (!progRes.data?.completedLessonIds?.includes(l.id)) {
                firstUnfinished = l.id;
                break;
             }
          }
          if (firstUnfinished !== courseData.modules?.[0]?.lessons?.[0]?.id) break;
        }
        setActiveLessonId(firstUnfinished || courseData.modules?.[0]?.lessons?.[0]?.id);

      } catch (err) {
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [courseId, isLoggedIn, navigate, authLoading]);

  const toggleComplete = async (id: string, forceStatus?: boolean) => {
    const isCompleted = forceStatus !== undefined ? forceStatus : !completedLessons[id];
    setLoadingCompletes(prev => ({ ...prev, [id]: true }));
    
    try {
      await progressApi.updateLessonProgress(id, 0, isCompleted);
      // Update state only after success
      setCompletedLessons(prev => ({ ...prev, [id]: isCompleted }));
      
      if (course) {
        const progRes = await progressApi.getCourseProgress(course.id);
        if (progRes.success && progRes.data) {
          setProgressPercent(progRes.data.percentage);
        }
      }
    } catch (err) {
      console.error('Failed to update progress', err);
    } finally {
      setLoadingCompletes(prev => ({ ...prev, [id]: false }));
    }
  };

  const getNextLessonId = (currentId: string) => {
    if (!course) return null;
    let foundCurrent = false;
    for (const m of course.modules) {
      for (const l of m.lessons) {
        if (foundCurrent) return l.id;
        if (l.id === currentId) foundCurrent = true;
      }
    }
    return null;
  };

  const getPrevLessonId = (currentId: string) => {
    if (!course) return null;
    let prevId = null;
    for (const m of course.modules) {
      for (const l of m.lessons) {
        if (l.id === currentId) return prevId;
        prevId = l.id;
      }
    }
    return null;
  };

  const goToNextLesson = () => {
    const nextId = getNextLessonId(activeLessonId);
    if (nextId) setActiveLessonId(nextId);
  };

  const goToPrevLesson = () => {
    const prevId = getPrevLessonId(activeLessonId);
    if (prevId) setActiveLessonId(prevId);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-pulse h-10 w-10 bg-gray-300 rounded-full"></div>
    </div>
  );
  if (!course) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Course not found.</div>;

  let activeLessonTitle = "";
  let activeVideoId = "";
  let activeModuleTitle = "";
  
  course.modules.forEach((m: any) => {
    const found = m.lessons.find((l: any) => l.id === activeLessonId);
    if (found) {
      activeLessonTitle = found.title;
      activeVideoId = found.videoUrl || '';
      activeModuleTitle = m.title;
    }
  });

  const nextLessonId = getNextLessonId(activeLessonId);
  const prevLessonId = getPrevLessonId(activeLessonId);
  const isCurrentCompleted = completedLessons[activeLessonId];
  const isCurrentCompleting = loadingCompletes[activeLessonId];

  return (
    <>
      <SEO title={`${activeLessonTitle} | ${course.title} | JADMAA`} />
      
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 text-gray-900 py-3 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-4">
          <Link to="/my-courses" className="text-gray-500 hover:text-gray-900 transition flex items-center gap-1 text-sm font-semibold">
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">My Courses</span>
          </Link>
          <div className="h-4 w-px bg-gray-300 hidden sm:block"></div>
          <h1 className="font-bold text-gray-900 text-sm sm:text-base truncate max-w-[200px] sm:max-w-md">{course.title}</h1>
        </div>
        <div className="flex items-center gap-4 text-sm font-semibold">
          <span className="hidden sm:inline text-gray-500">
            Progress:
          </span>
          <div className="flex items-center gap-2">
            <div className="w-16 sm:w-24 bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="bg-green-500 h-2 rounded-full animate-progress-fill transition-all" style={{ width: `${progressPercent}%` }}></div>
            </div>
            <span className="text-gray-900">{progressPercent}%</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-60px)] bg-gray-50">
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          
          {/* Sticky Video Player Container on Mobile */}
          {(() => {
            const cleanVideoId = extractYouTubeVideoId(activeVideoId);
            return (
              <div className="w-full bg-black aspect-video relative flex-shrink-0 sticky top-[53px] lg:static z-30 shadow-md">
                {cleanVideoId ? (
                  <iframe 
                    src={`https://www.youtube.com/embed/${cleanVideoId}?rel=0&modestbranding=1`}
                    title={activeLessonTitle}
                    className="absolute top-0 left-0 w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white flex-col gap-3">
                    <PlayCircle className="w-12 h-12 text-gray-500" />
                    <p>Video not available</p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Mobile Curriculum Toggle (< 1024px) */}
          <div className="lg:hidden bg-white border-b border-gray-200">
            <button
              onClick={() => setMobileCurriculumOpen(!mobileCurriculumOpen)}
              className="w-full px-4 py-3 flex items-center justify-between text-left font-bold text-xs sm:text-sm text-[#2B2521] hover:bg-gray-50 transition min-h-[44px] cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <PlayCircle className="w-4 h-4 text-[#B12B2B]" />
                <span>Lessons & Curriculum ({course.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0)} total)</span>
              </div>
              <span className="text-xs text-[#B12B2B] font-semibold">
                {mobileCurriculumOpen ? 'Hide Lessons ▲' : 'Browse Lessons ▼'}
              </span>
            </button>

            {/* Mobile Expandable Curriculum Drawer */}
            {mobileCurriculumOpen && (
              <div className="max-h-72 overflow-y-auto border-t border-gray-100 divide-y divide-gray-100 bg-[#FAF6F0]">
                {course.modules.map((m: any, mIndex: number) => (
                  <div key={m.id}>
                    <div className="px-4 py-2 bg-gray-100/70 font-bold text-xs text-gray-700">
                      Module {mIndex + 1}: {m.title}
                    </div>
                    {m.lessons.map((l: any) => {
                      const isCompleted = completedLessons[l.id];
                      const isActive = l.id === activeLessonId;
                      return (
                        <button
                          key={l.id}
                          onClick={() => {
                            setActiveLessonId(l.id);
                            setMobileCurriculumOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-xs transition min-h-[44px] ${
                            isActive ? 'bg-red-50 border-l-4 border-jadmaa-red font-bold text-jadmaa-red' : 'hover:bg-white text-gray-700'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                          ) : isActive ? (
                            <PlayCircle className="w-4 h-4 text-jadmaa-red shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-gray-300 shrink-0" />
                          )}
                          <span className="truncate flex-1">{l.title}</span>
                          <span className="text-[10px] text-gray-400 shrink-0">{l.duration}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lesson Details & Controls */}
          <div className="p-4 sm:p-6 bg-white border-b border-gray-200 flex-shrink-0">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-6">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-gray-500 mb-1">{activeModuleTitle}</p>
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900">{activeLessonTitle}</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Instructor: {course.instructor?.name || 'JADMAA Master'}</p>
              </div>
              
              <div className="flex items-center gap-3 self-stretch sm:self-center shrink-0">
                <button
                  onClick={() => toggleComplete(activeLessonId)}
                  disabled={isCurrentCompleting}
                  className={`w-full sm:w-auto px-5 py-2.5 min-h-[44px] rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs ${
                    isCurrentCompleted 
                      ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                      : 'bg-[#B12B2B] text-white hover:bg-[#8F2020]'
                  } ${isCurrentCompleting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isCurrentCompleting ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                  ) : (
                    <CheckCircle className={`w-4 h-4 ${isCurrentCompleted ? 'text-green-600' : ''}`} />
                  )}
                  {isCurrentCompleted ? 'Completed' : 'Mark as Complete'}
                </button>
              </div>
            </div>
          </div>
          
          {/* Bottom Navigation */}
          <div className="bg-gray-50 p-4 sm:p-6 flex-grow flex flex-col justify-end pb-8">
             <div className="max-w-4xl w-full mx-auto flex items-center justify-between gap-3 pt-4 border-t border-gray-200">
               <button 
                 onClick={goToPrevLesson}
                 disabled={!prevLessonId}
                 className={`flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                   prevLessonId ? 'text-gray-900 hover:bg-gray-200 cursor-pointer' : 'text-gray-300 cursor-not-allowed'
                 }`}
               >
                 <ArrowLeft className="w-4 h-4" /> <span>Previous</span>
               </button>
               
               {progressPercent === 100 ? (
                  <Link to="/certificates" className="px-5 py-2.5 min-h-[44px] bg-green-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow hover:bg-green-700 transition flex items-center gap-2">
                    <Award className="w-4 h-4" /> <span>View Certificate</span>
                  </Link>
               ) : (
                  <button 
                    onClick={() => {
                      if (!isCurrentCompleted) toggleComplete(activeLessonId, true);
                      goToNextLesson();
                    }}
                    disabled={!nextLessonId}
                    className={`flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition shadow-xs ${
                      nextLessonId ? 'bg-[#2B2521] text-white hover:bg-[#B12B2B] cursor-pointer' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <span>Next Lesson</span> <ArrowRight className="w-4 h-4" />
                  </button>
               )}
             </div>
          </div>

        </div>

        {/* Desktop Sidebar / Course Content (>= 1024px) */}
        <div className="hidden lg:flex w-[350px] xl:w-[400px] bg-white border-l border-gray-200 flex-col h-[calc(100vh-60px)] sticky top-[60px] overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-bold text-gray-900">Course Content</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {course.modules.map((m: any, mIndex: number) => (
              <div key={m.id} className="border-b border-gray-100 last:border-0">
                <div className="px-4 py-3 bg-gray-50/50">
                  <h4 className="text-sm font-bold text-gray-900">Module {mIndex + 1}: {m.title}</h4>
                </div>
                <div className="flex flex-col">
                  {m.lessons.map((l: any) => {
                    const isCompleted = completedLessons[l.id];
                    const isActive = l.id === activeLessonId;
                    return (
                      <button
                        key={l.id}
                        onClick={() => setActiveLessonId(l.id)}
                        className={`text-left px-4 py-3 flex gap-3 text-sm transition cursor-pointer ${
                          isActive ? 'bg-red-50 border-l-4 border-jadmaa-red' : 'hover:bg-gray-50 border-l-4 border-transparent'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {isCompleted ? (
                             <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : isActive ? (
                             <PlayCircle className="w-4 h-4 text-jadmaa-red" />
                          ) : (
                             <div className="w-4 h-4 rounded-full border border-gray-300"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`block truncate ${isActive ? 'font-bold text-jadmaa-red' : 'font-medium text-gray-700'}`}>
                            {l.title}
                          </span>
                          <span className="text-xs text-gray-400 mt-0.5 block">{l.duration}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
