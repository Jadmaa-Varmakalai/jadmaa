import React, { useEffect, useState } from 'react';
import { Users, BookOpen, CreditCard, GraduationCap } from 'lucide-react';
import { adminApi } from '../../lib/api/adminApi';

export const Overview: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminApi.getDashboardStats();
        setStats(response.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-8 text-center"><div className="animate-pulse flex flex-col items-center"><div className="h-10 w-10 bg-jadmaa-red/20 rounded-full mb-4"></div><div className="h-4 w-32 bg-gray-200 rounded"></div></div></div>;
  if (error) return <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-jadmaa-cream p-5 rounded-2xl border border-jadmaa-border space-y-2 hover-lift">
          <Users className="w-6 h-6 text-jadmaa-red" />
          <h4 className="font-heading font-bold text-sm text-jadmaa-textMuted uppercase">Students</h4>
          <p className="text-2xl font-black text-jadmaa-charcoal">{stats?.totalStudents || 0}</p>
        </div>
        <div className="bg-jadmaa-cream p-5 rounded-2xl border border-jadmaa-border space-y-2 hover-lift">
          <BookOpen className="w-6 h-6 text-jadmaa-red" />
          <h4 className="font-heading font-bold text-sm text-jadmaa-textMuted uppercase">Published Courses</h4>
          <p className="text-2xl font-black text-jadmaa-charcoal">{stats?.publishedCourses || 0}</p>
        </div>
        <div className="bg-jadmaa-cream p-5 rounded-2xl border border-jadmaa-border space-y-2 hover-lift">
          <GraduationCap className="w-6 h-6 text-jadmaa-red" />
          <h4 className="font-heading font-bold text-sm text-jadmaa-textMuted uppercase">Enrollments</h4>
          <p className="text-2xl font-black text-jadmaa-charcoal">{stats?.totalEnrollments || 0}</p>
        </div>
        <div className="bg-jadmaa-cream p-5 rounded-2xl border border-jadmaa-border space-y-2 hover-lift">
          <CreditCard className="w-6 h-6 text-jadmaa-red" />
          <h4 className="font-heading font-bold text-sm text-jadmaa-textMuted uppercase">Net Revenue</h4>
          <p className="text-2xl font-black text-jadmaa-red">₹{stats?.totalRevenue?.toLocaleString() || 0}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-2xl border border-jadmaa-border shadow-sm">
          <h3 className="font-heading font-bold text-lg mb-4 text-jadmaa-charcoal border-b pb-2">User Metrics</h3>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-jadmaa-textMuted">Active Students</span>
            <span className="font-bold">{stats?.activeStudents || 0}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm text-jadmaa-textMuted">Instructors</span>
            <span className="font-bold">{stats?.totalInstructors || 0}</span>
          </div>
        </div>
        
        <div className="p-6 bg-white rounded-2xl border border-jadmaa-border shadow-sm">
          <h3 className="font-heading font-bold text-lg mb-4 text-jadmaa-charcoal border-b pb-2">Academic Metrics</h3>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-jadmaa-textMuted">Completed Courses</span>
            <span className="font-bold">{stats?.completedCourses || 0}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm text-jadmaa-textMuted">Certificates Issued</span>
            <span className="font-bold">{stats?.certificatesIssued || 0}</span>
          </div>
        </div>
        
        <div className="p-6 bg-white rounded-2xl border border-jadmaa-border shadow-sm">
          <h3 className="font-heading font-bold text-lg mb-4 text-jadmaa-charcoal border-b pb-2">Payment Metrics</h3>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-jadmaa-textMuted">Successful Payments</span>
            <span className="font-bold text-emerald-600">{stats?.successfulPayments || 0}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm text-jadmaa-textMuted">Pending Payments</span>
            <span className="font-bold text-amber-600">{stats?.pendingPayments || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
