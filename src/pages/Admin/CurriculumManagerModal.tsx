import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Edit2, Trash2, ChevronDown, ChevronUp, Video, 
  PlayCircle, ExternalLink, Clock, Eye, AlertCircle, Save, Check
} from 'lucide-react';
import { adminApi } from '../../lib/api/adminApi';
import { extractYouTubeVideoId } from '../../utils/youtube';

interface CurriculumManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle: string;
  onSuccess?: () => void;
}

interface LessonItem {
  id: string;
  moduleId: string;
  title: string;
  description?: string | null;
  youtubeVideoId?: string | null;
  durationSeconds: number;
  sortOrder: number;
  isPreview: boolean;
  isRequired?: boolean;
  isPublished?: boolean;
}

interface ModuleItem {
  id: string;
  courseId: string;
  title: string;
  description?: string | null;
  sortOrder: number;
  lessons: LessonItem[];
}

export const CurriculumManagerModal: React.FC<CurriculumManagerModalProps> = ({
  isOpen,
  onClose,
  courseId,
  courseTitle,
  onSuccess
}) => {
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Accordion open state for module dropdowns
  const [openModuleIds, setOpenModuleIds] = useState<Record<string, boolean>>({});

  // Module modal states
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<ModuleItem | null>(null);
  const [moduleFormTitle, setModuleFormTitle] = useState('');
  const [moduleFormDesc, setModuleFormDesc] = useState('');

  // Lesson modal states
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [targetModuleId, setTargetModuleId] = useState<string>('');
  const [editingLesson, setEditingLesson] = useState<LessonItem | null>(null);
  const [lessonFormTitle, setLessonFormTitle] = useState('');
  const [lessonFormDesc, setLessonFormDesc] = useState('');
  const [lessonFormVideoUrl, setLessonFormVideoUrl] = useState('');
  const [lessonFormDuration, setLessonFormDuration] = useState('10'); // in minutes
  const [lessonFormIsPreview, setLessonFormIsPreview] = useState(false);
  const [lessonFormChapters, setLessonFormChapters] = useState<Array<{ time: string; title: string }>>([]);

  const parsedCurrentVideoId = extractYouTubeVideoId(lessonFormVideoUrl) || '';

  const splitDescriptionAndChapters = (raw?: string | null) => {
    if (!raw) return { notes: '', chapters: [] as Array<{ time: string; title: string }> };
    const lines = raw.split('\n');
    const noteLines: string[] = [];
    const chapters: Array<{ time: string; title: string }> = [];
    const tsRegex = /^((?:\d{1,2}:)?\d{1,2}:\d{2})\s*[-–—|:]?\s*(.+)$/;

    for (const line of lines) {
      const trimmed = line.trim();
      if (/^chapters:?$/i.test(trimmed)) continue;
      const m = trimmed.match(tsRegex);
      if (m && m[1] && m[2]) {
        chapters.push({ time: m[1].trim(), title: m[2].trim() });
      } else {
        noteLines.push(line);
      }
    }
    return { notes: noteLines.join('\n').trim(), chapters };
  };

  const fetchCurriculum = async () => {
    if (!courseId) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await adminApi.getCourseById(courseId);
      if (res?.data?.modules) {
        setModules(res.data.modules);
        // Default open all modules
        const openMap: Record<string, boolean> = {};
        res.data.modules.forEach((m: ModuleItem) => {
          openMap[m.id] = true;
        });
        setOpenModuleIds(openMap);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load course curriculum');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && courseId) {
      fetchCurriculum();
    }
  }, [isOpen, courseId]);

  const toggleModuleOpen = (id: string) => {
    setOpenModuleIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // --- Module Handlers ---
  const handleOpenAddModule = () => {
    setEditingModule(null);
    setModuleFormTitle('');
    setModuleFormDesc('');
    setModuleModalOpen(true);
  };

  const handleOpenEditModule = (mod: ModuleItem) => {
    setEditingModule(mod);
    setModuleFormTitle(mod.title);
    setModuleFormDesc(mod.description || '');
    setModuleModalOpen(true);
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleFormTitle.trim()) return;

    setSaving(true);
    try {
      if (editingModule) {
        await adminApi.updateModule(editingModule.id, {
          title: moduleFormTitle.trim(),
          description: moduleFormDesc.trim() || undefined
        });
        setSuccessMessage('Syllabus module updated successfully');
      } else {
        await adminApi.createModule({
          courseId,
          title: moduleFormTitle.trim(),
          description: moduleFormDesc.trim() || undefined,
          sortOrder: modules.length + 1
        });
        setSuccessMessage('New syllabus module created');
      }
      setModuleModalOpen(false);
      await fetchCurriculum();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert(err.message || 'Failed to save module');
    } finally {
      setSaving(false);
      setTimeout(() => setSuccessMessage(null), 3500);
    }
  };

  const handleDeleteModule = async (moduleId: string, moduleTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete the syllabus module "${moduleTitle}" and all of its video lessons?`)) {
      return;
    }
    setSaving(true);
    try {
      await adminApi.deleteModule(moduleId);
      setSuccessMessage('Syllabus module deleted');
      await fetchCurriculum();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert(err.message || 'Failed to delete module');
    } finally {
      setSaving(false);
      setTimeout(() => setSuccessMessage(null), 3500);
    }
  };

  // --- Lesson Handlers ---
  const handleOpenAddLesson = (moduleId: string) => {
    setTargetModuleId(moduleId);
    setEditingLesson(null);
    setLessonFormTitle('');
    setLessonFormDesc('');
    setLessonFormVideoUrl('');
    setLessonFormDuration('10');
    setLessonFormIsPreview(false);
    setLessonFormChapters([]);
    setLessonModalOpen(true);
  };

  const handleOpenEditLesson = (lesson: LessonItem) => {
    setTargetModuleId(lesson.moduleId);
    setEditingLesson(lesson);
    setLessonFormTitle(lesson.title);
    const { notes, chapters } = splitDescriptionAndChapters(lesson.description);
    setLessonFormDesc(notes);
    setLessonFormChapters(chapters);
    const videoUrl = lesson.youtubeVideoId 
      ? (lesson.youtubeVideoId.startsWith('http') ? lesson.youtubeVideoId : `https://www.youtube.com/watch?v=${lesson.youtubeVideoId}`)
      : '';
    setLessonFormVideoUrl(videoUrl);
    setLessonFormDuration(Math.round(lesson.durationSeconds / 60).toString() || '10');
    setLessonFormIsPreview(Boolean(lesson.isPreview));
    setLessonModalOpen(true);
  };

  const handleAddChapterRow = () => {
    setLessonFormChapters(prev => [...prev, { time: '00:00', title: '' }]);
  };

  const handleUpdateChapterRow = (idx: number, field: 'time' | 'title', val: string) => {
    setLessonFormChapters(prev => prev.map((row, i) => (i === idx ? { ...row, [field]: val } : row)));
  };

  const handleMoveChapterRow = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= lessonFormChapters.length) return;
    setLessonFormChapters(prev => {
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[target];
      next[target] = temp;
      return next;
    });
  };

  const handleRemoveChapterRow = (idx: number) => {
    setLessonFormChapters(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonFormTitle.trim()) return;

    setSaving(true);
    try {
      const durMinutes = Number(lessonFormDuration) || 0;
      const totalSecs = Math.round(durMinutes * 60);

      const validChapters = lessonFormChapters
        .filter(c => c.time.trim() && c.title.trim())
        .map(c => `${c.time.trim()} - ${c.title.trim()}`);
      const notesPart = lessonFormDesc.trim();
      const combinedDesc = [
        notesPart,
        validChapters.length > 0 ? `Chapters:\n${validChapters.join('\n')}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      if (editingLesson) {
        await adminApi.updateLesson(editingLesson.id, {
          title: lessonFormTitle.trim(),
          description: combinedDesc || undefined,
          youtubeVideoId: lessonFormVideoUrl.trim() || undefined,
          durationSeconds: totalSecs,
          isPreview: lessonFormIsPreview
        });
        setSuccessMessage('Video lesson updated successfully');
      } else {
        const parentMod = modules.find(m => m.id === targetModuleId);
        const sortOrder = (parentMod?.lessons?.length || 0) + 1;

        await adminApi.createLesson({
          moduleId: targetModuleId,
          title: lessonFormTitle.trim(),
          description: combinedDesc || undefined,
          youtubeVideoId: lessonFormVideoUrl.trim() || undefined,
          durationSeconds: totalSecs,
          isPreview: lessonFormIsPreview,
          sortOrder
        });
        setSuccessMessage('New video lesson added to syllabus');
      }

      setLessonModalOpen(false);
      await fetchCurriculum();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert(err.message || 'Failed to save lesson');
    } finally {
      setSaving(false);
      setTimeout(() => setSuccessMessage(null), 3500);
    }
  };

  const handleDeleteLesson = async (lessonId: string, lessonTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete the video lesson "${lessonTitle}"?`)) {
      return;
    }
    setSaving(true);
    try {
      await adminApi.deleteLesson(lessonId);
      setSuccessMessage('Video lesson deleted');
      await fetchCurriculum();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert(err.message || 'Failed to delete lesson');
    } finally {
      setSaving(false);
      setTimeout(() => setSuccessMessage(null), 3500);
    }
  };

  // Calculate totals
  const totalLessonsCount = modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
  const totalDurationMinutes = Math.round(
    modules.reduce((acc, m) => acc + (m.lessons?.reduce((lAcc, l) => lAcc + (l.durationSeconds || 0), 0) || 0), 0) / 60
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Sticky Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-6 border-b border-gray-200 bg-[#FAF8F5] gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-jadmaa-red/10 text-jadmaa-red uppercase tracking-wider">
                Curriculum &amp; Video Lessons Manager
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs font-medium text-gray-600">
                {modules.length} {modules.length === 1 ? 'Module' : 'Modules'} • {totalLessonsCount} Lessons
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-gray-900 mt-1 line-clamp-1">
              {courseTitle}
            </h2>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <button
              onClick={handleOpenAddModule}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-white bg-jadmaa-red hover:bg-[#8C1E1E] rounded-xl shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Syllabus Module</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-full transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications */}
        {successMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between animate-in fade-in">
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:underline text-xs">Dismiss</button>
          </div>
        )}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-red-600 hover:underline text-xs">Dismiss</button>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 bg-gray-50/50">
          
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-white rounded-xl border border-gray-200 shadow-sm text-xs sm:text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-red-50 text-jadmaa-red flex items-center justify-center font-bold">
                {modules.length}
              </div>
              <div>
                <span className="block text-gray-400 text-[11px] uppercase font-bold">Syllabus Modules</span>
                <span className="font-semibold text-gray-800">Dropdown Sections</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                {totalLessonsCount}
              </div>
              <div>
                <span className="block text-gray-400 text-[11px] uppercase font-bold">Video Lessons</span>
                <span className="font-semibold text-gray-800">Sub-dropdown Items</span>
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1 flex items-center space-x-2 border-t sm:border-t-0 pt-2 sm:pt-0">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-gray-400 text-[11px] uppercase font-bold">Total Duration</span>
                <span className="font-semibold text-gray-800">{totalDurationMinutes} Minutes Approx.</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-200">
              <div className="inline-block w-6 h-6 border-2 border-jadmaa-red border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-sm font-medium">Loading syllabus curriculum...</p>
            </div>
          ) : modules.length === 0 ? (
            <div className="p-10 sm:p-14 text-center bg-white rounded-2xl border-2 border-dashed border-gray-300 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-red-50 text-jadmaa-red flex items-center justify-center shadow-inner">
                <Video className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="font-heading font-bold text-lg text-gray-900">
                  No Curriculum Modules Added Yet
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                  Start building this course's syllabus by creating your first Module dropdown (e.g. "Module 1: Foundations"). Inside each module, you can add sub-dropdown video lessons.
                </p>
              </div>
              <button
                onClick={handleOpenAddModule}
                className="inline-flex items-center space-x-2 px-5 py-2.5 text-sm font-bold text-white bg-jadmaa-red hover:bg-[#8C1E1E] rounded-xl shadow-md transition"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Syllabus Module</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {modules.map((mod, modIndex) => {
                const isOpen = !!openModuleIds[mod.id];
                const lessons = mod.lessons || [];

                return (
                  <div
                    key={mod.id}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-200"
                  >
                    {/* Module Header Bar (The Dropdown Toggle) */}
                    <div className="flex items-center justify-between p-3.5 sm:p-4 bg-gray-50/70 border-b border-gray-100 hover:bg-gray-100/60 transition-colors">
                      <div className="flex items-center space-x-3 flex-1 min-w-0 pr-2">
                        <button
                          type="button"
                          onClick={() => toggleModuleOpen(mod.id)}
                          className="flex items-center space-x-2 text-left flex-1 min-w-0 group"
                        >
                          <span className="w-7 h-7 rounded-lg bg-jadmaa-red text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                            {modIndex + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-heading font-bold text-sm sm:text-base text-gray-900 truncate group-hover:text-jadmaa-red transition-colors">
                                {mod.title}
                              </h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 text-gray-700 shrink-0">
                                {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}
                              </span>
                            </div>
                            {mod.description && (
                              <p className="text-xs text-gray-500 truncate mt-0.5">{mod.description}</p>
                            )}
                          </div>
                        </button>
                      </div>

                      {/* Module Controls */}
                      <div className="flex items-center space-x-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenAddLesson(mod.id)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
                          title="Add video lesson into this module"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Add Lesson</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModule(mod)}
                          className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit Module Title"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteModule(mod.id, mod.title)}
                          className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete Module & Lessons"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleModuleOpen(mod.id)}
                          className="p-1.5 text-gray-500 hover:bg-gray-200/60 rounded-lg transition"
                          title={isOpen ? 'Collapse Section' : 'Expand Section'}
                        >
                          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Module Content / Sub-dropdown Lessons List */}
                    {isOpen && (
                      <div className="p-3 sm:p-4 bg-white">
                        {lessons.length === 0 ? (
                          <div className="py-6 px-4 text-center rounded-xl bg-gray-50 border border-dashed border-gray-200 space-y-2">
                            <p className="text-xs text-gray-500">
                              No video lessons in this module yet.
                            </p>
                            <button
                              type="button"
                              onClick={() => handleOpenAddLesson(mod.id)}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-sm"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add First Video Lesson</span>
                            </button>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                            {lessons.map((lesson, lessonIdx) => {
                              const cleanVidId = lesson.youtubeVideoId ? extractVideoId(lesson.youtubeVideoId) : '';
                              const durationMins = Math.round(lesson.durationSeconds / 60);

                              return (
                                <div
                                  key={lesson.id}
                                  className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF8F5]/50 transition-colors"
                                >
                                  {/* Left Details */}
                                  <div className="flex items-start sm:items-center space-x-3 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 font-mono text-xs font-bold">
                                      {modIndex + 1}.{lessonIdx + 1}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        <h5 className="font-semibold text-xs sm:text-sm text-gray-900">
                                          {lesson.title}
                                        </h5>
                                        {lesson.isPreview ? (
                                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                            FREE PREVIEW
                                          </span>
                                        ) : (
                                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                            Enrolled Only
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
                                        {cleanVidId ? (
                                          <a
                                            href={`https://www.youtube.com/watch?v=${cleanVidId}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center space-x-1 text-jadmaa-red hover:underline font-mono text-[11px]"
                                          >
                                            <PlayCircle className="w-3.5 h-3.5 shrink-0" />
                                            <span>YouTube: <strong>{cleanVidId}</strong></span>
                                            <ExternalLink className="w-3 h-3 ml-0.5" />
                                          </a>
                                        ) : (
                                          <span className="text-amber-600 flex items-center space-x-1">
                                            <AlertCircle className="w-3 h-3" />
                                            <span>No video link added</span>
                                          </span>
                                        )}
                                        <span className="flex items-center space-x-1 font-mono">
                                          <Clock className="w-3 h-3 text-gray-400" />
                                          <span>{durationMins > 0 ? `${durationMins} mins` : `${lesson.durationSeconds}s`}</span>
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Right Controls */}
                                  <div className="flex items-center space-x-1.5 self-end sm:self-auto shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-gray-100 w-full sm:w-auto justify-end">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditLesson(lesson)}
                                      className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                                      title="Edit Lesson Video and Details"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                      <span>Edit</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                      title="Delete Lesson"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Sticky Footer */}
        <div className="p-4 sm:p-5 border-t border-gray-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-gray-500">
            Changes to modules and video lessons update the public course page immediately.
          </div>
          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <button
              onClick={onClose}
              className="px-5 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100 rounded-xl transition"
            >
              Done
            </button>
          </div>
        </div>

      </div>

      {/* --- Sub-Modal: Add / Edit Syllabus Module --- */}
      {moduleModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-heading font-bold text-lg text-gray-900">
                {editingModule ? 'Edit Syllabus Module' : 'Add New Syllabus Module (Dropdown)'}
              </h3>
              <button onClick={() => setModuleModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModule} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase">
                  Module Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Module 1: Foundations & Body Conditioning"
                  value={moduleFormTitle}
                  onChange={e => setModuleFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:border-jadmaa-red"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase">
                  Module Overview / Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Core principles, joint mobility, and introductory stances..."
                  value={moduleFormDesc}
                  onChange={e => setModuleFormDesc(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:border-jadmaa-red resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModuleModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-bold text-white bg-jadmaa-red hover:bg-[#8C1E1E] rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {saving ? 'Saving...' : (editingModule ? 'Update Module' : 'Create Module')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Sub-Modal: Add / Edit Video Lesson (Sub-dropdown) --- */}
      {lessonModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-heading font-bold text-lg text-gray-900">
                  {editingLesson ? 'Edit Video Lesson' : 'Add Video Lesson (Sub-dropdown)'}
                </h3>
                <p className="text-xs text-gray-500">
                  Add YouTube video streaming link and details for this syllabus topic
                </p>
              </div>
              <button onClick={() => setLessonModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLesson} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase">
                  Lesson Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lesson 1: Introduction to Varmam Stances"
                  value={lessonFormTitle}
                  onChange={e => setLessonFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:border-jadmaa-red"
                />
              </div>

              {/* YouTube Video URL */}
              <div className="space-y-1 p-3 bg-red-50/50 rounded-xl border border-red-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 uppercase flex items-center space-x-1">
                    <Video className="w-3.5 h-3.5 text-jadmaa-red" />
                    <span>YouTube Video Link or ID *</span>
                  </label>
                  {parsedCurrentVideoId && (
                    <a
                      href={`https://www.youtube.com/watch?v=${parsedCurrentVideoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-jadmaa-red hover:underline flex items-center space-x-1 font-semibold"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Test Video Link</span>
                    </a>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  value={lessonFormVideoUrl}
                  onChange={e => setLessonFormVideoUrl(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-jadmaa-red bg-white font-mono"
                />
                {parsedCurrentVideoId && (
                  <p className="text-[11px] text-emerald-700 flex items-center space-x-1 pt-0.5">
                    <Check className="w-3 h-3 shrink-0" />
                    <span>Detected YouTube Video ID: <strong>{parsedCurrentVideoId}</strong></span>
                  </p>
                )}
              </div>

              {/* Duration & Free Preview Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="15"
                    value={lessonFormDuration}
                    onChange={e => setLessonFormDuration(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:border-jadmaa-red"
                  />
                </div>

                <div className="space-y-1 flex flex-col justify-end">
                  <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition">
                    <input
                      type="checkbox"
                      checked={lessonFormIsPreview}
                      onChange={e => setLessonFormIsPreview(e.target.checked)}
                      className="w-4 h-4 text-jadmaa-red rounded focus:ring-jadmaa-red"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-gray-800 block">Free Starter Preview</span>
                      <span className="text-[10px] text-gray-500">Allow preview before purchase</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase">
                  Lesson Notes / Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Key pointers, practice repetitions, or safety precautions..."
                  value={lessonFormDesc}
                  onChange={e => setLessonFormDesc(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:border-jadmaa-red resize-none"
                />
              </div>

              {/* Chapters / Timestamps Manager */}
              <div className="space-y-2 p-3 bg-[#FAF8F5] rounded-xl border border-gray-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 uppercase flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-jadmaa-red" />
                    <span>Lesson Chapters &amp; Timestamps</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddChapterRow}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-bold text-jadmaa-red bg-red-50 hover:bg-red-100 rounded-lg transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Timestamp</span>
                  </button>
                </div>

                {lessonFormChapters.length === 0 ? (
                  <p className="text-[11px] text-gray-500">
                    No chapters added yet. Add <code className="font-mono">MM:SS</code> timestamps so students can jump to specific sections in the player.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {lessonFormChapters.map((ch, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder="00:00"
                          value={ch.time}
                          onChange={e => handleUpdateChapterRow(idx, 'time', e.target.value)}
                          className="w-20 px-2 py-1.5 text-xs font-mono border border-gray-300 rounded-lg focus:outline-none focus:border-jadmaa-red bg-white"
                        />
                        <input
                          type="text"
                          placeholder="Chapter Title (e.g. Varmam Point Location)"
                          value={ch.title}
                          onChange={e => handleUpdateChapterRow(idx, 'title', e.target.value)}
                          className="flex-1 px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-jadmaa-red bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleMoveChapterRow(idx, -1)}
                          disabled={idx === 0}
                          title="Move up"
                          className="p-1 text-gray-500 hover:text-gray-800 disabled:opacity-30 cursor-pointer"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveChapterRow(idx, 1)}
                          disabled={idx === lessonFormChapters.length - 1}
                          title="Move down"
                          className="p-1 text-gray-500 hover:text-gray-800 disabled:opacity-30 cursor-pointer"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveChapterRow(idx)}
                          title="Remove chapter"
                          className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setLessonModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-bold text-white bg-jadmaa-red hover:bg-[#8C1E1E] rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {saving ? 'Saving...' : (editingLesson ? 'Update Video Lesson' : 'Add Video Lesson')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
