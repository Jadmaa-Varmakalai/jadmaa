import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';

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

// Lazily loaded Auth Pages
const Login = lazy(() => import('../pages/Auth/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('../pages/Auth/Register').then(m => ({ default: m.Register })));
const ForgotPassword = lazy(() => import('../pages/Auth/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('../pages/Auth/ResetPassword').then(m => ({ default: m.ResetPassword })));

// Lazily loaded heavy LMS Pages
const LearnCourse = lazy(() => import('../pages/Dashboard/LearnCourse').then(m => ({ default: m.LearnCourse })));
const CertificatesPage = lazy(() => import('../pages/Dashboard/CertificatesPage').then(m => ({ default: m.CertificatesPage })));
const PaymentStatus = lazy(() => import('../pages/Dashboard/PaymentStatus').then(m => ({ default: m.PaymentStatus })));
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

export const AppRoutes: React.FC = () => {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Main Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:slug" element={<CourseDetails />} />
          <Route path="/offers/:slug" element={<OfferLandingPage />} />
          <Route path="/campaign/:slug" element={<OfferLandingPage />} />
          
          {/* Store & E-Commerce Routes */}
          <Route path="/products" element={<Products />} />
          <Route path="/shop" element={<Navigate to="/products" replace />} />
          <Route path="/store" element={<Navigate to="/products" replace />} />
          <Route path="/products/:slug" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success/:orderNumber" element={<OrderSuccess />} />
          <Route path="/orders" element={<Navigate to="/student#orders" replace />} />
          <Route path="/my-orders" element={<Navigate to="/student#orders" replace />} />

          <Route path="/contact" element={<Contact />} />
          <Route path="/careers" element={<Navigate to="/about" replace />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPostDetail />} />

          {/* Legal Compliance Routes */}
          <Route path="/privacy-policy" element={<LegalPage />} />
          <Route path="/terms" element={<LegalPage />} />
          <Route path="/terms-and-conditions" element={<Navigate to="/terms" replace />} />
          <Route path="/refund-policy" element={<LegalPage />} />

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* LMS Routes */}
          <Route path="/dashboard" element={<Navigate to="/student" replace />} />
          <Route path="/student" element={<StudentPanel />} />
          <Route path="/my-courses" element={<Navigate to="/student#my-courses" replace />} />
          <Route path="/profile" element={<Navigate to="/student#settings" replace />} />
          <Route path="/my-profile" element={<Navigate to="/student#settings" replace />} />
          <Route path="/settings" element={<Navigate to="/student#settings" replace />} />
          <Route path="/student/profile" element={<Navigate to="/student#settings" replace />} />
          <Route path="/student/settings" element={<Navigate to="/student#settings" replace />} />
          <Route path="/student/courses" element={<Navigate to="/student#courses" replace />} />
          <Route path="/student/my-courses" element={<Navigate to="/student#my-courses" replace />} />
          <Route path="/dashboard/settings" element={<Navigate to="/student#settings" replace />} />
          <Route path="/dashboard/my-courses" element={<Navigate to="/student#my-courses" replace />} />
          <Route path="/dashboard/courses" element={<Navigate to="/student#courses" replace />} />
          <Route path="/learn/:courseId" element={<LearnCourse />} />
          <Route path="/certificates" element={<CertificatesPage />} />
          <Route path="/payment/status/:merchantOrderId" element={<PaymentStatus />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/instructor" element={<InstructorPanel />} />

          {/* Fallback */}
          <Route path="*" element={<Home />} />
        </Routes>
      </Suspense>
    </>
  );
};
