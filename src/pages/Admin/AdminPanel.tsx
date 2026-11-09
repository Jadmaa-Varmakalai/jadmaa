import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { SEO } from '../../components/common/SEO';
import { Overview } from './Overview';
import { EnquiriesManager } from './EnquiriesManager';
import { Students } from './Students';
import { Instructors } from './Instructors';
import { Courses } from './Courses';
import { CourseOffersManager } from './CourseOffers/CourseOffersManager';
import { ProductManager } from './ProductManager';
import { CategoryManager } from './CategoryManager';
import { InventoryManager } from './InventoryManager';
import { OrderManager } from './OrderManager';
import { Enrollments } from './Enrollments';
import { Payments } from './Payments';
import { BlogManager } from './BlogManager';
import { SettingsEditor } from './SettingsEditor';
import { DatabaseManager } from './DatabaseManager';
import { useAuth } from '../../context/AuthContext';

interface AdminPanelProps {
  section?: string;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ section: propSection }) => {
  const { section: paramSection } = useParams<{ section?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [createProductTrigger, setCreateProductTrigger] = useState(0);

  // Determine active section from props, route params, or URL path
  const currentSection = propSection || paramSection || (
    location.pathname.startsWith('/admin/') ? location.pathname.replace('/admin/', '').split('/')[0] : 'overview'
  );

  useEffect(() => {
    // Support create=true query param for product creation
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('create') === 'true') {
      setCreateProductTrigger((prev) => prev + 1);
    }
  }, [location.search]);

  // Backward compatibility: If accessed as `/admin#offers`, redirect to `/admin/offers`
  useEffect(() => {
    if (location.hash) {
      const hash = location.hash.replace('#', '').split('?')[0];
      const validSections: Record<string, string> = {
        dashboard: 'overview',
        overview: 'overview',
        enquiries: 'enquiries',
        students: 'students',
        instructors: 'instructors',
        courses: 'courses',
        offers: 'offers',
        products: 'products',
        categories: 'categories',
        inventory: 'inventory',
        orders: 'orders',
        enrollments: 'enrollments',
        payments: 'payments',
        blogs: 'blogs',
        settings: 'edit-site',
        'edit-site': 'edit-site',
        database: 'database'
      };
      if (validSections[hash]) {
        navigate(`/admin/${validSections[hash]}`, { replace: true });
      }
    }
  }, [location.hash, navigate]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <SEO title={`Admin Portal - ${currentSection.toUpperCase()} | JADMAA`} />

      {/* Render active section content */}
      <div className="min-w-0">
        {currentSection === 'overview' && (
          <Overview onSelectTab={(tab) => navigate(`/admin/${tab === 'dashboard' ? 'overview' : tab}`)} />
        )}
        {currentSection === 'enquiries' && <EnquiriesManager />}
        {currentSection === 'students' && <Students />}
        {currentSection === 'instructors' && <Instructors />}
        {currentSection === 'courses' && <Courses />}
        {currentSection === 'offers' && <CourseOffersManager />}
        {currentSection === 'products' && <ProductManager createTrigger={createProductTrigger} />}
        {currentSection === 'categories' && <CategoryManager />}
        {currentSection === 'inventory' && <InventoryManager />}
        {currentSection === 'orders' && <OrderManager />}
        {currentSection === 'enrollments' && <Enrollments />}
        {currentSection === 'payments' && <Payments />}
        {currentSection === 'blogs' && <BlogManager />}
        {(currentSection === 'edit-site' || currentSection === 'settings') && <SettingsEditor />}
        {currentSection === 'database' && user?.role === 'SUPER_ADMIN' && <DatabaseManager />}
      </div>
    </div>
  );
};
