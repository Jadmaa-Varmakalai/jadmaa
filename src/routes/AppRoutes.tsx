import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/app/ProtectedRoute';
import { AppLayout } from '../layouts/AppLayout';

// Eagerly loaded for instantaneous first paint & LCP
import { Home } from '../pages/Home';

// Lazily loaded public & marketing pages
const About = lazy(() => import('../pages/About').then(m => ({ default: m.About })));
const Courses = lazy(() => import('../pages/Courses').then(m => ({ default: m.Courses })));
const CourseDetails = lazy(() => import('../pages/CourseDetails').then(m => ({ default: m.CourseDetails })));
const OfferLandingPage = lazy(() => import('../pages/Offers/OfferLandingPage').then(m => ({ default: m.OfferLandingPage })));
const Contact = lazy(() => import('../pages/Contact').then(m => ({ default: m.Contact })));
const Blog = lazy(() => import('../pages/Blog').then(m => ({ default: m.Blog })));
const BlogPostDetail = lazy(() => import('../pages/BlogPostDetail').then(m => ({ default: m.BlogPostDetail })));
const LegalPage = lazy(() => import('../pages/LegalPage').then(m => ({ default: m.LegalPage })));

// Lazily loaded Store & E-Commerce
const Products = lazy(() => import('../pages/Shop/Products').then(m => ({ default: m.Products })));
const ProductDetails = lazy(() => import('../pages/Shop/ProductDetails').then(m => ({ default: m.ProductDetails })));
const Cart = lazy(() => import('../pages/Shop/Cart').then(m => ({ default: m.Cart })));
const Checkout = lazy(() => import('../pages/Shop/Checkout').then(m => ({ default: m.Checkout })));
const OrderSuccess = lazy(() => import('../pages/Shop/OrderSuccess').then(m => ({ default: m.OrderSuccess })));
const SearchResultsPage = lazy(() => import('../pages/Search/SearchResultsPage').then(m => ({ default: m.SearchResultsPage })));

