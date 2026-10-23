import React, { useState, useEffect } from 'react';
import { SEO } from '../../components/common/SEO';
import { useAuth } from '../../context/AuthContext';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { StudentDashboard } from './StudentDashboard';
import { MyCourses } from './MyCourses';
import { StudentProfile } from './StudentProfile';
import { StudentOrders } from './StudentOrders';
import { Courses } from '../Courses';

type Tab = 'dashboard' | 'courses' | 'my-courses' | 'orders' | 'settings';

export const StudentPanel: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const { user, isLoggedIn, loading } = useAuth();

  useEffect(() => {
    if (location.hash) {
      const hash = location.hash.replace('#', '') as Tab;
      if (['dashboard', 'courses', 'my-courses', 'orders', 'settings'].includes(hash)) {
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

  // Allow student, or admin/super_admin viewing the portal
  if (user?.role !== 'STUDENT' && user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
    return <Navigate to="/" />;
  }

  const tabs: { id: Tab, label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'courses', label: 'Courses' },
    { id: 'my-courses', label: 'My Courses' },
    { id: 'orders', label: 'My Orders' },
    { id: 'settings', label: 'Settings' },
  ];

  const handleTabClick = (tabId: Tab) => {
    setActiveTab(tabId);
    navigate(`/student#${tabId}`, { replace: true });
  };

  return (
    <>
      <SEO title="Student Panel | JADMAA LMS" />
      <section className="bg-jadmaa-cream pt-10 pb-0 border-b border-jadmaa-border text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
          <span className="text-xs font-bold text-jadmaa-red uppercase tracking-wider">
            Student Area
          </span>
          <h1 className="font-heading font-extrabold text-3xl text-jadmaa-charcoal">
            JADMAA Student Portal
          </h1>
          <p className="text-xs text-jadmaa-textMuted pb-2">Manage your learning, courses, product purchases, and profile.</p>
          <div className="flex gap-4 border-t border-jadmaa-border/30 pt-3 overflow-x-auto no-scrollbar">
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
      
      <div className="bg-gray-50 min-h-screen">
         {activeTab === 'dashboard' && <StudentDashboard />}
         {activeTab === 'courses' && <Courses />}
         {activeTab === 'my-courses' && <MyCourses />}
         {activeTab === 'orders' && <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left"><StudentOrders /></div>}
         {activeTab === 'settings' && <StudentProfile />}
      </div>
    </>
  );
};
