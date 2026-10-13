import React, { useState, useEffect } from 'react';
import { X, Video, ExternalLink } from 'lucide-react';
import { instructorApi, type InstructorCoursePayload } from '../../lib/api/instructorApi';
import { ImageUpload } from '../../components/common/ImageUpload';

interface InstructorCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: any;
  onSuccess: () => void;
}

export const InstructorCourseModal: React.FC<InstructorCourseModalProps> = ({
  isOpen,
  onClose,
  course,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<InstructorCoursePayload>({
    title: '',
    subtitle: '',
    description: '',
    category: 'Varmakalai',
    level: 'Beginner',
    duration: '4 Weeks',
    price: 0,
    status: 'PUBLISHED',
    thumbnailUrl: '',
    youtubeUrl: '',
    certificateEnabled: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (course) {
        let existingYoutubeUrl = '';
        const videoId = course.modules?.[0]?.lessons?.[0]?.youtubeVideoId;
        if (videoId) {
          existingYoutubeUrl = videoId.startsWith('http')
            ? videoId
            : `https://www.youtube.com/watch?v=${videoId}`;
        }

        setFormData({
          title: course.title || '',
          subtitle: course.subtitle || '',
          description: course.description || '',
          category: course.category || 'Varmakalai',
          level: course.level || 'Beginner',
          duration: course.duration || '4 Weeks',
          price: course.price || 0,
          status: course.status === 'HOLD' ? 'PUBLISHED' : (course.status || 'PUBLISHED'),
          thumbnailUrl: course.thumbnailUrl || '',
          youtubeUrl: existingYoutubeUrl,
          certificateEnabled: course.certificateEnabled !== false,
        });
      } else {
        setFormData({
          title: '',
          subtitle: '',
          description: '',
          category: 'Varmakalai',
          level: 'Beginner',
          duration: '4 Weeks',
          price: 0,
          status: 'PUBLISHED',
          thumbnailUrl: '',
          youtubeUrl: '',
          certificateEnabled: true,
        });
      }
    }
  }, [isOpen, course]);

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
  const parsedVideoId = extractVideoId(formData.youtubeUrl || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: InstructorCoursePayload = {
        ...formData,
        price: Number(formData.price) || 0,
        isFree: Number(formData.price) === 0,
      };

      if (course) {
        await instructorApi.updateCourse(course.id, payload);
      } else {
        await instructorApi.createCourse(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save course. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-jadmaa-border">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-jadmaa-border sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold font-heading text-jadmaa-charcoal">
              {course ? 'Edit My Course' : 'Create New Course'}
            </h2>
            <p className="text-xs text-jadmaa-textMuted mt-0.5">
              Add your martial arts curriculum, video lessons, and pricing.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-jadmaa-cream rounded-full text-jadmaa-charcoal transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700">Course Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Fundamental Varma Pressure Points & Self-Defence"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-jadmaa-red"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700">Subtitle</label>
            <input
              type="text"
              placeholder="e.g. Step-by-step masterclass for martial artists"
              value={formData.subtitle || ''}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-jadmaa-red"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700">Course Description *</label>
            <textarea
              required
              rows={4}
              placeholder="Provide a comprehensive summary of what students will learn, techniques covered, and requirements..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-jadmaa-red"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700">Category</label>
              <select
                value={formData.category || 'Varmakalai'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-jadmaa-red bg-white"
              >
                <option value="Varmakalai">Varmakalai</option>
                <option value="Self-Defence">Self-Defence</option>
                <option value="Varma Therapy">Varma Therapy</option>
                <option value="Silambam">Silambam</option>
                <option value="Traditional Martial Arts">Traditional Martial Arts</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700">Level</label>
              <select
                value={formData.level || 'Beginner'}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-jadmaa-red bg-white"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="All Levels">All Levels</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700">Duration</label>
              <input
                type="text"
                placeholder="e.g. 4 Weeks or 12 Hours"
                value={formData.duration || ''}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-jadmaa-red"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700">Price (₹) *</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400 font-bold">₹</span>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="0 for free"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full pl-8 pr-4 py-2 border rounded-lg focus:outline-none focus:border-jadmaa-red font-medium"
                />
              </div>
              <p className="text-[11px] text-gray-500">Set to 0 if this course is completely free for students.</p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700">Publishing Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-jadmaa-red bg-white font-medium"
              >
                <option value="PUBLISHED">Published (Immediately available to students)</option>
                <option value="DRAFT">Draft (Saved privately, not visible to students)</option>
                <option value="ARCHIVED">Archived (Hidden from catalog)</option>
              </select>
            </div>
          </div>

          <ImageUpload
            label="Course Thumbnail"
            value={formData.thumbnailUrl || ''}
            onChange={(url) => setFormData({ ...formData, thumbnailUrl: url })}
            aspectRatio="video"
            helperText="Upload a high quality course banner or paste an image URL"
          />

          {/* YouTube Video Link Field */}
          <div className="space-y-2 p-4 bg-red-50/50 rounded-xl border border-red-100">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-gray-800 flex items-center space-x-1.5">
                <Video className="w-4 h-4 text-jadmaa-red" />
                <span>YouTube Lesson Link (Main Video)</span>
              </label>
              {parsedVideoId && (
                <a
                  href={`https://www.youtube.com/watch?v=${parsedVideoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-jadmaa-red hover:underline flex items-center space-x-1 font-semibold"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Preview Video</span>
                </a>
              )}
            </div>
            <input
              type="text"
              placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
              value={formData.youtubeUrl || ''}
              onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-jadmaa-red bg-white text-sm"
            />
            <p className="text-[11px] text-gray-500">
              Students who enroll in this course will watch this video lesson in the LMS player.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-jadmaa-border">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-lg bg-jadmaa-red hover:bg-[#8C1E1E] text-white text-sm font-bold shadow-sm transition flex items-center space-x-2"
            >
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              <span>{course ? 'Update Course' : 'Create Course'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
