import React, { useEffect, useState } from 'react';
import { adminApi } from '../../lib/api/adminApi';
import { useModalHistory } from '../../hooks/useModalHistory';
import { X, BookOpen, CreditCard, CheckCircle2, PlayCircle } from 'lucide-react';

interface StudentDetailsModalProps {
  studentId: string;
  onClose: () => void;
}

export const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({ studentId, onClose }) => {
  const { closeWithHistory } = useModalHistory(Boolean(studentId), onClose, 'student-modal');
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await adminApi.getStudentById(studentId);
        if (res.success) {
          setStudent(res.data);
        } else {
          setError(res.error?.message || 'Failed to fetch student details');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch student details');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [studentId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl w-full max-w-3xl p-6 shadow-xl flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-jadmaa-red"></div>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl w-full max-w-3xl p-6 shadow-xl relative">
          <button onClick={closeWithHistory} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
          <div className="text-center py-10 text-red-500 font-bold">{error || 'Student not found'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-heading font-bold text-gray-900">{student.name}</h2>
            <p className="text-sm text-gray-500">{student.email} • {student.phone || 'No phone'}</p>
          </div>
          <button onClick={closeWithHistory} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Enrollments & Wishlist (Placeholder) */}
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-2 mb-4">
                  <BookOpen className="w-5 h-5 text-jadmaa-red" />
                  <h3 className="text-lg font-bold">Enrolled Courses</h3>
                </div>
                {student.enrollments?.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No courses enrolled yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {student.enrollments.map((enrollment: any, idx: number) => {
                      const progress = enrollment.progress || {};
                      const isCompleted = progress.isCompleted || enrollment.status === 'COMPLETED' || progress.percentage === 100;
                      const percentage = isCompleted ? 100 : (progress.percentage || 0);

                      return (
                        <li key={idx} className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-2.5 transition-colors hover:bg-gray-50/80">
                          <div className="flex justify-between items-start gap-3">
                            <span className="font-semibold text-gray-900 leading-snug">{enrollment.course?.title}</span>
                            {isCompleted ? (
                              <span className="shrink-0 text-xs px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold flex items-center gap-1 border border-emerald-200 shadow-2xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Completed
                              </span>
                            ) : (
                              <span className="shrink-0 text-xs px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-bold border border-amber-200 shadow-2xs flex items-center gap-1">
                                <PlayCircle className="w-3.5 h-3.5 text-amber-600" />
                                {percentage > 0 ? `${percentage}% watched` : '0% seen'}
                              </span>
                            )}
                          </div>

                          {/* Progress Track */}
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                isCompleted
                                  ? 'bg-emerald-500'
                                  : percentage > 0
                                  ? 'bg-amber-500'
                                  : 'bg-gray-300'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>

                          <div className="flex justify-between items-center text-xs text-gray-500 font-medium">
                            <span>
                              Status: <strong className={isCompleted ? 'text-emerald-700 font-bold' : 'text-gray-700'}>{isCompleted ? 'Completed' : 'In Progress'}</strong>
                            </span>
                            <span>
                              {progress.totalLessons > 0 ? (
                                `${progress.completedLessons || 0} of ${progress.totalLessons} lessons completed (${percentage}%)`
                              ) : (
                                `${percentage}% completed`
                              )}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-2 mb-4">
                  <BookOpen className="w-5 h-5 text-gray-400" />
                  <h3 className="text-lg font-bold">Wishlist (Saved Courses)</h3>
                </div>
                <p className="text-sm text-gray-500 italic">No courses saved to wishlist.</p>
              </div>
            </div>

            {/* Payments */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm h-fit">
              <div className="flex items-center space-x-2 mb-4">
                <CreditCard className="w-5 h-5 text-jadmaa-red" />
                <h3 className="text-lg font-bold">Payment History</h3>
              </div>
              {student.payments?.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No payments found.</p>
              ) : (
                <div className="space-y-3">
                  {student.payments.map((payment: any, idx: number) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex flex-col space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm">₹{payment.amount}</span>
                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                          payment.status === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                          payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span className="font-mono">{payment.merchantOrderId || payment.merchantTransactionId || 'N/A'}</span>
                        <span>{new Date(payment.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
