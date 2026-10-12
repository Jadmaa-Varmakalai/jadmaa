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
    instructorId: '' // We will fetch instructors and populate
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
          instructorId: course.instructorId || ''
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
          instructorId: ''
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

          {!course && (
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700">YouTube URL (Optional Shortcut)</label>
              <input 
                type="url" 
                placeholder="https://youtube.com/watch?v=..."
                value={formData.youtubeUrl}
                onChange={e => setFormData({...formData, youtubeUrl: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-jadmaa-red"
              />
              <p className="text-xs text-gray-500">Adding this will automatically create a starting lesson with this video.</p>
            </div>
          )}

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
