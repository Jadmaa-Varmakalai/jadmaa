import React, { useState, useEffect } from 'react';
import { SEO } from '../../components/common/SEO';
import {
  BookOpen,
  Plus,
  Users,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  Sparkles,
  X,
  ExternalLink,
  GraduationCap,
  Video,
  Eye,
  RefreshCw
} from 'lucide-react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { instructorApi } from '../../lib/api/instructorApi';
import { InstructorCourseModal } from './InstructorCourseModal';
import { StudentDetailsModal } from './StudentDetailsModal';

type Tab = 'courses' | 'students';

export const InstructorPanel: React.FC = () => {
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('courses');
  const [showApprovalNotice, setShowApprovalNotice] = useState<boolean>(false);

  // Dashboard Stats
  const [stats, setStats] = useState<any>(null);

  // Courses state
  const [courses, setCourses] = useState<any[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [courseSearch, setCourseSearch] = useState('');
  const [selectedCourseForEdit, setSelectedCourseForEdit] = useState<any>(null);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);

  // Students state
  const [studentsData, setStudentsData] = useState<{ courses: any[]; enrollments: any[] }>({
    courses: [],
    enrollments: []
  });
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('');
  const [selectedEnrollmentForModal, setSelectedEnrollmentForModal] = useState<any>(null);

  useEffect(() => {
    if (sessionStorage.getItem('jadmaa_instructor_approved_notice') === 'true') {
      setShowApprovalNotice(true);
    }
  }, []);

  const handleDismissNotice = () => {
    setShowApprovalNotice(false);
    sessionStorage.removeItem('jadmaa_instructor_approved_notice');
  };

  const fetchDashboardStats = async () => {
    try {
      const res = await instructorApi.getDashboard();
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load instructor stats', err);
    }
  };

  const fetchCourses = async () => {
    try {
      setCoursesLoading(true);
      const res = await instructorApi.getCourses(courseSearch);
      if (res.success) {
        setCourses(res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch instructor courses', err);
    } finally {
      setCoursesLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setStudentsLoading(true);
      const res = await instructorApi.getStudents(selectedCourseFilter, studentSearch);
      if (res.success) {
        setStudentsData(res.data || { courses: [], enrollments: [] });
      }
    } catch (err) {
      console.error('Failed to fetch instructor students', err);
    } finally {
      setStudentsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && (user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN')) {
      fetchDashboardStats();
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    if (activeTab === 'courses') {
      const delay = setTimeout(() => {
        fetchCourses();
      }, 300);
      return () => clearTimeout(delay);
    } else if (activeTab === 'students') {
      const delay = setTimeout(() => {
        fetchStudents();
      }, 300);
      return () => clearTimeout(delay);
    }
  }, [activeTab, courseSearch, studentSearch, selectedCourseFilter]);

  const handleDeleteCourse = async (courseId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;
    try {
      await instructorApi.deleteCourse(courseId);
      fetchCourses();
      fetchDashboardStats();
    } catch (err: any) {
      alert(err.message || 'Failed to delete course');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-jadmaa-cream flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 bg-jadmaa-red rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || (user?.role !== 'INSTRUCTOR' && user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN')) {
    return <Navigate to="/login" />;
  }

  return (
    <>
      <SEO title="Instructor Portal | JADMAA LMS" />

      {/* One-time celebratory approval notification */}
      {showApprovalNotice && (
        <aside
          aria-label="Instructor Approval Notification"
          className="bg-emerald-600 text-white px-4 py-4 border-b border-emerald-700 shadow-sm animate-fadeIn"
        >
          <div className="max-w-7xl mx-auto flex items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-500/80 rounded-xl shrink-0">
                <Sparkles className="w-5 h-5 text-amber-200" />
              </div>
              <div className="text-left text-xs sm:text-sm">
                <p className="font-bold text-white flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>Instructor Application Approved!</span>
                </p>
                <p className="text-emerald-100 text-xs mt-0.5">
                  Congratulations <strong>{user?.name}</strong>! Your application to become an
                  Instructor has been approved by the Admin. You can now publish your own courses and
                  manage enrolled students.
                </p>
              </div>
            </div>
            <button
              onClick={handleDismissNotice}
              className="p-1.5 bg-emerald-700/60 hover:bg-emerald-700 text-emerald-100 hover:text-white rounded-lg transition-colors shrink-0"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {/* Header section */}
      <section className="bg-jadmaa-cream py-8 sm:py-10 border-b border-jadmaa-border text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <span className="text-xs font-bold text-jadmaa-red uppercase tracking-wider">
                Instructor Portal
              </span>
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-jadmaa-charcoal mt-1">
                Instructor Dashboard ({user?.name || 'Instructor'})
              </h1>
              <p className="text-xs text-jadmaa-textMuted mt-1">
                Create & publish your own martial arts courses, manage enrollments, and track student completion.
              </p>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <button
                onClick={() => {
                  setSelectedCourseForEdit(null);
                  setIsCourseModalOpen(true);
                }}
                className="inline-flex items-center space-x-2 bg-jadmaa-red hover:bg-[#8C1E1E] text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all duration-200 hover:scale-[1.02] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Course</span>
              </button>
            </div>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="bg-white p-4 rounded-xl border border-jadmaa-border space-y-1 shadow-2xs">
              <div className="flex items-center space-x-2 text-jadmaa-red">
                <BookOpen className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider text-jadmaa-textMuted">
                  My Courses
                </span>
              </div>
              <p className="text-2xl font-black text-jadmaa-charcoal">
                {stats?.coursesCount ?? courses.length}
              </p>
              <p className="text-[11px] text-gray-500">
                {stats?.publishedCoursesCount ?? 0} Published • {stats?.draftCoursesCount ?? 0} Draft
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-jadmaa-border space-y-1 shadow-2xs">
              <div className="flex items-center space-x-2 text-jadmaa-red">
                <Users className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider text-jadmaa-textMuted">
                  Total Students
                </span>
              </div>
              <p className="text-2xl font-black text-jadmaa-charcoal">
                {stats?.totalStudents ?? 0}
              </p>
              <p className="text-[11px] text-gray-500">Enrolled across your courses</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-jadmaa-border space-y-1 shadow-2xs">
              <div className="flex items-center space-x-2 text-jadmaa-red">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider text-jadmaa-textMuted">
                  Active Enrollments
                </span>
              </div>
              <p className="text-2xl font-black text-jadmaa-charcoal">
                {stats?.activeEnrollments ?? 0}
              </p>
              <p className="text-[11px] text-gray-500">Currently studying</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-jadmaa-border space-y-1 shadow-2xs">
              <div className="flex items-center space-x-2 text-jadmaa-red">
                <GraduationCap className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider text-jadmaa-textMuted">
                  Instructor Status
                </span>
              </div>
              <p className="text-base font-bold text-emerald-600 mt-1">
                Active Instructor
              </p>
              <p className="text-[11px] text-gray-500">Direct publishing enabled</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs & Main content */}
      <section className="py-8 bg-white border-b border-jadmaa-border min-h-[600px] text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Tabs bar */}
          <div className="flex items-center border-b border-jadmaa-border">
            <button
              onClick={() => setActiveTab('courses')}
              className={`flex items-center space-x-2 px-6 py-3 font-heading font-bold text-sm border-b-2 transition-colors cursor-pointer ${
                activeTab === 'courses'
                  ? 'border-jadmaa-red text-jadmaa-red'
                  : 'border-transparent text-jadmaa-textMuted hover:text-jadmaa-charcoal'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>My Courses ({courses.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('students')}
              className={`flex items-center space-x-2 px-6 py-3 font-heading font-bold text-sm border-b-2 transition-colors cursor-pointer ${
                activeTab === 'students'
                  ? 'border-jadmaa-red text-jadmaa-red'
                  : 'border-transparent text-jadmaa-textMuted hover:text-jadmaa-charcoal'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Enrolled Students</span>
            </button>
          </div>

          {/* TAB 1: COURSES MANAGEMENT */}
          {activeTab === 'courses' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search my courses..."
                    className="pl-9 pr-4 py-2 border rounded-xl text-sm focus:outline-none focus:border-jadmaa-red w-full"
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={fetchCourses}
                    className="p-2 border rounded-xl hover:bg-jadmaa-cream text-gray-600 transition"
                    title="Refresh courses"
                  >
                    <RefreshCw className={`w-4 h-4 ${coursesLoading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCourseForEdit(null);
                      setIsCourseModalOpen(true);
                    }}
                    className="flex items-center space-x-2 bg-jadmaa-red hover:bg-[#8C1E1E] text-white px-4 py-2 rounded-xl font-bold text-sm transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Course</span>
                  </button>
                </div>
              </div>

              {coursesLoading && courses.length === 0 ? (
                <div className="py-16 text-center text-jadmaa-textMuted">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-jadmaa-red mx-auto mb-3"></div>
                  <p className="text-sm">Loading your courses...</p>
                </div>
              ) : courses.length === 0 ? (
                <div className="p-12 text-center bg-jadmaa-cream/60 rounded-2xl border border-dashed border-jadmaa-border space-y-4">
                  <BookOpen className="w-12 h-12 text-jadmaa-red/40 mx-auto" />
                  <div>
                    <h3 className="font-heading font-bold text-lg text-jadmaa-charcoal">
                      No Courses Created Yet
                    </h3>
                    <p className="text-xs text-jadmaa-textMuted max-w-md mx-auto mt-1">
                      As an instructor, you can build your personal curriculum, upload video lessons, set
                      course pricing, and teach students online.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCourseForEdit(null);
                      setIsCourseModalOpen(true);
                    }}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 bg-jadmaa-red text-white text-xs font-bold rounded-xl hover:bg-[#8C1E1E] transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Your First Course</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => {
                    const lessonCount =
                      course.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0;
                    const enrolledCount = course._count?.enrollments || 0;

                    return (
                      <div
                        key={course.id}
                        className="bg-white rounded-2xl border border-jadmaa-border shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
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
                              <div className="w-full h-full flex items-center justify-center bg-jadmaa-cream text-jadmaa-red">
                                <BookOpen className="w-10 h-10 opacity-40" />
                              </div>
                            )}

                            <div className="absolute top-3 right-3 flex items-center space-x-1.5">
                              <span
                                className={`px-2.5 py-1 text-[11px] font-bold rounded-full shadow-xs ${
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

                            <div className="absolute bottom-3 left-3">
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-black/60 text-white rounded-md backdrop-blur-xs">
                                {course.level || 'Beginner'}
                              </span>
                            </div>
                          </div>

                          {/* Body */}
                          <div className="p-5 space-y-3">
                            <div>
                              <span className="text-[11px] font-bold text-jadmaa-red uppercase tracking-wider block">
                                {course.category || 'Varmakalai'}
                              </span>
                              <h3 className="font-heading font-bold text-base text-jadmaa-charcoal line-clamp-2 mt-0.5">
                                {course.title}
                              </h3>
                            </div>

                            <p className="text-xs text-jadmaa-textMuted line-clamp-2">
                              {course.subtitle || course.description}
                            </p>

                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 pt-2 border-t border-gray-100">
                              <div className="flex items-center space-x-1.5">
                                <Video className="w-3.5 h-3.5 text-jadmaa-red" />
                                <span>{lessonCount} Lessons</span>
                              </div>
                              <div className="flex items-center space-x-1.5">
                                <Users className="w-3.5 h-3.5 text-jadmaa-red" />
                                <span>{enrolledCount} Students</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-3.5 bg-gray-50 border-t border-jadmaa-border flex items-center justify-between">
                          <div>
                            <span className="text-xs text-gray-500 block">Tuition</span>
                            <span className="font-bold text-sm text-jadmaa-charcoal">
                              {course.isFree || course.price === 0 ? 'Free' : `₹${course.price}`}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Link
                              to={`/courses/${course.slug}`}
                              target="_blank"
                              className="p-1.5 text-gray-500 hover:text-jadmaa-red hover:bg-white rounded-lg transition"
                              title="Preview public page"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>

                            <button
                              onClick={() => {
                                setSelectedCourseForEdit(course);
                                setIsCourseModalOpen(true);
                              }}
                              className="p-1.5 text-gray-600 hover:text-jadmaa-red hover:bg-white rounded-lg transition"
                              title="Edit course"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteCourse(course.id, course.title)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-white rounded-lg transition"
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
            </div>
          )}

          {/* TAB 2: ENROLLED STUDENTS MANAGEMENT */}
          {activeTab === 'students' && (
            <div className="space-y-6">
              {/* Filter and search bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search student by name, email..."
                      className="pl-9 pr-4 py-2 border rounded-xl text-sm focus:outline-none focus:border-jadmaa-red w-full"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                    />
                  </div>

                  <select
                    value={selectedCourseFilter}
                    onChange={(e) => setSelectedCourseFilter(e.target.value)}
                    className="px-4 py-2 border rounded-xl text-sm focus:outline-none focus:border-jadmaa-red bg-white"
                  >
                    <option value="">All My Courses</option>
                    {studentsData.courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 font-medium">
                    Total Enrolled: {studentsData.enrollments.length}
                  </span>
                  <button
                    onClick={fetchStudents}
                    className="p-2 border rounded-xl hover:bg-jadmaa-cream text-gray-600 transition"
                    title="Refresh list"
                  >
                    <RefreshCw className={`w-4 h-4 ${studentsLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {studentsLoading && studentsData.enrollments.length === 0 ? (
                <div className="py-16 text-center text-jadmaa-textMuted">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-jadmaa-red mx-auto mb-3"></div>
                  <p className="text-sm">Loading enrolled students...</p>
                </div>
              ) : studentsData.enrollments.length === 0 ? (
                <div className="p-12 text-center bg-jadmaa-cream/60 rounded-2xl border border-dashed border-jadmaa-border space-y-3">
                  <Users className="w-12 h-12 text-jadmaa-red/40 mx-auto" />
                  <h3 className="font-heading font-bold text-lg text-jadmaa-charcoal">
                    No Enrolled Students Found
                  </h3>
                  <p className="text-xs text-jadmaa-textMuted max-w-md mx-auto">
                    {selectedCourseFilter
                      ? 'No students have enrolled in this specific course yet.'
                      : 'Students who purchase or enroll in your courses will be listed here with their progress and contact details.'}
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-jadmaa-border rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-jadmaa-cream border-b border-jadmaa-border">
                        <tr>
                          <th className="px-6 py-4 font-bold text-gray-700">Student Name</th>
                          <th className="px-6 py-4 font-bold text-gray-700">Course</th>
                          <th className="px-6 py-4 font-bold text-gray-700">Enrollment Date</th>
                          <th className="px-6 py-4 font-bold text-gray-700">Progress</th>
                          <th className="px-6 py-4 font-bold text-gray-700">Status</th>
                          <th className="px-6 py-4 font-bold text-gray-700 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {studentsData.enrollments.map((enr) => (
                          <tr key={enr.id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                {enr.user?.avatarUrl ? (
                                  <img
                                    src={enr.user.avatarUrl}
                                    alt={enr.user.name}
                                    className="w-9 h-9 rounded-full object-cover border"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-jadmaa-red/10 text-jadmaa-red flex items-center justify-center font-bold text-xs">
                                    {enr.user?.name?.charAt(0) || 'S'}
                                  </div>
                                )}
                                <div>
                                  <p
                                    onClick={() => setSelectedEnrollmentForModal(enr)}
                                    className="font-bold text-jadmaa-charcoal hover:text-jadmaa-red cursor-pointer"
                                  >
                                    {enr.user?.name}
                                  </p>
                                  <p className="text-xs text-gray-500">{enr.user?.email}</p>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <span className="font-medium text-jadmaa-charcoal">{enr.course?.title}</span>
                            </td>

                            <td className="px-6 py-4 text-gray-600 text-xs">
                              {new Date(enr.createdAt).toLocaleDateString()}
                            </td>

                            <td className="px-6 py-4">
                              <div className="w-36 space-y-1">
                                <div className="flex justify-between text-xs font-semibold">
                                  <span>{enr.progress}%</span>
                                  <span className="text-gray-400">
                                    {enr.completedLessons}/{enr.totalLessons}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="bg-jadmaa-red h-full rounded-full"
                                    style={{ width: `${enr.progress}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <span
                                className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                                  enr.status === 'ACTIVE'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : enr.status === 'COMPLETED'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {enr.status}
                              </span>
                            </td>

                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => setSelectedEnrollmentForModal(enr)}
                                className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-bold text-jadmaa-red bg-red-50 hover:bg-red-100 rounded-lg transition"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Manage Details</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

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
          fetchDashboardStats();
        }}
      />

      {/* Student Details & Status Modal */}
      <StudentDetailsModal
        enrollment={selectedEnrollmentForModal}
        onClose={() => setSelectedEnrollmentForModal(null)}
        onStatusUpdated={() => {
          fetchStudents();
          fetchDashboardStats();
        }}
      />
    </>
  );
};
