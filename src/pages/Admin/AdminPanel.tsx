import React, { useState, useEffect } from 'react';
import { SEO } from '../../components/common/SEO';
import { ShieldAlert } from 'lucide-react';
import { BlogManager } from './BlogManager';
import { Overview } from './Overview';
import { Students } from './Students';
import { Instructors } from './Instructors';
import { Courses } from './Courses';
import { Enrollments } from './Enrollments';
import { Payments } from './Payments';
import { DatabaseManager } from './DatabaseManager';
import { SettingsEditor } from './SettingsEditor';
import { EnquiriesManager } from './EnquiriesManager';
import { useAuth } from '../../context/AuthContext';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

type Tab = 'dashboard' | 'enquiries' | 'students' | 'instructors' | 'courses' | 'enrollments' | 'payments' | 'blogs' | 'settings' | 'database';

export const AdminPanel: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const { user, isLoggedIn, loading } = useAuth();

  useEffect(() => {
    if (location.hash) {
      const hash = location.hash.replace('#', '') as Tab;
      if (['dashboard', 'enquiries', 'students', 'instructors', 'courses', 'enrollments', 'payments', 'blogs', 'settings', 'database'].includes(hash)) {
        setActiveTab(hash);
      }
    } else {
      setActiveTab('dashboard');
    }
  }, [location.hash]);

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

  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  // Only allow admin or super_admin
  if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-jadmaa-cream">
        <div className="text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-jadmaa-red mx-auto" />
          <h2 className="text-xl font-bold text-jadmaa-charcoal">Access Denied</h2>
          <p className="text-sm text-jadmaa-textMuted">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab, label: string }[] = [
    { id: 'dashboard', label: 'Overview' },
    { id: 'enquiries', label: 'Enquiries & Leads' },
    { id: 'students', label: 'Students' },
    { id: 'instructors', label: 'Instructors' },
    { id: 'courses', label: 'Courses' },
    { id: 'enrollments', label: 'Enrollments' },
    { id: 'payments', label: 'Payments' },
    { id: 'blogs', label: 'Blog Manager' },
    { id: 'settings', label: 'Settings' },
  ];

  if (user?.role === 'SUPER_ADMIN') {
    tabs.push({ id: 'database', label: 'Database' });
  }

  const handleTabClick = (tabId: Tab) => {
    setActiveTab(tabId);
    navigate(`/admin#${tabId}`, { replace: true });
  };

  return (
    <>
      <SEO title="Admin Panel | JADMAA LMS" />
      <section className="bg-jadmaa-cream pt-10 pb-0 border-b border-jadmaa-border text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
          <span className="text-xs font-bold text-jadmaa-red uppercase tracking-wider">
            Administrative Management
          </span>
          <h1 className="font-heading font-extrabold text-3xl text-jadmaa-charcoal">
            JADMAA Admin Portal
          </h1>
          <p className="text-xs text-jadmaa-textMuted pb-2">Manage enquiries, courses, users, and the Academy Journal.</p>

          {/* Admin Navigation Tabs */}
          <div className="flex gap-4 border-t border-jadmaa-border/40 pt-3 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`pb-3 px-2 text-sm font-semibold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'border-jadmaa-red text-jadmaa-red font-bold'
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>
      
      <section className="py-8 bg-gray-50 text-left min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {activeTab === 'dashboard' && <Overview />}
          {activeTab === 'enquiries' && <EnquiriesManager />}
          {activeTab === 'students' && <Students />}
          {activeTab === 'instructors' && <Instructors />}
          {activeTab === 'courses' && <Courses />}
          {activeTab === 'enrollments' && <Enrollments />}
          {activeTab === 'payments' && <Payments />}
          {activeTab === 'blogs' && <BlogManager />}
          {activeTab === 'settings' && <SettingsEditor />}
          {activeTab === 'database' && user?.role === 'SUPER_ADMIN' && <DatabaseManager />}
        </div>
      </section>
    </>
  );
};
