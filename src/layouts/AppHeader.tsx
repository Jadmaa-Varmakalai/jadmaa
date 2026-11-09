import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, LogOut, ChevronRight, ExternalLink } from 'lucide-react';

interface AppHeaderProps {
  onOpenSidebar: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onOpenSidebar }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Generate dynamic breadcrumb from pathname
  const pathParts = location.pathname.split('/').filter(Boolean);
  
  const formatBreadcrumb = (part: string) => {
    return part
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-[#E8DDD0] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left: Mobile Menu Trigger + Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onOpenSidebar}
          className="p-2.5 -ml-2 rounded-xl text-[#2B2521] hover:bg-[#FAF6F0] transition lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5 stroke-[2]" />
        </button>

        {/* Mobile Page Title (< 640px) */}
        <span className="font-heading font-extrabold text-sm text-[#2B2521] truncate sm:hidden">
          {formatBreadcrumb(pathParts[pathParts.length - 1] || 'Dashboard')}
        </span>

        {/* Desktop Breadcrumb Navigation (>= 640px) */}
        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs text-[#5C5148] min-w-0">
          <Link
            to={user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? '/admin/overview' : user?.role === 'INSTRUCTOR' ? '/instructor/dashboard' : '/student/dashboard'}
            className="font-bold text-[#B12B2B] hover:underline shrink-0"
          >
            Portal
          </Link>
          {pathParts.map((part, index) => {
            const isLast = index === pathParts.length - 1;
            const fullPath = `/${pathParts.slice(0, index + 1).join('/')}`;
            return (
              <React.Fragment key={fullPath}>
                <ChevronRight className="w-3.5 h-3.5 text-[#5C5148]/50 shrink-0" />
                {isLast ? (
                  <span className="font-semibold text-[#2B2521] truncate max-w-[140px] md:max-w-[200px]">
                    {formatBreadcrumb(part)}
                  </span>
                ) : (
                  <Link to={fullPath} className="hover:text-[#B12B2B] truncate hidden md:inline">
                    {formatBreadcrumb(part)}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Right: Quick actions + User profile badge */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Public Website Shortcut */}
        <Link
          to="/"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-[#5C5148] hover:text-[#B12B2B] px-3 py-1.5 rounded-xl border border-[#E8DDD0] hover:bg-[#FAF6F0] transition"
          title="Visit public website"
        >
          <span>Website</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        {/* Role Tag */}
        <span className="hidden md:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#B12B2B]/10 text-[#B12B2B] border border-[#B12B2B]/20">
          {user?.role?.replace('_', ' ') || 'STUDENT'}
        </span>

        {/* Profile Avatar & Name */}
        <Link
          to="/student/settings"
          className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[#FAF6F0] transition group"
          title="Profile & Settings"
        >
          <div className="w-8 h-8 rounded-full bg-[#B12B2B] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
            {(user?.avatarUrl || user?.avatar) ? (
              <img src={user.avatarUrl || user.avatar} alt={user.name} className="w-full h-full object-cover rounded-full" />
            ) : (
              (user?.name || 'U').charAt(0).toUpperCase()
            )}
          </div>
          <span className="text-xs font-bold text-[#2B2521] hidden lg:inline truncate max-w-[120px]">
            {user?.name?.split(' ')[0] || 'Account'}
          </span>
        </Link>

        {/* Mobile-accessible Logout */}
        <button
          onClick={handleLogout}
          className="p-2 rounded-xl text-[#5C5148] hover:text-red-600 hover:bg-red-50 transition sm:hidden"
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

