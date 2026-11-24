import React, { useEffect, useState } from 'react';
import { adminApi } from '../../lib/api/adminApi';
import { CheckCircle2, PlayCircle } from 'lucide-react';

export const Enrollments: React.FC = () => {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getEnrollments({ page: pagination.page, limit: pagination.limit });
      setEnrollments(res.data.items);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, [pagination.page, pagination.limit]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-heading font-bold">Enrollments</h2>
      </div>
      
      <>
        {/* Desktop Table View */}
        <div className="hidden md:block bg-white border rounded-xl overflow-x-auto shadow-sm">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 font-bold text-gray-700">Student</th>
                <th className="px-6 py-4 font-bold text-gray-700">Course</th>
                <th className="px-6 py-4 font-bold text-gray-700">Date</th>
                <th className="px-6 py-4 font-bold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && enrollments.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
              ) : enrollments.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No enrollments found</td></tr>
              ) : (
                enrollments.map(enrollment => {
                  const progress = enrollment.progress || {};
                  const isCompleted = progress.isCompleted || enrollment.status === 'COMPLETED' || progress.percentage === 100;
                  const percentage = isCompleted ? 100 : (progress.percentage || 0);

                  return (
                    <tr key={enrollment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{enrollment.user?.name || enrollment.user?.email || 'Unknown'}</td>
                      <td className="px-6 py-4 text-gray-600 truncate max-w-[200px]">{enrollment.course?.title || 'Unknown'}</td>
                      <td className="px-6 py-4 text-gray-600">{new Date(enrollment.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        {isCompleted ? (
                          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Completed
                          </span>
                        ) : (
                          <div className="flex flex-col gap-1 w-28">
                            <span className="text-xs font-bold text-amber-800 flex items-center gap-1">
                              <PlayCircle className="w-3 h-3 text-amber-600" />
                              {percentage > 0 ? `${percentage}% watched` : '0% seen'}
                            </span>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Grid View */}
        <div className="md:hidden grid grid-cols-1 gap-4">
          {loading && enrollments.length === 0 ? (
            <div className="p-8 text-center text-gray-500 bg-white border rounded-xl shadow-sm">Loading...</div>
          ) : enrollments.length === 0 ? (
            <div className="p-8 text-center text-gray-500 bg-white border rounded-xl shadow-sm">No enrollments found</div>
          ) : (
            enrollments.map(enrollment => {
              const progress = enrollment.progress || {};
              const isCompleted = progress.isCompleted || enrollment.status === 'COMPLETED' || progress.percentage === 100;
              const percentage = isCompleted ? 100 : (progress.percentage || 0);

              return (
                <div key={enrollment.id} className="bg-white border rounded-xl p-4 shadow-sm flex flex-col space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-gray-900 leading-tight">{enrollment.user?.name || enrollment.user?.email || 'Unknown'}</h3>
                    {isCompleted ? (
                      <span className="px-2 py-0.5 text-[11px] font-bold rounded-full shrink-0 bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Completed
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[11px] font-bold rounded-full shrink-0 bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <PlayCircle className="w-3 h-3 text-amber-600" />
                        {percentage > 0 ? `${percentage}% watched` : '0% seen'}
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <span className="block text-xs text-gray-400 font-bold uppercase mb-0.5">Course</span>
                    <div className="truncate">{enrollment.course?.title || 'Unknown'}</div>
                  </div>

                  {/* Mobile Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${isCompleted ? 'bg-emerald-500' : percentage > 0 ? 'bg-amber-500' : 'bg-gray-300'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="text-sm text-gray-600 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-gray-400 font-bold uppercase mr-1">Date:</span>
                      {new Date(enrollment.createdAt).toLocaleDateString()}
                    </div>
                    <span className="text-gray-500">
                      {isCompleted ? '100% Completed' : `${percentage}% watched`}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </>
      
      <div className="flex justify-between items-center text-sm text-gray-600">
        <div>Showing page {pagination.page} of {pagination.totalPages || 1} ({pagination.total} total)</div>
        <div className="flex space-x-2">
          <button disabled={pagination.page <= 1} onClick={() => setPagination({...pagination, page: pagination.page - 1})} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
          <button disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination({...pagination, page: pagination.page + 1})} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  );
};
