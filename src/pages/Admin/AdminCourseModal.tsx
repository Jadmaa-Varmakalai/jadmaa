import React, { useState, useEffect } from 'react';
import { X, Video, PlayCircle, ExternalLink, BookOpen } from 'lucide-react';
import { adminApi } from '../../lib/api/adminApi';
import { ImageUpload } from '../../components/common/ImageUpload';
import { useModalHistory } from '../../hooks/useModalHistory';
import { CurriculumManagerModal } from './CurriculumManagerModal';

interface AdminCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: any;
  onSuccess: () => void;
}

export const AdminCourseModal: React.FC<AdminCourseModalProps> = ({ isOpen, onClose, course, onSuccess }) => {
  const { closeWithHistory } = useModalHistory(isOpen, onClose, 'admin-course-modal');
  const [curriculumModalOpen, setCurriculumModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    metaTitle: '',
    metaDesc: '',
    keywords: '',
    subtitle: '',
    description: '',
    category: 'Varmakalai',
    level: 'Beginner',
    price: 0,
    status: 'DRAFT',
    thumbnailUrl: '',
    youtubeUrl: '',
    instructorId: '', // We will fetch instructors and populate
  });

  const [instructors, setInstructors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchInstructors();
      if (course) {
        let existingYoutubeUrl = '';
        const videoId = course.modules?.[0]?.lessons?.[0]?.youtubeVideoId;
        if (videoId) {
          existingYoutubeUrl = videoId.startsWith('http') ? videoId : `https://www.youtube.com/watch?v=${videoId}`;
        }

        setFormData({
          title: course.title || '',
          slug: course.slug || '',
          metaTitle: (course as any).metaTitle || '',
          metaDesc: (course as any).metaDesc || '',
          keywords: (course as any).keywords || '',
          subtitle: course.subtitle || '',
          description: course.description || '',
          category: course.category || 'Varmakalai',
          level: course.level || 'Beginner',
          price: course.price || 0,
          status: course.status === 'HOLD' ? 'PUBLISHED' : (course.status || 'DRAFT'),
          thumbnailUrl: course.thumbnailUrl || '',
          youtubeUrl: existingYoutubeUrl,
          instructorId: course.instructorId || '',
        });

        // If modules weren't in course prop, fetch complete course details
        if (!videoId && course.id) {
          adminApi.getCourseById(course.id).then(res => {
            if (res.data) {
              const fullVideoId = res.data.modules?.[0]?.lessons?.[0]?.youtubeVideoId;
              if (fullVideoId) {
                const fullUrl = fullVideoId.startsWith('http') ? fullVideoId : `https://www.youtube.com/watch?v=${fullVideoId}`;
                setFormData(prev => ({ ...prev, youtubeUrl: fullUrl }));
              }
            }
          }).catch(console.error);
        }
      } else {
        setFormData({
          title: '',
          slug: '',
          metaTitle: '',
          metaDesc: '',
          keywords: '',
          subtitle: '',
          description: '',
          category: 'Varmakalai',
          level: 'Beginner',
          price: 0,
          status: 'DRAFT',
          thumbnailUrl: '',
          youtubeUrl: '',
          instructorId: '',
        });
      }
    }
  }, [isOpen, course]);

  const fetchInstructors = async () => {
    try {
      const res = await adminApi.getInstructors({ limit: 100 });
      setInstructors(res.data.items);
      if (!course && res.data.items.length > 0) {
        setFormData(prev => ({ ...prev, instructorId: res.data.items[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        price: Number(formData.price)
      };

      if (course) {
        await adminApi.updateCourse(course.id, payload);
      } else {
        await adminApi.createCourse(payload);
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.error?.message || "Failed to save course");
    } finally {
      setLoading(false);
    }
  };

  const extractVideoId = (url: string) => {
    if (!url) return '';
    const trimmed = url.trim();
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
    return fallback && fallback[1] ? fallback[1] : '';
  };
  const parsedVideoId = extractVideoId(formData.youtubeUrl);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-bold font-heading">{course ? 'Edit Course' : 'Create New Course'}</h2>
          <button onClick={closeWithHistory} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-gray-700">Course Title *</label>
              <span className="text-xs font-semibold text-gray-500">
                {formData.title?.length || 0} of 80 chars
              </span>
            </div>
            <input 
              type="text" 
              required
              maxLength={80}
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value.slice(0, 80)})}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-jadmaa-red"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-gray-700">Subtitle</label>
              <span className="text-xs font-semibold text-gray-500">
                {formData.subtitle?.length || 0} of 120 chars
              </span>
            </div>
            <input 
              type="text" 
              maxLength={120}
              value={formData.subtitle}
              onChange={e => setFormData({...formData, subtitle: e.target.value.slice(0, 120)})}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-jadmaa-red"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700">Description *</label>
            <textarea 
              required
              rows={4}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-jadmaa-red resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700">Category</label>
              <input 
                type="text" 
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-jadmaa-red"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700">Level</label>
              <select 
                value={formData.level}
                onChange={e => setFormData({...formData, level: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-jadmaa-red"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="All Levels">All Levels</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700">Price (₹) *</label>
              <input 
                type="number" 
                required
                min="0"
                value={formData.price}
                onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-jadmaa-red"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700">Status</label>
              <select 
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-jadmaa-red"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700">Instructor *</label>
            <select 
              required
              value={formData.instructorId}
              onChange={e => setFormData({...formData, instructorId: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-jadmaa-red"
            >
              <option value="">Select Instructor</option>
              {instructors.map(inst => (
                <option key={inst.id} value={inst.id}>{inst.displayName}</option>
              ))}
            </select>
          </div>

          {/* SEO & URL Settings */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-700">SEO &amp; Canonical URL (Optional)</h4>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">Custom URL Slug</label>
              <input 
                type="text" 
                placeholder="e.g. varmakalai-foundation-course"
                value={formData.slug}
                onChange={e => setFormData({...formData, slug: e.target.value})}
                className="w-full px-3 py-1.5 border rounded-lg focus:outline-none focus:border-jadmaa-red bg-white text-xs font-mono"
              />
              <p className="text-[11px] text-gray-400">Leave blank to automatically generate from title with high-intent keywords.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-600">Search Meta Title</label>
                  <span className="text-[10px] font-semibold text-gray-500">
                    {formData.metaTitle?.length || 0} of 60 chars
                  </span>
                </div>
                <input 
                  type="text" 
                  maxLength={60}
                  placeholder="Appears in Google search results"
                  value={formData.metaTitle}
                  onChange={e => setFormData({...formData, metaTitle: e.target.value.slice(0, 60)})}
                  className="w-full px-3 py-1.5 border rounded-lg focus:outline-none focus:border-jadmaa-red bg-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">Search Keywords</label>
                <input 
                  type="text" 
                  placeholder="varmakalai course, learn varma, martial arts"
                  value={formData.keywords}
                  onChange={e => setFormData({...formData, keywords: e.target.value})}
                  className="w-full px-3 py-1.5 border rounded-lg focus:outline-none focus:border-jadmaa-red bg-white text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-600">Meta Description</label>
                <span className="text-[10px] font-semibold text-gray-500">
                  {formData.metaDesc?.length || 0} of 160 chars
                </span>
              </div>
              <textarea 
                rows={2}
                maxLength={160}
                placeholder="150-160 characters search preview snippet..."
                value={formData.metaDesc}
                onChange={e => setFormData({...formData, metaDesc: e.target.value.slice(0, 160)})}
                className="w-full px-3 py-1.5 border rounded-lg focus:outline-none focus:border-jadmaa-red bg-white text-xs"
              />
            </div>
          </div>

          <ImageUpload 
            label="Course Thumbnail"
            value={formData.thumbnailUrl}
            onChange={(url) => setFormData({...formData, thumbnailUrl: url})}
            aspectRatio="video"
            helperText="Upload thumbnail from your device or drag & drop for PC"
          />

          {/* Curriculum & Video Lessons (Modules & Sub-dropdowns) Section */}
          <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-emerald-700" />
                <div>
                  <h4 className="text-sm font-bold text-gray-900">
                    Syllabus Curriculum &amp; Video Lessons
                  </h4>
                  <p className="text-xs text-gray-500">
                    Create dropdown syllabus modules and sub-dropdown video lessons
                  </p>
                </div>
              </div>
              {course?.id ? (
                <button
                  type="button"
                  onClick={() => setCurriculumModalOpen(true)}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition inline-flex items-center space-x-1"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Open Curriculum Manager</span>
                </button>
              ) : (
                <span className="text-[11px] font-semibold text-gray-400 italic">
                  Save course to manage curriculum
                </span>
              )}
            </div>

            {course?.modules && course.modules.length > 0 ? (
              <div className="text-xs text-emerald-900 bg-white/80 p-2.5 rounded-lg border border-emerald-100 flex items-center justify-between">
                <span>
                  Currently configured: <strong>{course.modules.length}</strong> modules,{' '}
                  <strong>{course.modules.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0)}</strong> video lessons
                </span>
                <button
                  type="button"
                  onClick={() => setCurriculumModalOpen(true)}
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  Edit Syllabus →
                </button>
              </div>
            ) : null}
          </div>

          {/* Quick Primary Video Link Field (Available in both Create & Edit mode) */}
          <div className="space-y-2 p-3.5 bg-red-50/50 rounded-xl border border-red-100">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-gray-800 flex items-center space-x-1.5">
                <Video className="w-4 h-4 text-jadmaa-red" />
                <span>Primary / Starter Video Link</span>
              </label>
              {parsedVideoId && (
                <a
                  href={`https://www.youtube.com/watch?v=${parsedVideoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-jadmaa-red hover:underline flex items-center space-x-1 font-semibold"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Test Video Link</span>
                </a>
              )}
            </div>
            <input 
              type="text" 
              placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
              value={formData.youtubeUrl}
              onChange={e => setFormData({...formData, youtubeUrl: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-jadmaa-red bg-white text-sm"
            />
            <p className="text-xs text-gray-500">
              For single-video courses or quick default streaming link. For multi-lesson courses with chapters, use the Curriculum Manager above.
            </p>
            {parsedVideoId && (
              <div className="flex items-center space-x-2 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                <PlayCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Detected YouTube Video ID: <strong>{parsedVideoId}</strong></span>
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button 
              type="button" 
              onClick={closeWithHistory}
              className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-4 py-2 text-sm font-bold text-white bg-jadmaa-red hover:bg-[#8C1E1E] rounded-lg disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Course'}
            </button>
          </div>
        </form>
      </div>

      {course?.id && (
        <CurriculumManagerModal
          isOpen={curriculumModalOpen}
          onClose={() => setCurriculumModalOpen(false)}
          courseId={course.id}
          courseTitle={course.title}
          onSuccess={() => {
            onSuccess();
          }}
        />
      )}
    </div>
  );
};
