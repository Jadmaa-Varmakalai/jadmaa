import React, { useState, useEffect } from 'react';
import { SEO } from '../../components/common/SEO';
import {
  BookOpen,
  Plus,
  Users,
  Search,
  Edit,
  Trash2,
  ExternalLink,
  Video,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { instructorApi } from '../../lib/api/instructorApi';
import { InstructorCourseModal } from './InstructorCourseModal';

export const InstructorCoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseSearch, setCourseSearch] = useState('');
  const [selectedCourseForEdit, setSelectedCourseForEdit] = useState<any>(null);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await instructorApi.getCourses(courseSearch);
      if (res.success) {
        setCourses(res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch instructor courses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchCourses();
    }, 300);
    return () => clearTimeout(delay);
  }, [courseSearch]);

  const handleDeleteCourse = async (courseId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;
    try {
      await instructorApi.deleteCourse(courseId);
      fetchCourses();
    } catch (err: any) {
      alert(err.message || 'Failed to delete course');
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <SEO title="Instructor Courses | JADMAA" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#2B2521]">
            My Teaching Courses
          </h1>
          <p className="text-xs sm:text-sm text-[#5C5148] mt-0.5">
            Manage your course curriculums, pricing, and video lessons.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedCourseForEdit(null);
            setIsCourseModalOpen(true);
          }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#B12B2B] hover:bg-[#8F2020] text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition hover:scale-102 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add New Course</span>
        </button>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-[#E8DDD0] shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses by title..."
            className="w-full pl-10 pr-4 py-2 border border-[#E8DDD0] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#B12B2B] bg-[#FAF6F0]/40"
            value={courseSearch}
            onChange={(e) => setCourseSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-[#5C5148] font-semibold">
            {courses.length} course{courses.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={fetchCourses}
            className="p-2 border border-[#E8DDD0] rounded-xl hover:bg-[#FAF6F0] text-[#5C5148] transition"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Courses Grid / Empty State */}
      {loading && courses.length === 0 ? (
        <div className="py-20 text-center text-[#5C5148]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B12B2B] mx-auto mb-3" />
          <p className="text-xs font-semibold">Loading courses...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="p-10 sm:p-14 text-center bg-white rounded-2xl border border-dashed border-[#E8DDD0] space-y-4">
          <BookOpen className="w-12 h-12 text-[#B12B2B]/40 mx-auto" />
          <div>
            <h3 className="font-heading font-bold text-lg text-[#2B2521]">
              No Courses Created Yet
            </h3>
            <p className="text-xs text-[#5C5148] max-w-md mx-auto mt-1">
              Create and publish your curriculum, record lessons, and start teaching students online.
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedCourseForEdit(null);
              setIsCourseModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#B12B2B] text-white text-xs font-bold rounded-xl hover:bg-[#8F2020] transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Your First Course</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {courses.map((course) => {
            const lessonCount =
              course.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0;
            const enrolledCount = course._count?.enrollments || 0;

            return (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-[#E8DDD0] shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Thumbnail */}
                  <div className="relative aspect-video w-full bg-gray-100 overflow-hidden">
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#FAF6F0] text-[#B12B2B]">
                        <BookOpen className="w-10 h-10 opacity-40" />
                      </div>
                    )}

                    <div className="absolute top-2.5 right-2.5 flex items-center space-x-1.5">
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full shadow-xs ${
                          course.status === 'PUBLISHED'
                            ? 'bg-emerald-600 text-white'
                            : course.status === 'HOLD'
                            ? 'bg-amber-600 text-white'
                            : course.status === 'DRAFT'
                            ? 'bg-amber-500 text-white'
                            : 'bg-gray-500 text-white'
                        }`}
                      >
                        {course.status}
                      </span>
                    </div>

                    <div className="absolute bottom-2.5 left-2.5">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-black/70 text-white rounded-md backdrop-blur-xs">
                        {course.level || 'Beginner'}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 sm:p-5 space-y-2.5">
                    <div>
                      <span className="text-[10px] font-bold text-[#B12B2B] uppercase tracking-wider block">
                        {course.category || 'Varmakalai'}
                      </span>
                      <h3 className="font-heading font-bold text-base text-[#2B2521] line-clamp-2 mt-0.5">
                        {course.title}
                      </h3>
                    </div>

                    <p className="text-xs text-[#5C5148] line-clamp-2">
                      {course.subtitle || course.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs text-[#5C5148] pt-2 border-t border-gray-100">
                      <div className="flex items-center space-x-1.5">
                        <Video className="w-3.5 h-3.5 text-[#B12B2B]" />
                        <span>{lessonCount} Lessons</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Users className="w-3.5 h-3.5 text-[#B12B2B]" />
                        <span>{enrolledCount} Students</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-4 sm:px-5 py-3 bg-gray-50 border-t border-[#E8DDD0] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">Tuition</span>
                    <span className="font-bold text-sm text-[#2B2521]">
                      {course.isFree || course.price === 0 ? 'Free' : `₹${course.price}`}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <Link
                      to={`/courses/${course.slug}`}
                      target="_blank"
                      className="p-1.5 text-gray-500 hover:text-[#B12B2B] hover:bg-white rounded-lg transition"
                      title="Preview public page"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>

                    <button
                      onClick={() => {
                        setSelectedCourseForEdit(course);
                        setIsCourseModalOpen(true);
                      }}
                      className="p-1.5 text-gray-600 hover:text-[#B12B2B] hover:bg-white rounded-lg transition cursor-pointer"
                      title="Edit course"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteCourse(course.id, course.title)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-white rounded-lg transition cursor-pointer"
                      title="Delete course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Course Modal */}
      <InstructorCourseModal
        isOpen={isCourseModalOpen}
        onClose={() => {
          setIsCourseModalOpen(false);
          setSelectedCourseForEdit(null);
        }}
        course={selectedCourseForEdit}
        onSuccess={() => {
          fetchCourses();
        }}
      />
    </div>
  );
};

