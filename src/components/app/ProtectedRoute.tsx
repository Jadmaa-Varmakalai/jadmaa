import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert } from 'lucide-react';
import type { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoggedIn, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-[#B12B2B]/20 border-t-[#B12B2B] rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-[#5C5148]">Verifying session...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = (user?.role || 'STUDENT') as UserRole;
    
    // SUPER_ADMIN has access to everything allowed to ADMIN
    const hasRole = allowedRoles.includes(userRole) || 
      (userRole === 'SUPER_ADMIN' && allowedRoles.includes('ADMIN'));

    if (!hasRole) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8DDD0] rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-sm">
            <div className="w-14 h-14 bg-red-50 text-[#B12B2B] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="font-heading font-extrabold text-2xl text-[#2B2521] mb-2">Access Denied</h2>
            <p className="text-xs sm:text-sm text-[#5C5148] mb-6">
              You do not have permission to access this area. Required role: {allowedRoles.join(' or ')}.
            </p>
            <button
              onClick={() => window.history.back()}
              className="w-full py-2.5 px-4 bg-[#B12B2B] hover:bg-[#8F2020] text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

