import React, { useState } from 'react';
import { X, Mail, Phone, BookOpen, CheckCircle, XCircle, Award } from 'lucide-react';
import { instructorApi } from '../../lib/api/instructorApi';

interface StudentDetailsModalProps {
  enrollment: any;
  onClose: () => void;
  onStatusUpdated: () => void;
}

export const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({
  enrollment,
  onClose,
  onStatusUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!enrollment) return null;

  const { user, course } = enrollment;

  const handleUpdateStatus = async (newStatus: 'ACTIVE' | 'REVOKED' | 'COMPLETED') => {
    if (!window.confirm(`Are you sure you want to change student status to ${newStatus}?`)) return;
    setLoading(true);
    setError(null);
    try {
      await instructorApi.updateStudentStatus(enrollment.id, newStatus);
      onStatusUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update student status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-jadmaa-border">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-jadmaa-border bg-jadmaa-cream/50">
          <div>
            <h3 className="text-xl font-bold font-heading text-jadmaa-charcoal">Student Profile</h3>
            <p className="text-xs text-jadmaa-textMuted">Course enrollment details & progress</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="m-6 mb-0 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* User info */}
          <div className="flex items-center space-x-4">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-16 h-16 rounded-2xl object-cover border border-jadmaa-border shadow-xs"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-jadmaa-red/10 text-jadmaa-red flex items-center justify-center font-bold text-2xl border border-red-100">
                {user?.name?.charAt(0) || 'S'}
              </div>
            )}
            <div>
              <h4 className="font-heading font-extrabold text-lg text-jadmaa-charcoal">{user?.name}</h4>
              <div className="flex items-center space-x-2 text-xs text-jadmaa-textMuted mt-1">
                <Mail className="w-3.5 h-3.5" />
                <span>{user?.email}</span>
              </div>
              {user?.phone && (
                <div className="flex items-center space-x-2 text-xs text-jadmaa-textMuted mt-0.5">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{user.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Enrolled Course */}
          <div className="p-4 bg-jadmaa-cream rounded-xl border border-jadmaa-border space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-jadmaa-red uppercase tracking-wider">
              <BookOpen className="w-4 h-4" />
              <span>Enrolled Course</span>
            </div>
            <h5 className="font-bold text-sm text-jadmaa-charcoal">{course?.title}</h5>
            <div className="flex justify-between items-center text-xs text-jadmaa-textMuted pt-2 border-t border-jadmaa-border/60">
              <span>Enrollment Date:</span>
              <span className="font-semibold text-jadmaa-charcoal">
                {new Date(enrollment.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-jadmaa-textMuted">
              <span>Status:</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  enrollment.status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-800'
                    : enrollment.status === 'COMPLETED'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {enrollment.status}
              </span>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-jadmaa-charcoal">Curriculum Completion</span>
              <span className="text-jadmaa-red">{enrollment.progress || 0}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-jadmaa-red h-full rounded-full transition-all duration-300"
                style={{ width: `${enrollment.progress || 0}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-jadmaa-textMuted text-right">
              {enrollment.completedLessons || 0} of {enrollment.totalLessons || 0} lessons completed
            </p>
          </div>

          {/* Instructor Actions */}
          <div className="space-y-2 pt-2 border-t border-jadmaa-border">
            <label className="text-xs font-bold text-gray-700 block">Manage Enrollment Status</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={loading || enrollment.status === 'ACTIVE'}
                onClick={() => handleUpdateStatus('ACTIVE')}
                className={`px-3 py-2 rounded-lg text-xs font-bold border transition flex items-center justify-center space-x-1 ${
                  enrollment.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-300'
                    : 'border-gray-200 hover:bg-emerald-50 hover:text-emerald-700 text-gray-600'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Active</span>
              </button>

              <button
                type="button"
                disabled={loading || enrollment.status === 'COMPLETED'}
                onClick={() => handleUpdateStatus('COMPLETED')}
                className={`px-3 py-2 rounded-lg text-xs font-bold border transition flex items-center justify-center space-x-1 ${
                  enrollment.status === 'COMPLETED'
                    ? 'bg-blue-50 text-blue-800 border-blue-300 ring-1 ring-blue-300'
                    : 'border-gray-200 hover:bg-blue-50 hover:text-blue-700 text-gray-600'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Complete</span>
              </button>

              <button
                type="button"
                disabled={loading || enrollment.status === 'REVOKED'}
                onClick={() => handleUpdateStatus('REVOKED')}
                className={`px-3 py-2 rounded-lg text-xs font-bold border transition flex items-center justify-center space-x-1 ${
                  enrollment.status === 'REVOKED'
                    ? 'bg-red-50 text-red-800 border-red-300 ring-1 ring-red-300'
                    : 'border-gray-200 hover:bg-red-50 hover:text-red-700 text-gray-600'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Revoke</span>
              </button>
            </div>
            <p className="text-[11px] text-gray-400">
              Revoking removes access to lesson materials. Marking complete marks this course finished.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-jadmaa-border flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-bold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