// Lazily loaded Auth Pages
const Login = lazy(() => import('../pages/Auth/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('../pages/Auth/Register').then(m => ({ default: m.Register })));
const ForgotPassword = lazy(() => import('../pages/Auth/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('../pages/Auth/ResetPassword').then(m => ({ default: m.ResetPassword })));

// Lazily loaded Learning & Status Pages
const LearnCourse = lazy(() => import('../pages/Dashboard/LearnCourse').then(m => ({ default: m.LearnCourse })));
const PaymentStatus = lazy(() => import('../pages/Dashboard/PaymentStatus').then(m => ({ default: m.PaymentStatus })));

// Lazily loaded Authenticated Panels & Hub Pages
const AdminPanel = lazy(() => import('../pages/Admin/AdminPanel').then(m => ({ default: m.AdminPanel })));
const InstructorPanel = lazy(() => import('../pages/Instructor/InstructorPanel').then(m => ({ default: m.InstructorPanel })));
const StudentPanel = lazy(() => import('../pages/Dashboard/StudentPanel').then(m => ({ default: m.StudentPanel })));

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Minimal loading indicator matching JADMAA visual design language
const PageLoader: React.FC = () => (
  <div className="min-h-[60vh] flex items-center justify-center bg-[#FAF6F0]" role="status" aria-label="Loading page">
    <div className="w-9 h-9 rounded-full border-3 border-[#B12B2B]/20 border-t-[#B12B2B] animate-spin" />
  </div>
);

// Intelligent admin root redirect preserving tab hash and search query params
const AdminRootRedirect: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const hash = location.hash.replace('#', '').split('?')[0].toLowerCase();
  const param = (searchParams.get('tab') || searchParams.get('section') || '').toLowerCase();
  const validSections: Record<string, string> = {
    overview: 'overview',
    dashboard: 'overview',
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
    blog: 'blogs',
    settings: 'edit-site',
    'edit-site': 'edit-site',
    database: 'database'
  };
  const target = validSections[hash] || validSections[param] || 'overview';
  return <Navigate to={`/admin/${target}${location.search}`} replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ============================================================ */}
          {/* PUBLIC & MARKETING ROUTES (100% UNTOUCHED DESIGN)            */}
          {/* ============================================================ */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:slug" element={<CourseDetails />} />
          <Route path="/course/:slug" element={<CourseDetails />} />
          <Route path="/offers/:slug" element={<OfferLandingPage />} />
          <Route path="/campaign/:slug" element={<OfferLandingPage />} />
          <Route path="/treatments/:slug" element={<OfferLandingPage />} />
          <Route path="/services/:slug" element={<OfferLandingPage />} />
          
          {/* Store & E-Commerce */}
          <Route path="/products" element={<Products />} />
          <Route path="/shop" element={<Navigate to="/products" replace />} />
          <Route path="/store" element={<Navigate to="/products" replace />} />
          <Route path="/products/:slug" element={<ProductDetails />} />
          <Route path="/product/:slug" element={<ProductDetails />} />
          <Route path="/shop/product/:slug" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success/:orderNumber" element={<OrderSuccess />} />
          <Route path="/orders" element={<Navigate to="/student/orders" replace />} />
          <Route path="/my-orders" element={<Navigate to="/student/orders" replace />} />

          <Route path="/contact" element={<Contact />} />
          <Route path="/careers" element={<Navigate to="/about" replace />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blogs" element={<Navigate to="/admin/blogs" replace />} />
          <Route path="/blog/:slug" element={<BlogPostDetail />} />

          {/* Legal Compliance */}
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/privacy-policy" element={<LegalPage />} />
          <Route path="/terms" element={<LegalPage />} />
          <Route path="/terms-and-conditions" element={<Navigate to="/terms" replace />} />
          <Route path="/refund-policy" element={<LegalPage />} />

          {/* Auth Pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Learning Player (Fullscreen specialized player) */}
          <Route path="/learn/:courseId" element={<LearnCourse />} />
          <Route path="/payment/status/:merchantOrderId" element={<PaymentStatus />} />

          {/* Legacy root redirects to new authenticated routes */}
          <Route path="/dashboard" element={<Navigate to="/student/dashboard" replace />} />
          <Route path="/my-courses" element={<Navigate to="/student/my-courses" replace />} />
          <Route path="/profile" element={<Navigate to="/student/settings" replace />} />
          <Route path="/my-profile" element={<Navigate to="/student/settings" replace />} />
          <Route path="/settings" element={<Navigate to="/student/settings" replace />} />
          <Route path="/certificates" element={<Navigate to="/student/certificates" replace />} />
          <Route path="/dashboard/settings" element={<Navigate to="/student/settings" replace />} />
          <Route path="/dashboard/my-courses" element={<Navigate to="/student/my-courses" replace />} />
          <Route path="/dashboard/courses" element={<Navigate to="/student/courses" replace />} />

          {/* ============================================================ */}
          {/* AUTHENTICATED STUDENT ROUTES (Wrapped in AppLayout)          */}
          {/* ============================================================ */}
          <Route path="/student" element={
            <ProtectedRoute allowedRoles={['STUDENT', 'INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN']}>
              <AppLayout><StudentPanel section="dashboard" /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/student/dashboard" element={
            <ProtectedRoute allowedRoles={['STUDENT', 'INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN']}>
              <AppLayout><StudentPanel section="dashboard" /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/student/my-courses" element={
            <ProtectedRoute allowedRoles={['STUDENT', 'INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN']}>
              <AppLayout><StudentPanel section="my-courses" /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/student/courses" element={
            <ProtectedRoute allowedRoles={['STUDENT', 'INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN']}>
              <AppLayout><StudentPanel section="courses" /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/student/orders" element={
            <ProtectedRoute allowedRoles={['STUDENT', 'INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN']}>
              <AppLayout><StudentPanel section="orders" /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/student/settings" element={
            <ProtectedRoute allowedRoles={['STUDENT', 'INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN']}>
              <AppLayout><StudentPanel section="settings" /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/student/profile" element={<Navigate to="/student/settings" replace />} />
          <Route path="/student/certificates" element={
            <ProtectedRoute allowedRoles={['STUDENT', 'INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN']}>
              <AppLayout><StudentPanel section="certificates" /></AppLayout>
            </ProtectedRoute>
          } />

          {/* ============================================================ */}
          {/* AUTHENTICATED INSTRUCTOR ROUTES (Wrapped in AppLayout)       */}
          {/* ============================================================ */}
          <Route path="/instructor" element={
            <ProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN']}>
              <Navigate to="/instructor/dashboard" replace />
            </ProtectedRoute>
          } />
          <Route path="/instructor/dashboard" element={
            <ProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN']}>
              <AppLayout><InstructorPanel section="dashboard" /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/instructor/courses" element={
            <ProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN']}>
              <AppLayout><InstructorPanel section="courses" /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/instructor/students" element={
            <ProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN']}>
              <AppLayout><InstructorPanel section="students" /></AppLayout>
            </ProtectedRoute>
          } />

          {/* ============================================================ */}
          {/* AUTHENTICATED ADMIN & SUPER_ADMIN ROUTES (Wrapped in AppLayout)*/}
          {/* ============================================================ */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
              <AdminRootRedirect />
            </ProtectedRoute>
          } />
          <Route path="/admin/overview" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
              <AppLayout><AdminPanel section="overview" /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/enquiries" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
              <AppLayout><AdminPanel section="enquiries" /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/students" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
              <AppLayout><AdminPanel section="students" /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/instructors" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
              <AppLayout><AdminPanel section="instructors" /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/courses" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
              <AppLayout><AdminPanel section="courses" /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/offers" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
              <AppLayout><AdminPanel section="offers" /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/products" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
              <AppLayout><AdminPanel section="products" /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/categories" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
              <AppLayout><AdminPanel section="categories" /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/inventory" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
              <AppLayout><AdminPanel section="inventory" /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/orders" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
              <AppLayout><AdminPanel section="orders" /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/enrollments" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
              <AppLayout><AdminPanel section="enrollments" /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/payments" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
              <AppLayout><AdminPanel section="payments" /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/blogs" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
              <AppLayout><AdminPanel section="blogs" /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/edit-site" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
              <AppLayout><AdminPanel section="edit-site" /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={<Navigate to="/admin/edit-site" replace />} />
          
          {/* SUPER_ADMIN ONLY ROUTE: Database Management */}
          <Route path="/admin/database" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
              <AppLayout><AdminPanel section="database" /></AppLayout>
            </ProtectedRoute>
          } />

          {/* Catch-all Fallback */}
          <Route path="*" element={<Home />} />
        </Routes>
      </Suspense>
    </>
  );
};
