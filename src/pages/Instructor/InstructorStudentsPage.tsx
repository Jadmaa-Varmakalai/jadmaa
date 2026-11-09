import React, { useState, useEffect } from 'react';
import { SEO } from '../../components/common/SEO';
import {
  Users,
  Search,
  Eye,
  RefreshCw
} from 'lucide-react';
import { instructorApi } from '../../lib/api/instructorApi';
import { StudentDetailsModal } from './StudentDetailsModal';

export const InstructorStudentsPage: React.FC = () => {
  const [studentsData, setStudentsData] = useState<{ courses: any[]; enrollments: any[] }>({
    courses: [],
    enrollments: []
  });
  const [loading, setLoading] = useState(true);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('');
  const [selectedEnrollmentForModal, setSelectedEnrollmentForModal] = useState<any>(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await instructorApi.getStudents(selectedCourseFilter, studentSearch);
      if (res.success) {
        setStudentsData(res.data || { courses: [], enrollments: [] });
      }
    } catch (err) {
      console.error('Failed to fetch instructor students', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchStudents();
    }, 300);
    return () => clearTimeout(delay);
  }, [studentSearch, selectedCourseFilter]);

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <SEO title="Instructor Students | JADMAA" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#2B2521]">
            Enrolled Students
          </h1>
          <p className="text-xs sm:text-sm text-[#5C5148] mt-0.5">
            Monitor learning progress, lesson completion rates, and manage student enrollments.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-[#E8DDD0] shadow-2xs">
        <div className="flex flex-col sm:flex-row gap-2.5 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search student by name or email..."
              className="w-full pl-10 pr-4 py-2 border border-[#E8DDD0] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#B12B2B] bg-[#FAF6F0]/40"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
            />
          </div>

          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="px-4 py-2 border border-[#E8DDD0] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#B12B2B] bg-white text-[#2B2521]"
          >
            <option value="">All My Courses</option>
            {studentsData.courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <span className="text-xs text-[#5C5148] font-semibold">
            Total Enrolled: {studentsData.enrollments.length}
          </span>
          <button
            onClick={fetchStudents}
            className="p-2 border border-[#E8DDD0] rounded-xl hover:bg-[#FAF6F0] text-[#5C5148] transition cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Students Data: Responsive Card Layout on Mobile, Table on Desktop */}
      {loading && studentsData.enrollments.length === 0 ? (
        <div className="py-20 text-center text-[#5C5148]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B12B2B] mx-auto mb-3" />
          <p className="text-xs font-semibold">Loading student records...</p>
        </div>
      ) : studentsData.enrollments.length === 0 ? (
        <div className="p-10 sm:p-14 text-center bg-white rounded-2xl border border-dashed border-[#E8DDD0] space-y-3">
          <Users className="w-12 h-12 text-[#B12B2B]/40 mx-auto" />
          <h3 className="font-heading font-bold text-lg text-[#2B2521]">
            No Enrolled Students Found
          </h3>
          <p className="text-xs text-[#5C5148] max-w-md mx-auto">
            {selectedCourseFilter
              ? 'No students have enrolled in this course yet.'
              : 'Students who purchase or enroll in your courses will be listed here.'}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card View (shown below md screen) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {studentsData.enrollments.map((enr) => (
              <div
                key={enr.id}
                className="bg-white p-4 rounded-2xl border border-[#E8DDD0] shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[#B12B2B]/10 text-[#B12B2B] flex items-center justify-center font-bold text-xs shrink-0 border border-[#B12B2B]/20">
                      {enr.user?.avatarUrl ? (
                        <img src={enr.user.avatarUrl} alt={enr.user.name} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        enr.user?.name?.charAt(0) || 'S'
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-[#2B2521] truncate">{enr.user?.name}</p>
                      <p className="text-[11px] text-[#5C5148] truncate">{enr.user?.email}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase shrink-0 ${
                      enr.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : enr.status === 'COMPLETED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {enr.status}
                  </span>
                </div>

                <div className="pt-2 border-t border-gray-100 space-y-1.5">
                  <p className="text-xs font-semibold text-[#2B2521] line-clamp-1">
                    {enr.course?.title}
                  </p>
                  
                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-[#5C5148]">
                      <span>Progress: {enr.progress}%</span>
                      <span>{enr.completedLessons || 0}/{enr.totalLessons || 0} lessons</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#B12B2B] h-full rounded-full transition-all"
                        style={{ width: `${enr.progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] text-gray-500">
                    Enrolled: {new Date(enr.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => setSelectedEnrollmentForModal(enr)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#B12B2B] bg-red-50 hover:bg-red-100 rounded-xl transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Manage Details</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (hidden on mobile) */}
          <div className="hidden md:block bg-white border border-[#E8DDD0] rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-[#FAF6F0] border-b border-[#E8DDD0] text-[#5C5148] font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3.5">Student Name</th>
                    <th className="px-5 py-3.5">Course</th>
                    <th className="px-5 py-3.5">Enrollment Date</th>
                    <th className="px-5 py-3.5">Progress</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {studentsData.enrollments.map((enr) => (
                    <tr key={enr.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-[#B12B2B]/10 text-[#B12B2B] flex items-center justify-center font-bold text-xs shrink-0">
                            {enr.user?.avatarUrl ? (
                              <img src={enr.user.avatarUrl} alt={enr.user.name} className="w-full h-full object-cover rounded-full" />
                            ) : (
                              enr.user?.name?.charAt(0) || 'S'
                            )}
                          </div>
                          <div>
                            <p
                              onClick={() => setSelectedEnrollmentForModal(enr)}
                              className="font-bold text-[#2B2521] hover:text-[#B12B2B] cursor-pointer"
                            >
                              {enr.user?.name}
                            </p>
                            <p className="text-[11px] text-[#5C5148]">{enr.user?.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="font-medium text-[#2B2521] max-w-xs truncate block">
                          {enr.course?.title}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-[#5C5148]">
                        {new Date(enr.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="w-32 space-y-1">
                          <div className="flex justify-between text-[11px] font-semibold">
                            <span>{enr.progress}%</span>
                            <span className="text-gray-400">
                              {enr.completedLessons}/{enr.totalLessons}
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-[#B12B2B] h-full rounded-full"
                              style={{ width: `${enr.progress}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
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

                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedEnrollmentForModal(enr)}
                          className="inline-flex items-center space-x-1 px-3 py-1 text-xs font-bold text-[#B12B2B] bg-red-50 hover:bg-red-100 rounded-lg transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Manage</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Student Details & Status Modal */}
      <StudentDetailsModal
        enrollment={selectedEnrollmentForModal}
        onClose={() => setSelectedEnrollmentForModal(null)}
        onStatusUpdated={() => {
          fetchStudents();
        }}
      />
    </div>
  );
};

