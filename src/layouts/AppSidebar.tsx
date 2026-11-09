import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  ShoppingBag,
  Award,
  User,
  Users,
  Shield,
  Tag,
  Package,
  Layers,
  Inbox,
  CreditCard,
  FileText,
  Settings,
  Database,
  ExternalLink,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Compass
} from 'lucide-react';

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || 'STUDENT';

  // Navigation configuration per role
  const getNavSections = () => {
    switch (role) {
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return [
          {
            title: 'Core Operations',
            items: [
              { label: 'Overview', to: '/admin/overview', icon: LayoutDashboard },
              { label: 'Enquiries & Leads', to: '/admin/enquiries', icon: Inbox },
              { label: 'Students', to: '/admin/students', icon: Users },
              { label: 'Instructors', to: '/admin/instructors', icon: GraduationCap },
              { label: 'Courses', to: '/admin/courses', icon: BookOpen },
              { label: 'Campaign Offers', to: '/admin/offers', icon: Tag },
            ]
          },
          {
            title: 'E-Commerce & Store',
            items: [
              { label: 'Products', to: '/admin/products', icon: ShoppingBag },
              { label: 'Categories', to: '/admin/categories', icon: Layers },
              { label: 'Inventory & Stock', to: '/admin/inventory', icon: Package },
              { label: 'Product Orders', to: '/admin/orders', icon: Inbox },
            ]
          },
          {
            title: 'Finance & Content',
            items: [
              { label: 'Enrollments', to: '/admin/enrollments', icon: GraduationCap },
              { label: 'Payments', to: '/admin/payments', icon: CreditCard },
              { label: 'Blog Manager', to: '/admin/blogs', icon: FileText },
              { label: 'Edit Site', to: '/admin/edit-site', icon: Settings },
              ...(role === 'SUPER_ADMIN' ? [
                { label: 'Database Backup & Ops', to: '/admin/database', icon: Database, badge: 'SUPER' }
              ] : [])
            ]
          }
        ];

      case 'INSTRUCTOR':
        return [
          {
            title: 'Teaching Hub',
            items: [
              { label: 'Instructor Dashboard', to: '/instructor/dashboard', icon: LayoutDashboard },
              { label: 'My Courses', to: '/instructor/courses', icon: BookOpen },
              { label: 'Enrolled Students', to: '/instructor/students', icon: Users },
              { label: 'Browse Courses', to: '/student/courses', icon: Compass },
            ]
          },
          {
            title: 'Personal',
            items: [
              { label: 'Profile & Settings', to: '/student/settings', icon: User },
              { label: 'My Orders', to: '/student/orders', icon: ShoppingBag },
            ]
          }
        ];

      case 'STUDENT':
      default:
        return [
          {
            title: 'My Learning',
            items: [
              { label: 'Student Dashboard', to: '/student/dashboard', icon: LayoutDashboard },
              { label: 'My Enrolled Courses', to: '/student/my-courses', icon: BookOpen },
              { label: 'Browse Courses', to: '/student/courses', icon: Compass },
              { label: 'My Certificates', to: '/student/certificates', icon: Award },
            ]
          },
          {
            title: 'Account & Purchases',
            items: [
              { label: 'My Orders', to: '/student/orders', icon: ShoppingBag },
              { label: 'Profile & Settings', to: '/student/settings', icon: User },
            ]
          }
        ];
    }
  };

  const navSections = getNavSections();

  const handleLogout = async () => {
    onClose();
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Static Sidebar Container (Desktop: fixed static flex child 100vh; Mobile: fixed off-canvas drawer) */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[#FAF6F0] border-r border-[#E8DDD0] shadow-md flex flex-col h-screen
          lg:static lg:z-auto lg:h-full lg:w-64 lg:shrink-0 lg:shadow-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          transition-transform duration-200 ease-out lg:transition-none
        `}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[#E8DDD0] shrink-0 bg-white/70">
          <Link
            to={role === 'ADMIN' || role === 'SUPER_ADMIN' ? '/admin/overview' : role === 'INSTRUCTOR' ? '/instructor/dashboard' : '/student/dashboard'}
            onClick={onClose}
            className="flex items-center gap-2.5 overflow-hidden"
          >
            <div className="w-9 h-9 rounded-xl bg-[#B12B2B] text-white flex items-center justify-center font-heading font-extrabold text-lg shrink-0 shadow-sm">
              J
            </div>
            <div className="flex flex-col truncate">
              <span className="font-heading font-extrabold text-base text-[#2B2521] tracking-wide leading-tight truncate">
                JADMAA
              </span>
              <span className="text-[10px] font-bold text-[#B12B2B] uppercase tracking-wider truncate">
                {role.replace('_', ' ')} PORTAL
              </span>
            </div>
          </Link>

          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#5C5148] hover:bg-black/5 lg:hidden cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#5C5148]/70 mb-2">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      className={({ isActive }) => `
                        flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors group relative
                        ${isActive
                          ? 'bg-[#B12B2B] text-white shadow-sm font-bold'
                          : 'text-[#2B2521] hover:bg-white/80 hover:text-[#B12B2B]'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                      <span className="truncate flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded bg-amber-400/20 text-amber-800 border border-amber-300">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quick link to public site */}
          <div className="pt-2 border-t border-[#E8DDD0]">
            <Link
              to="/"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#5C5148] hover:bg-white/80 hover:text-[#2B2521] transition group"
              title="Return to Public Website"
            >
              <ExternalLink className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
              <span className="truncate">Public Website</span>
            </Link>
          </div>
        </nav>

        {/* User Card & Logout Footer */}
        <div className="p-3 border-t border-[#E8DDD0] bg-white/50 shrink-0">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-[#B12B2B]/10 text-[#B12B2B] flex items-center justify-center font-bold text-xs shrink-0 border border-[#B12B2B]/20">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover rounded-full" />
              ) : (
                (user?.name || 'U').charAt(0).toUpperCase()
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#2B2521] truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-[#5C5148] truncate">{user?.email}</p>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-[#5C5148] hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

