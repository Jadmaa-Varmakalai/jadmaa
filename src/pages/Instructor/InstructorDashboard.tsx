import React, { useState, useEffect } from 'react';
import { SEO } from '../../components/common/SEO';
import {
  BookOpen,
  Plus,
  Users,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  X,
  ArrowRight,
  TrendingUp,
  Video,
  DollarSign,
  Percent,
  Filter,
  UserMinus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { instructorApi } from '../../lib/api/instructorApi';
import { InstructorCourseModal } from './InstructorCourseModal';

export const InstructorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [showApprovalNotice, setShowApprovalNotice] = useState(false);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('ALL');
  const [withdrawing, setWithdrawing] = useState(false);

  const isPlatformAdmin = user?.isAdmin || user?.role === 'SUPER_ADMIN' || stats?.financials?.isPlatformAdmin;

  useEffect(() => {
    if (sessionStorage.getItem('jadmaa_instructor_approved_notice') === 'true') {
      setShowApprovalNotice(true);
    }
  }, []);

  const handleDismissNotice = () => {
    setShowApprovalNotice(false);
    sessionStorage.removeItem('jadmaa_instructor_approved_notice');
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await instructorApi.getDashboard();
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load instructor dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Withdraw from instructor role (demote to student)
  const handleWithdrawRole = async () => {
    const confirmMsg = "Are you sure you want to withdraw from your instructor role?\n\nYour account will revert to student access, and you will no longer have access to instructor publishing tools.";
    if (!window.confirm(confirmMsg)) return;

    try {
      setWithdrawing(true);
      const res = await instructorApi.withdrawInstructor();
      alert(res.message || 'You have successfully withdrawn from your instructor post.');
      // Refresh window / navigate to student portal
      window.location.href = '/student';
    } catch (err: any) {
      alert(err.message || 'Failed to withdraw from instructor role');
      setWithdrawing(false);
    }
  };

  const financials = stats?.financials;
  const coursesList = financials?.courses || [];

  // Filter courses for financial breakdown
  const filteredCourses = selectedCourseFilter === 'ALL'
    ? coursesList
    : coursesList.filter((c: any) => c.id === selectedCourseFilter);

  // Financial totals for the filtered selection
  const filteredGrossSales = filteredCourses.reduce((sum: number, c: any) => sum + (c.totalSales || 0), 0);
  const filteredCommissionDeducted = filteredCourses.reduce((sum: number, c: any) => sum + (c.commissionDeducted || 0), 0);
  const filteredAmountToDeliver = filteredCourses.reduce((sum: number, c: any) => sum + (c.finalAmountToDeliver || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <SEO title="Instructor Dashboard | JADMAA" />

      {/* Approval Notification Banner */}
      {showApprovalNotice && (
        <aside
          aria-label="Instructor Approval Notification"
          className="bg-emerald-600 text-white p-4 rounded-2xl shadow-sm animate-fadeIn flex items-start sm:items-center justify-between gap-4"
        >
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
                Congratulations <strong>{user?.name}</strong>! You can now publish courses and instruct students.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismissNotice}
            className="p-1.5 bg-emerald-700/60 hover:bg-emerald-700 text-emerald-100 hover:text-white rounded-lg transition shrink-0 cursor-pointer"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </aside>
      )}

      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-[#B12B2B] to-[#8F2020] rounded-2xl p-5 sm:p-7 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold text-[10px] uppercase tracking-wider mb-2 backdrop-blur-xs">
            Instructor Portal
          </span>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-white">
            Welcome back, {user?.name || 'Instructor'}
          </h1>
          <p className="text-xs sm:text-sm text-red-100 mt-1 max-w-xl">
            Track your martial arts curriculum performance, monitor enrolled students, and track your course earnings &amp; payouts.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => setIsCourseModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-white text-[#B12B2B] hover:bg-red-50 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition hover:scale-102 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create New Course</span>
          </button>

          {/* Withdraw Instructor Post button - Only for non-admin instructors */}
          {!isPlatformAdmin && (
            <button
              type="button"
              disabled={withdrawing}
              onClick={handleWithdrawRole}
              className="inline-flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/30 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition cursor-pointer"
              title="Resign / withdraw from instructor role and return to student access"
            >
              <UserMinus className="w-3.5 h-3.5" />
              <span>{withdrawing ? 'Withdrawing...' : 'Withdraw Post'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── SECTION 1: Overall Earnings & Payout Summary Card ──────── */}
      <div className="bg-white rounded-2xl border border-[#E8DDD0] p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-100 pb-3">
          <div>
            <h2 className="font-heading font-extrabold text-lg text-[#2B2521] flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <span>Earnings &amp; Payout Summary (All Courses)</span>
            </h2>
            <p className="text-xs text-[#5C5148] mt-0.5">
              {isPlatformAdmin ? (
                <span className="text-amber-800 font-semibold">Platform Owner &amp; Founder — 100% Direct Platform Revenue (No Commission Split)</span>
              ) : (
                <>Deal: <strong>{financials?.commissionRate ?? 20}%</strong> JADMAA platform commission rate</>
              )}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isPlatformAdmin ? 'Platform Active' : 'Payout Active'}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Card A: Overall Gross Sales */}
          <div className="bg-[#FAF6F0] p-4 rounded-xl border border-[#E8DDD0] space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C5148] block">
              Total Course Sales (Gross)
            </span>
            <p className="text-2xl sm:text-3xl font-black text-[#2B2521]">
              ₹{(financials?.totalGrossSales ?? 0).toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-[#7A6E65]">
              Total payments collected from enrolled students
            </p>
          </div>

          {/* Card B: Platform Commission Taken */}
          {isPlatformAdmin ? (
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
                Platform Commission Deducted
              </span>
              <p className="text-2xl sm:text-3xl font-black text-gray-600 font-mono">
                ₹0 (0%)
              </p>
              <p className="text-[11px] text-gray-500">
                No platform deduction (Platform Owner)
              </p>
            </div>
          ) : (
            <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 block">
                  Platform Commission ({financials?.commissionRate ?? 20}%)
                </span>
                <Percent className="w-4 h-4 text-amber-700" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-amber-900 font-mono">
                ₹{(financials?.totalCommissionDeducted ?? 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-amber-800">
                Retained by JADMAA platform
              </p>
            </div>
          )}

          {/* Card C: Final Amount to be Delivered */}
          <div className="bg-emerald-50/90 p-4 rounded-xl border border-emerald-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                {isPlatformAdmin ? 'Net Platform Revenue' : 'Final Amount to be Delivered'}
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-800 font-mono">
              ₹{(financials?.finalAmountDue ?? 0).toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-emerald-700 font-semibold">
              {isPlatformAdmin ? '100% direct revenue retained' : 'Net payout delivered to instructor'}
            </p>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: Course-by-Course Financial Breakdown & Filter ─ */}
      <div className="bg-white rounded-2xl border border-[#E8DDD0] p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="font-heading font-extrabold text-lg text-[#2B2521]">
              Course-by-Course Breakdown
            </h2>
            <p className="text-xs text-[#5C5148] mt-0.5">
              Review true price, commission taken, and final amount due per course.
            </p>
          </div>

          {/* Filter Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-gray-500 shrink-0" />
            <select
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
              className="w-full sm:w-64 px-3 py-2 bg-gray-50 border border-[#E8DDD0] rounded-xl text-xs font-semibold text-[#2B2521] focus:border-[#B12B2B] focus:ring-1 focus:ring-[#B12B2B] outline-none cursor-pointer"
            >
              <option value="ALL">All Courses ({coursesList.length})</option>
              {coursesList.map((course: any) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Summary banner if specific course selected */}
        {selectedCourseFilter !== 'ALL' && (
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold text-emerald-900">
              Selected Course Final Deliverable:
            </span>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">
                Sales: <strong className="text-gray-900 font-mono">₹{filteredGrossSales.toLocaleString('en-IN')}</strong>
              </span>
              <span className="text-amber-800">
                Commission: <strong className="font-mono">{isPlatformAdmin ? '₹0 (0%)' : `₹${filteredCommissionDeducted.toLocaleString('en-IN')}`}</strong>
              </span>
              <span className="text-emerald-800 font-bold">
                {isPlatformAdmin ? 'Net Revenue:' : 'Final Amount:'} <strong className="font-mono text-sm">₹{(isPlatformAdmin ? filteredGrossSales : filteredAmountToDeliver).toLocaleString('en-IN')}</strong>
              </span>
            </div>
          </div>
        )}

        {/* Courses Financial Table */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-12 bg-[#FAF6F0] rounded-xl border border-[#E8DDD0] text-xs text-[#7A6E65]">
            No courses found with student payment records.
          </div>
        ) : (
          <div className="border border-[#E8DDD0] rounded-xl overflow-x-auto shadow-2xs">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-[#FAF6F0] border-b border-[#E8DDD0] text-[#5C5148] font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Course Name</th>
                  <th className="px-4 py-3.5 text-right">True Price</th>
                  <th className="px-4 py-3.5 text-center">Paid Students</th>
                  <th className="px-4 py-3.5 text-right">Total Revenue</th>
                  <th className="px-4 py-3.5 text-right">
                    {isPlatformAdmin ? 'Commission' : `JADMAA Commission (${financials?.commissionRate ?? 20}%)`}
                  </th>
                  <th className="px-4 py-3.5 text-right font-bold text-emerald-800">
                    {isPlatformAdmin ? 'Net Revenue' : 'Final Amount to Deliver'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5EFE6]">
                {filteredCourses.map((course: any) => (
                  <tr key={course.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-[#2B2521] max-w-xs truncate">
                      {course.title}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-[#5C5148]">
                      ₹{course.truePrice?.toLocaleString('en-IN') ?? 0}
                    </td>
                    <td className="px-4 py-3.5 text-center text-[#5C5148]">
                      {course.paidStudentsCount}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-[#2B2521]">
                      ₹{course.totalSales.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-amber-800">
                      {isPlatformAdmin ? '—' : `₹${course.commissionDeducted.toLocaleString('en-IN')}`}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-black text-emerald-700 text-sm">
                      ₹{(isPlatformAdmin ? course.totalSales : course.finalAmountToDeliver).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E8DDD0] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[#B12B2B]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C5148]">My Courses</span>
            <div className="p-2 bg-red-50 rounded-xl">
              <BookOpen className="w-4 h-4 text-[#B12B2B]" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#2B2521]">
            {loading ? '—' : stats?.coursesCount ?? 0}
          </p>
          <p className="text-[11px] text-[#5C5148]">
            {stats?.publishedCoursesCount ?? 0} Published • {stats?.draftCoursesCount ?? 0} Draft
          </p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E8DDD0] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[#B12B2B]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C5148]">Total Students</span>
            <div className="p-2 bg-red-50 rounded-xl">
              <Users className="w-4 h-4 text-[#B12B2B]" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#2B2521]">
            {loading ? '—' : stats?.totalStudents ?? 0}
          </p>
          <p className="text-[11px] text-[#5C5148]">Across all courses</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E8DDD0] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[#B12B2B]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C5148]">Active Enrollments</span>
            <div className="p-2 bg-red-50 rounded-xl">
              <TrendingUp className="w-4 h-4 text-[#B12B2B]" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#2B2521]">
            {loading ? '—' : stats?.activeEnrollments ?? 0}
          </p>
          <p className="text-[11px] text-[#5C5148]">Currently in training</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E8DDD0] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[#B12B2B]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C5148]">Status</span>
            <div className="p-2 bg-emerald-50 rounded-xl">
              <GraduationCap className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-base sm:text-lg font-bold text-emerald-600 pt-1">
            Active Instructor
          </p>
          <p className="text-[11px] text-[#5C5148]">Direct publishing enabled</p>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/instructor/courses"
          className="bg-white p-5 rounded-2xl border border-[#E8DDD0] hover:border-[#B12B2B] shadow-2xs hover:shadow-md transition group flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-[#B12B2B] flex items-center justify-center shrink-0 group-hover:bg-[#B12B2B] group-hover:text-white transition">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#2B2521] group-hover:text-[#B12B2B] transition">
                Manage Courses &amp; Curriculum
              </h3>
              <p className="text-xs text-[#5C5148] mt-0.5">
                Upload video lessons, edit syllabi, set pricing, and publish.
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-[#5C5148] group-hover:text-[#B12B2B] group-hover:translate-x-1 transition shrink-0" />
        </Link>

        <Link
          to="/instructor/students"
          className="bg-white p-5 rounded-2xl border border-[#E8DDD0] hover:border-[#B12B2B] shadow-2xs hover:shadow-md transition group flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-[#B12B2B] flex items-center justify-center shrink-0 group-hover:bg-[#B12B2B] group-hover:text-white transition">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#2B2521] group-hover:text-[#B12B2B] transition">
                Student Enrollees &amp; Progress
              </h3>
              <p className="text-xs text-[#5C5148] mt-0.5">
                Review enrolled practitioners, certification requests, and status.
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-[#5C5148] group-hover:text-[#B12B2B] group-hover:translate-x-1 transition shrink-0" />
        </Link>
      </div>

      {/* Course Modal */}
      {isCourseModalOpen && (
        <InstructorCourseModal
          course={null}
          isOpen={isCourseModalOpen}
          onClose={() => setIsCourseModalOpen(false)}
          onSuccess={() => {
            setIsCourseModalOpen(false);
            fetchStats();
          }}
        />
      )}
    </div>
  );
};

