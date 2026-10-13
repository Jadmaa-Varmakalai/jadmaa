import React, { useEffect, useState } from 'react';
import { adminApi } from '../../lib/api/adminApi';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { AdminCourseModal } from './AdminCourseModal';

export const Courses: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCourses({ page: pagination.page, limit: pagination.limit, search });
      setCourses(res.data.items);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCourses();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, pagination.page, pagination.limit]);

  const handleToggleAvailability = async (course: any) => {
    const nextAvailable = course.isAvailable === false;
    setTogglingId(course.id);

    // Optimistically update table UI
    setCourses(prev =>
      prev.map(c => {
        if (c.id === course.id) {
          return {
            ...c,
            isAvailable: nextAvailable,
            status: nextAvailable ? 'PUBLISHED' : 'HOLD',
          };
        }
        return c;
      })
    );

    try {
      await adminApi.updateCourseAvailability(course.id, nextAvailable);
    } catch (err: any) {
      alert(err.message || 'Failed to update course availability');
      fetchCourses();
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      try {
        await adminApi.deleteCourse(id);
        fetchCourses();
      } catch (err: any) {
        const errorMsg = err.message || err.response?.data?.error?.message || 'Failed to delete course';
        if (err.data?.hasEnrollments || errorMsg.includes('enrollments')) {
          const forceConfirm = window.confirm(
            `${errorMsg}\n\nDo you want to permanently force-delete this course and all its associated test enrollments/records?`
          );
          if (forceConfirm) {
            try {
              await adminApi.deleteCourse(id, true);
              fetchCourses();
            } catch (forceErr: any) {
              alert(forceErr.message || 'Failed to force-delete course');
            }
          }
        } else {
          alert(errorMsg);
        }
      }
    }
  };

  const openEditModal = (course: any) => {
    setSelectedCourse(course);
    setModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedCourse(null);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-heading font-bold">Courses</h2>
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search courses..." 
              className="pl-9 pr-4 py-2 border rounded-full text-sm focus:outline-none focus:border-jadmaa-red w-full sm:w-64"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={openCreateModal}
            className="flex items-center justify-center space-x-2 bg-jadmaa-red hover:bg-[#8C1E1E] text-white px-4 py-2 rounded-lg font-bold text-sm transition shrink-0 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Course</span>
          </button>
        </div>
      </div>
      
      <>
        {/* Desktop Table View */}
        <div className="hidden md:block bg-white border rounded-xl overflow-x-auto shadow-sm">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 font-bold text-gray-700">Title</th>
                <th className="px-6 py-4 font-bold text-gray-700">Instructor</th>
                <th className="px-6 py-4 font-bold text-gray-700">Price</th>
                <th className="px-6 py-4 font-bold text-gray-700">Status</th>
                <th className="px-6 py-4 font-bold text-gray-700">Availability</th>
                <th className="px-6 py-4 font-bold text-gray-700">Created</th>
                <th className="px-6 py-4 font-bold text-gray-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && courses.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
              ) : courses.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No courses found</td></tr>
              ) : (
                courses.map(course => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium whitespace-normal max-w-[300px] truncate">{course.title}</td>
                    <td className="px-6 py-4 text-gray-600">{course.instructor?.displayName || 'Unknown'}</td>
                    <td className="px-6 py-4 text-gray-600">₹{course.price}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                        course.status === 'PUBLISHED' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : course.status === 'HOLD'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {course.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={course.isAvailable !== false}
                          disabled={togglingId === course.id}
                          onClick={() => handleToggleAvailability(course)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-jadmaa-red focus:ring-offset-2 disabled:opacity-50 ${
                            course.isAvailable !== false ? 'bg-emerald-600' : 'bg-gray-300'
                          }`}
                          title={course.isAvailable !== false ? 'Availability: Active (Click to put on Hold)' : 'Availability: On Hold (Click to make Available)'}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              course.isAvailable !== false ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className={`text-xs font-semibold ${course.isAvailable !== false ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {course.isAvailable !== false ? 'Available' : 'Hold'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{new Date(course.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => openEditModal(course)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit Course"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(course.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete Course"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Grid View */}
        <div className="md:hidden grid grid-cols-1 gap-4">
          {loading && courses.length === 0 ? (
            <div className="p-8 text-center text-gray-500 bg-white border rounded-xl shadow-sm">Loading...</div>
          ) : courses.length === 0 ? (
            <div className="p-8 text-center text-gray-500 bg-white border rounded-xl shadow-sm">No courses found</div>
          ) : (
            courses.map(course => (
              <div key={course.id} className="bg-white border rounded-xl p-4 shadow-sm flex flex-col space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-gray-900 leading-tight">{course.title}</h3>
                  <span className={`px-2 py-1 text-[10px] font-bold rounded-full shrink-0 ${
                    course.status === 'PUBLISHED' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : course.status === 'HOLD'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {course.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <div>
                    <span className="block text-xs text-gray-400 font-bold uppercase mb-0.5">Instructor</span>
                    {course.instructor?.displayName || 'Unknown'}
                  </div>
                  <div>
                    <span className="block text-xs text-gray-400 font-bold uppercase mb-0.5">Price</span>
                    ₹{course.price}
                  </div>
                  <div className="col-span-2">
                    <span className="block text-xs text-gray-400 font-bold uppercase mb-0.5">Created</span>
                    {new Date(course.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t text-sm">
                  <span className="text-xs text-gray-500 font-bold uppercase">Availability</span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={course.isAvailable !== false}
                      disabled={togglingId === course.id}
                      onClick={() => handleToggleAvailability(course)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        course.isAvailable !== false ? 'bg-emerald-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                          course.isAvailable !== false ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className={`text-xs font-semibold ${course.isAvailable !== false ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {course.isAvailable !== false ? 'Available' : 'Hold'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t">
                  <button 
                    onClick={() => openEditModal(course)}
                    className="flex-1 flex items-center justify-center space-x-1 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition font-medium text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button 
                    onClick={() => handleDelete(course.id)}
                    className="flex-1 flex items-center justify-center space-x-1 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition font-medium text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </>
      
      <div className="flex justify-between items-center text-sm text-gray-600">
        <div>Showing page {pagination.page} of {pagination.totalPages || 1} ({pagination.total} total)</div>
        <div className="flex space-x-2">
          <button 
            disabled={pagination.page <= 1} 
            onClick={() => setPagination({...pagination, page: pagination.page - 1})}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >Prev</button>
          <button 
            disabled={pagination.page >= pagination.totalPages} 
            onClick={() => setPagination({...pagination, page: pagination.page + 1})}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >Next</button>
        </div>
      </div>

      <AdminCourseModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        course={selectedCourse} 
        onSuccess={fetchCourses} 
      />
    </div>
  );
};
