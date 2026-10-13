import React, { useEffect, useState } from 'react';
import { adminApi } from '../../lib/api/adminApi';
import { Search } from 'lucide-react';
import { StudentDetailsModal } from './StudentDetailsModal';

export const Students: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getStudents({ page: pagination.page, limit: pagination.limit, search });
      setStudents(res.data.items);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchStudents();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, pagination.page, pagination.limit]);

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this student?`)) return;
    try {
      await adminApi.updateStudentStatus(id, !currentStatus);
      fetchStudents();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-heading font-bold">Students</h2>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search students..." 
            className="pl-9 pr-4 py-2 border rounded-full text-sm focus:outline-none focus:border-jadmaa-red w-full sm:w-64"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
      
      <>
        {/* Desktop Table View */}
        <div className="hidden md:block bg-white border rounded-xl overflow-x-auto shadow-sm">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 font-bold text-gray-700">Name</th>
                <th className="px-6 py-4 font-bold text-gray-700">Email</th>
                <th className="px-6 py-4 font-bold text-gray-700">Phone</th>
                <th className="px-6 py-4 font-bold text-gray-700">Joined</th>
                <th className="px-6 py-4 font-bold text-gray-700">Status</th>
                <th className="px-6 py-4 font-bold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && students.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No students found</td></tr>
              ) : (
                students.map(student => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-jadmaa-red cursor-pointer hover:underline" onClick={() => setSelectedStudentId(student.id)}>
                      {student.name}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{student.email}</td>
                    <td className="px-6 py-4 text-gray-600">{student.phone || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{new Date(student.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${student.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {student.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => toggleStatus(student.id, student.isActive)} className="text-jadmaa-red hover:underline font-medium text-xs">
                        {student.isActive ? 'Deactivate' : 'Activate'}
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
          {loading && students.length === 0 ? (
            <div className="p-8 text-center text-gray-500 bg-white border rounded-xl shadow-sm">Loading...</div>
          ) : students.length === 0 ? (
            <div className="p-8 text-center text-gray-500 bg-white border rounded-xl shadow-sm">No students found</div>
          ) : (
            students.map(student => (
              <div key={student.id} className="bg-white border rounded-xl p-4 shadow-sm flex flex-col space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <h3 
                    className="font-bold text-jadmaa-red leading-tight cursor-pointer hover:underline" 
                    onClick={() => setSelectedStudentId(student.id)}
                  >
                    {student.name}
                  </h3>
                  <span className={`px-2 py-1 text-[10px] font-bold rounded-full shrink-0 ${student.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {student.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                  <div>
                    <span className="block text-xs text-gray-400 font-bold uppercase mb-0.5">Email</span>
                    {student.email}
                  </div>
                  <div>
                    <span className="block text-xs text-gray-400 font-bold uppercase mb-0.5">Phone</span>
                    {student.phone || '-'}
                  </div>
                  <div className="sm:col-span-2">
                    <span className="block text-xs text-gray-400 font-bold uppercase mb-0.5">Joined</span>
                    {new Date(student.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t mt-2">
                  <button 
                    onClick={() => toggleStatus(student.id, student.isActive)}
                    className={`flex-1 flex items-center justify-center space-x-1 py-2 rounded-lg transition font-medium text-sm ${student.isActive ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'}`}
                  >
                    <span>{student.isActive ? 'Deactivate' : 'Activate'}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </>
      
      {/* Pagination */}
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
      
      {selectedStudentId && (
        <StudentDetailsModal 
          studentId={selectedStudentId} 
          onClose={() => setSelectedStudentId(null)} 
        />
      )}
    </div>
  );
};
