import React, { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { SEO } from '../../components/common/SEO';
import { InstructorDashboard } from './InstructorDashboard';
import { InstructorCoursesPage } from './InstructorCoursesPage';
import { InstructorStudentsPage } from './InstructorStudentsPage';

interface InstructorPanelProps {
  section?: 'dashboard' | 'courses' | 'students';
}

export const InstructorPanel: React.FC<InstructorPanelProps> = ({ section: propSection }) => {
  const { section: paramSection } = useParams<{ section?: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // Backward compatibility: If accessed as `/instructor#students`, redirect to `/instructor/students`
  useEffect(() => {
    if (location.hash) {
      const hash = location.hash.replace('#', '');
      if (hash === 'students') {
        navigate('/instructor/students', { replace: true });
      } else {
        navigate('/instructor/courses', { replace: true });
      }
    }
  }, [location.hash, navigate]);

  const activeSection = propSection || paramSection || (
    location.pathname === '/instructor/students' ? 'students' :
    location.pathname === '/instructor/courses' ? 'courses' : 'dashboard'
  );

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <SEO title="Instructor Portal | JADMAA" />
      {activeSection === 'dashboard' && <InstructorDashboard />}
      {activeSection === 'courses' && <InstructorCoursesPage />}
      {activeSection === 'students' && <InstructorStudentsPage />}
    </div>
  );
};
