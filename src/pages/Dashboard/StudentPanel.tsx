import React, { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { SEO } from '../../components/common/SEO';
import { StudentDashboard } from './StudentDashboard';
import { MyCourses } from './MyCourses';
import { StudentProfile } from './StudentProfile';
import { StudentOrders } from './StudentOrders';
import { CertificatesPage } from './CertificatesPage';
import { Courses } from '../Courses';

interface StudentPanelProps {
  section?: 'dashboard' | 'courses' | 'my-courses' | 'orders' | 'settings' | 'certificates';
}

export const StudentPanel: React.FC<StudentPanelProps> = ({ section: propSection }) => {
  const { section: paramSection } = useParams<{ section?: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // Backward compatibility: If accessed as `/student#my-courses`, redirect cleanly
  useEffect(() => {
    if (location.hash) {
      const hash = location.hash.replace('#', '');
      const map: Record<string, string> = {
        dashboard: '/student/dashboard',
        courses: '/student/courses',
        'my-courses': '/student/my-courses',
        orders: '/student/orders',
        settings: '/student/settings',
        certificates: '/student/certificates'
      };
      if (map[hash]) {
        navigate(map[hash], { replace: true });
      }
    }
  }, [location.hash, navigate]);

  const activeSection = propSection || paramSection || (
    location.pathname === '/student/my-courses' ? 'my-courses' :
    location.pathname === '/student/courses' ? 'courses' :
    location.pathname === '/student/orders' ? 'orders' :
    location.pathname === '/student/settings' ? 'settings' :
    location.pathname === '/student/certificates' ? 'certificates' : 'dashboard'
  );

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <SEO title="Student Portal | JADMAA" />
      {activeSection === 'dashboard' && <StudentDashboard />}
      {activeSection === 'courses' && <Courses />}
      {activeSection === 'my-courses' && <MyCourses />}
      {activeSection === 'orders' && <StudentOrders />}
      {activeSection === 'settings' && <StudentProfile />}
      {activeSection === 'certificates' && <CertificatesPage />}
    </div>
  );
};
