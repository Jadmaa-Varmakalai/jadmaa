import React, { useState, useEffect } from 'react';
import { X, Video, PlayCircle, ExternalLink } from 'lucide-react';
import { adminApi } from '../../lib/api/adminApi';
import { ImageUpload } from '../../components/common/ImageUpload';

interface AdminCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: any;
  onSuccess: () => void;
}

export const AdminCourseModal: React.FC<AdminCourseModalProps> = ({ isOpen, onClose, course, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    category: 'Varmakalai',
    level: 'Beginner',
    price: 0,
    status: 'DRAFT',
    thumbnailUrl: '',
    youtubeUrl: '',
    instructorId: '', // We will fetch instructors and populate
    isAvailable: true,
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
          subtitle: course.subtitle || '',
          description: course.description || '',
          category: course.category || 'Varmakalai',
          level: course.level || 'Beginner',
          price: course.price || 0,
          status: course.status || 'DRAFT',
          thumbnailUrl: course.thumbnailUrl || '',
          youtubeUrl: existingYoutubeUrl,
          instructorId: course.instructorId || '',
          isAvailable: course.isAvailable !== false,
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
          subtitle: '',
          description: '',
          category: 'Varmakalai',
          level: 'Beginner',
          price: 0,
          status: 'DRAFT',
          thumbnailUrl: '',
          youtubeUrl: '',
          instructorId: '',
          isAvailable: true,
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
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700">Course Title *</label>
            <input 
              type="text" 
              required
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-jadmaa-red"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700">Subtitle</label>
            <input 
              type="text" 
              value={formData.subtitle}
              onChange={e => setFormData({...formData, subtitle: e.target.value})}
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

          {/* Availability toggle — blocks new enrollments/purchases while keeping the course visible */}
          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700">Enrollment Availability</label>
            <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
              <input
                type="checkbox"
                checked={formData.isAvailable !== false}
                onChange={e => setFormData({ ...formData, isAvailable: e.target.checked })}
                className="mt-0.5 w-4 h-4 accent-jadmaa-red cursor-pointer"
              />
              <span>
                <span className="block text-sm font-semibold text-gray-800">
                  Available for new enrollments
                </span>
                <span className="block text-[11px] text-gray-500">
                  When unchecked, students can still view the course but cannot register or purchase it. Existing students keep their access.
                </span>
              </span>
            </label>
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

          <ImageUpload 
            label="Course Thumbnail"
            value={formData.thumbnailUrl}
            onChange={(url) => setFormData({...formData, thumbnailUrl: url})}
            aspectRatio="video"
            helperText="Upload thumbnail from your device or paste an image URL"
          />

          {/* YouTube Video Link Field (Available in both Create & Edit mode) */}
          <div className="space-y-2 p-3.5 bg-red-50/50 rounded-xl border border-red-100">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-gray-800 flex items-center space-x-1.5">
                <Video className="w-4 h-4 text-jadmaa-red" />
                <span>YouTube Video Link (Course Video)</span>
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
              Students playing this course will watch lessons streamed from this YouTube link. You can update or change this link at any time.
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
              onClick={onClose}
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
    </div>
  );
};
