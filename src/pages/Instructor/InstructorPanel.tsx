import React, { useState, useEffect } from 'react';
import { SEO } from '../../components/common/SEO';
import { GraduationCap, Video, Users, CheckSquare, Sparkles, X, CheckCircle2 } from 'lucide-react';

import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const InstructorPanel: React.FC = () => {
  const { user, isLoggedIn, loading } = useAuth();
  const [showApprovalNotice, setShowApprovalNotice] = useState<boolean>(false);

  useEffect(() => {
    // Check if user has an unacknowledged approval notification from this login
    if (sessionStorage.getItem('jadmaa_instructor_approved_notice') === 'true') {
      setShowApprovalNotice(true);
    }
  }, []);

  const handleDismissNotice = () => {
    setShowApprovalNotice(false);
    sessionStorage.removeItem('jadmaa_instructor_approved_notice');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-jadmaa-cream flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 bg-jadmaa-red rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || user?.role !== 'INSTRUCTOR') {
    return <Navigate to="/login" />;
  }

  return (
    <>
      <SEO title="Instructor Panel | JADMAA LMS" />

      {/* One-time celebratory approval notification */}
      {showApprovalNotice && (
        <aside aria-label="Instructor Approval Notification" className="bg-emerald-600 text-white px-4 py-4 border-b border-emerald-700 shadow-sm animate-fadeIn">
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
                  Congratulations <strong>{user?.name}</strong>! Your application to become an Instructor has been approved by the Admin. Your account role has now been upgraded to <strong>Instructor</strong>.
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

      <section className="bg-jadmaa-cream py-10 border-b border-jadmaa-border text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
          <span className="text-xs font-bold text-jadmaa-red uppercase tracking-wider">
            Faculty Portal
          </span>
          <h1 className="font-heading font-extrabold text-3xl text-jadmaa-charcoal">
            Instructor Portal ({user?.name || 'Faculty Member'})
          </h1>
          <p className="text-xs text-jadmaa-textMuted">Instructor management layout ready for live class scheduling and student evaluations.</p>
        </div>
      </section>

      <section className="py-16 bg-white border-b border-jadmaa-border text-left min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-jadmaa-cream p-5 rounded-2xl border border-jadmaa-border space-y-2">
              <Video className="w-6 h-6 text-jadmaa-red" />
              <h4 className="font-heading font-bold text-base text-jadmaa-charcoal">Scheduled Live Classes</h4>
              <p className="text-xl font-bold text-jadmaa-charcoal">3 Sessions This Week</p>
            </div>

            <div className="bg-jadmaa-cream p-5 rounded-2xl border border-jadmaa-border space-y-2">
              <Users className="w-6 h-6 text-jadmaa-red" />
              <h4 className="font-heading font-bold text-base text-jadmaa-charcoal">Assigned Students</h4>
              <p className="text-xl font-bold text-jadmaa-charcoal">340 Enrolled</p>
            </div>

            <div className="bg-jadmaa-cream p-5 rounded-2xl border border-jadmaa-border space-y-2">
              <CheckSquare className="w-6 h-6 text-jadmaa-red" />
              <h4 className="font-heading font-bold text-base text-jadmaa-charcoal">Pending Evaluations</h4>
              <p className="text-xl font-bold text-jadmaa-red">12 Submissions</p>
            </div>
          </div>

          <div className="p-8 bg-jadmaa-cream/60 rounded-3xl border border-dashed border-jadmaa-border text-center space-y-3">
            <GraduationCap className="w-10 h-10 text-jadmaa-red mx-auto" />
            <h3 className="font-heading font-extrabold text-xl text-jadmaa-charcoal">Instructor Dashboard</h3>
            <p className="text-xs text-jadmaa-textMuted max-w-lg mx-auto">
              Live Google Meet class links, video lesson uploads, and student grading tools will be connected in Phase 2.
            </p>
          </div>

        </div>
      </section>
    </>
  );
};
