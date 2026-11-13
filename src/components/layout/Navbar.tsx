import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  Settings as SettingsIcon, 
  ChevronDown, 
  LayoutDashboard,
  Save,
  AlertTriangle,
  Check,
  Loader2,
  ShoppingBag,
  Search
} from 'lucide-react';
import { mainNavItems } from '../../data/navigation';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { ResponsiveImage } from '../common/ResponsiveImage';
import { useCart } from '../../context/CartContext';
import { CampaignAnnouncementBar } from './CampaignAnnouncementBar';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [editPromptOpen, setEditPromptOpen] = useState(false);
  const [editPromptText, setEditPromptText] = useState('');
  const [discardWarningOpen, setDiscardWarningOpen] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Searchbar overlay mode
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Close search overlay on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  // Helper to determine authenticated user destination
  const getAuthenticatedDashboardRoute = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      return '/admin/overview';
    }
    if (user.role === 'INSTRUCTOR') {
      return '/instructor/dashboard';
    }
    return '/student/dashboard';
  };

  const handleOpenSearch = () => {
    setIsOpen(false); // Close mobile drawer if open
    setIsSearchOpen(true);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInputValue.trim()) {
      setIsSearchOpen(false);
      navigate(`/search?q=${encodeURIComponent(searchInputValue.trim())}`);
    }
  };

  const { 
    isEditing, 
    isSaving, 
    hasUnsavedChanges, 
    pendingChangesCount, 
    saveAllChanges, 
    discardChanges, 
    exitEditMode,
    setIsEditing
  } = useSettings();
  const { totalItems, openCart } = useCart();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  let currentNavItems = mainNavItems;
  if (isLoggedIn && !isEditing) {
    if (user?.role === 'STUDENT') {
      currentNavItems = [
        { id: 'dashboard', label: 'Dashboard', href: '/student#dashboard' },
        { id: 'home', label: 'Home', href: '/' },
        { id: 'courses', label: 'Courses', href: '/courses' },
        { id: 'shop', label: 'Shop', href: '/products' },
        { id: 'my-courses', label: 'My Courses', href: '/student#my-courses' },
        { id: 'blogs', label: 'Blogs', href: '/blog' }
      ];
    } else if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
      currentNavItems = [
        { id: 'dashboard', label: 'Dashboard', href: '/admin#dashboard' },
        { id: 'products', label: 'Products', href: '/admin#products' },
        { id: 'orders', label: 'Orders', href: '/admin#orders' },
        { id: 'courses', label: 'Courses', href: '/admin#courses' },
        { id: 'shop', label: 'Shop', href: '/products' },
        { id: 'enquiries', label: 'Enquiries', href: '/admin#enquiries' },
        { id: 'students', label: 'My Students', href: '/admin#students' },
        { id: 'blogs', label: 'Blogs', href: '/blog' }
      ];
    } else if (user?.role === 'INSTRUCTOR') {
      currentNavItems = [
        { id: 'dashboard', label: 'Instructor Portal', href: '/instructor' },
        { id: 'home', label: 'Home', href: '/' },
        { id: 'courses', label: 'Courses', href: '/courses' },
        { id: 'shop', label: 'Shop', href: '/products' },
        { id: 'students', label: 'My Students', href: '/instructor#students' },
        { id: 'blogs', label: 'Blogs', href: '/blog' }
      ];
    }
  }


  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  // Close profile dropdown card when clicking outside or pressing Escape
  useEffect(() => {
    if (!profileOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileOpen]);

  const handleEditWebsiteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editPromptText.toLowerCase().trim() === 'edit website') {
      setEditPromptOpen(false);
      setEditPromptText('');
      sessionStorage.setItem('jadmaa_edit_mode', 'true');
      setIsEditing(true);
      const currentPath = window.location.pathname;
      window.location.href = `${currentPath}?edit=true`;
    } else {
      alert('Incorrect text. Please type "edit website".');
    }
  };

  const handleSaveClick = async () => {
    try {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      await saveAllChanges();
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 3000);
    } catch (err) {
      alert('Failed to save changes. Please make sure you are logged in as an administrator.');
    }
  };

  const handleExitClick = () => {
    if (hasUnsavedChanges) {
      setDiscardWarningOpen(true);
    } else {
      exitEditMode();
    }
  };

  const handleDiscardAndExit = () => {
    discardChanges();
    setDiscardWarningOpen(false);
    exitEditMode();
  };

  return (
    <>
    {isEditing && (
      <div className="bg-[#1C1714] text-white border-b border-[#3D332D] px-3 sm:px-6 py-2.5 z-[60] relative shadow-lg">
        <div className="max-w-[1500px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4">
          {/* Status info & unsaved count */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium flex-wrap justify-center sm:justify-start">
            <span className="inline-flex items-center gap-1.5 bg-[#B12B2B] px-2.5 py-0.5 rounded-full text-white font-bold text-[11px] sm:text-xs uppercase tracking-wider shadow-sm">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              Edit Mode
            </span>
            <span className="text-gray-300 hidden md:inline text-xs">
              Click any text on the page to edit.
            </span>
            {hasUnsavedChanges ? (
              <span className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                {pendingChangesCount} unsaved change{pendingChangesCount > 1 ? 's' : ''}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                <Check className="w-3.5 h-3.5 shrink-0" />
                All changes saved
              </span>
            )}
            {saveSuccessNotice && (
              <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full text-xs font-semibold animate-fade-in">
                <Check className="w-3.5 h-3.5 shrink-0" />
                Saved successfully!
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleSaveClick}
              disabled={!hasUnsavedChanges || isSaving}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${
                hasUnsavedChanges
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-95'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700/60'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>

            <button
              onClick={handleExitClick}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition border border-white/20 hover:border-white/40 active:scale-95"
            >
              <X className="w-3.5 h-3.5" />
              <span>Exit Edit Mode</span>
            </button>
          </div>
        </div>
      </div>
    )}
    <div className="sticky top-0 z-50 w-full">
      <CampaignAnnouncementBar />
      <header className={`w-full bg-[#FAF6F0] transition-all duration-200 border-b border-[#E8DDD0] ${
        scrolled ? 'shadow-md py-2 sm:py-2.5' : 'py-2.5 sm:py-3.5'
      }`}>
      {/* Full-Navbar Interactive Search Overlay with Smooth Slide-Down Animation */}
      {isSearchOpen ? (
        <div className="max-w-[1500px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 animate-search-slide-down">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2.5 sm:gap-3 h-11 sm:h-12 bg-white/70 sm:bg-transparent rounded-2xl px-2 sm:px-0">
            <div className="text-[#B12B2B] pl-1 shrink-0">
              <Search className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
            </div>

            <input
              ref={searchInputRef}
              type="text"
              value={searchInputValue}
              onChange={(e) => setSearchInputValue(e.target.value)}
              placeholder="Search courses, products, training programs, articles... (Press Enter)"
              className="flex-1 bg-transparent border-0 text-xs sm:text-base font-medium text-[#2B2521] placeholder-[#5C5148]/60 focus:outline-none min-w-0"
            />

            {searchInputValue && (
              <button
                type="button"
                onClick={() => setSearchInputValue('')}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition shrink-0"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              className="px-3.5 sm:px-5 py-1.5 sm:py-2 bg-[#B12B2B] hover:bg-[#8F2020] text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-xs cursor-pointer shrink-0"
            >
              Search
            </button>

            <button
              type="button"
              onClick={() => setIsSearchOpen(false)}
              className="p-1.5 sm:p-2 rounded-xl text-[#5C5148] hover:text-[#2B2521] hover:bg-black/5 transition cursor-pointer shrink-0"
              title="Close search (Esc)"
              aria-label="Close search"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </form>
        </div>
      ) : (
      <div className="max-w-[1500px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12">
        <div className="flex items-center justify-between">
          
          {/* Logo & Brand Name */}
          <Link to="/" className="flex items-center space-x-2 sm:space-x-3 group min-w-0 pr-1 sm:pr-2">
            <ResponsiveImage 
              src="/images/logo-1.png" 
              alt="JADMAA Varmakalai Logo" 
              priority={true}
              width={48}
              height={48}
              aspectRatio="1/1"
              className="h-[40px] sm:h-12 w-auto object-contain shrink-0"
            />
            {/* Mobile Brand Name: Stacked "Jadmaa" / "varmakalai" */}
            <span className="flex flex-col sm:hidden font-heading font-bold leading-none select-none">
              <span className="text-[16px] text-[#2B2521] tracking-tight leading-none">
                Jadmaa
              </span>
              <span className="text-[13px] text-[#B12B2B] tracking-tight leading-none mt-0.5">
                varmakalai
              </span>
            </span>

            {/* Desktop Brand Name */}
            <span className="hidden sm:inline font-heading font-bold text-[20px] text-[#2B2521] tracking-[0.5px] leading-tight truncate">
              JADMAA <span className="text-[#B12B2B]">VARMAKALAI</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {currentNavItems.map((item) => {
              const fullPath = location.pathname + location.hash;
              const isActive = fullPath === item.href || (location.pathname === item.href && !item.href.includes('#'));
              return (
                <Link
                  key={item.id}
                  to={item.href}
              onClick={() => setIsOpen(false)}
                  className={`font-body text-[15px] font-medium tracking-normal px-3.5 py-2 transition-colors duration-150 relative ${
                    isActive 
                      ? 'text-[#B12B2B] after:absolute after:bottom-1 after:left-3.5 after:right-3.5 after:h-[2px] after:bg-[#B12B2B]' 
                      : 'text-[#2B2521] hover:text-[#B12B2B]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            {/* Action Icons Trio: Search | User Account | Shopping Bag */}
            <div className="flex items-center space-x-1 lg:space-x-1.5 ml-2">
              {/* 1. Search Icon Button */}
              <button
                onClick={handleOpenSearch}
                className="p-1.5 lg:p-2 text-[#2B2521] hover:text-[#B12B2B] transition-colors rounded-lg hover:bg-black/5 cursor-pointer flex items-center justify-center"
                title="Search academy, courses, products"
                aria-label="Open search bar"
              >
                <Search className="w-5 h-5 stroke-[1.75]" />
              </button>

              {/* 2. User Account / Profile Icon */}
              {isLoggedIn ? (
                <div ref={profileRef} className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="p-1.5 lg:p-2 text-[#2B2521] hover:text-[#B12B2B] transition-colors rounded-lg hover:bg-black/5 cursor-pointer flex items-center justify-center"
                    title={user?.name ? `Account: ${user.name}` : "User Account"}
                    aria-label="User Account"
                  >
                    <User className="w-5 h-5 stroke-[1.75]" />
                  </button>
                  
                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 p-4 z-50 animate-fade-in text-left">
                      <div className="mb-3 pb-3 border-b border-gray-100">
                        <p className="text-sm font-bold text-gray-800 truncate">{user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-xs font-bold text-gray-600 rounded">
                          {user?.role}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <Link
                          to={getAuthenticatedDashboardRoute()}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center space-x-2 w-full px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-jadmaa-red rounded-lg transition"
                        >
                          <LayoutDashboard className="w-4 h-4 stroke-[1.75]" />
                          <span>Dashboard</span>
                        </Link>

                        {(user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") ? (
                          <button
                            onClick={() => {
                              setProfileOpen(false);
                              setEditPromptOpen(true);
                            }}
                            className="flex items-center space-x-2 w-full px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-jadmaa-red rounded-lg transition"
                          >
                            <SettingsIcon className="w-4 h-4 stroke-[1.75]" />
                            <span>Edit Website</span>
                          </button>
                        ) : (
                          <Link
                            to="/student/settings"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center space-x-2 w-full px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-jadmaa-red rounded-lg transition"
                          >
                            <SettingsIcon className="w-4 h-4 stroke-[1.75]" />
                            <span>Edit Profile</span>
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            setProfileOpen(false);
                            logout();
                          }}
                          className="flex items-center space-x-2 w-full px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-jadmaa-red rounded-lg transition"
                        >
                          <LogOut className="w-4 h-4 stroke-[1.75]" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="p-1.5 lg:p-2 text-[#2B2521] hover:text-[#B12B2B] transition-colors rounded-lg hover:bg-black/5 cursor-pointer flex items-center justify-center"
                  title="Sign In / Register"
                  aria-label="Login"
                >
                  <User className="w-5 h-5 stroke-[1.75]" />
                </Link>
              )}

              {/* 3. Shopping Bag Icon */}
              <Link
                to="/cart"
                onClick={(e) => {
                  if (openCart) {
                    e.preventDefault();
                    openCart();
                  }
                }}
                className="relative p-1.5 lg:p-2 text-[#2B2521] hover:text-[#B12B2B] transition-colors rounded-lg hover:bg-black/5 cursor-pointer flex items-center justify-center"
                title="Shopping Bag"
                aria-label="Shopping Bag"
              >
                <ShoppingBag className="w-5 h-5 stroke-[1.75]" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#B12B2B] text-white text-[10px] font-extrabold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-sm">
                    {totalItems}
                  </span>
                )}
              </Link>
            </div>
          </nav>

          {/* Mobile Actions: Search + User + Shopping Bag + Hamburger */}
          <div className="flex items-center space-x-0.5 min-[360px]:space-x-1 sm:space-x-1.5 md:hidden shrink-0">
            {/* Mobile Search Button */}
            <button
              onClick={handleOpenSearch}
              className="p-1.5 text-[#2B2521] hover:text-[#B12B2B] transition-colors rounded-lg hover:bg-black/5 cursor-pointer flex items-center justify-center"
              title="Search"
              aria-label="Search"
            >
              <Search className="w-5 h-5 stroke-[1.75]" />
            </button>

            {/* Mobile User Profile Button */}
            <Link
              to={isLoggedIn ? getAuthenticatedDashboardRoute() : '/login'}
              className="p-1.5 text-[#2B2521] hover:text-[#B12B2B] transition-colors rounded-lg hover:bg-black/5 cursor-pointer flex items-center justify-center"
              title={isLoggedIn ? "Dashboard" : "Login"}
              aria-label="Account"
            >
              <User className="w-5 h-5 stroke-[1.75]" />
            </Link>

            {/* Mobile Shopping Bag Button */}
            <Link
              to="/cart"
              onClick={(e) => {
                if (openCart) {
                  e.preventDefault();
                  openCart();
                }
              }}
              className="relative p-1.5 text-[#2B2521] hover:text-[#B12B2B] transition-colors rounded-lg hover:bg-black/5 cursor-pointer flex items-center justify-center"
              title="Shopping Bag"
              aria-label="Shopping Bag"
            >
              <ShoppingBag className="w-5 h-5 stroke-[1.75]" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#B12B2B] text-white text-[10px] font-extrabold min-w-[16px] h-[16px] px-0.5 rounded-full flex items-center justify-center shadow-sm">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Hamburger Toggle Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 min-h-[44px] min-w-[44px] rounded-lg text-[#2B2521] hover:text-[#B12B2B] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Toggle Menu"
            >
              {isOpen ? <X className="w-6 h-6 stroke-[1.75]" /> : <Menu className="w-6 h-6 stroke-[1.75]" />}
            </button>
          </div>

        </div>
      </div>
      )}

      {/* Mobile Slide-Over Drawer with Darkened Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Body */}
          <div className="fixed top-0 bottom-0 right-0 w-[84vw] max-w-xs bg-[#FAF6F0] shadow-2xl z-50 flex flex-col overflow-y-auto max-h-[100dvh] pb-safe animate-drawer text-left">
            {/* Drawer Header */}
            <div className="h-16 px-5 border-b border-[#E8DDD0] flex items-center justify-between bg-white shrink-0">
              <span className="font-heading font-extrabold text-base text-[#2B2521] tracking-wide">
                JADMAA Academy
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 min-h-[44px] min-w-[44px] text-[#5C5148] hover:text-[#B12B2B] rounded-lg flex items-center justify-center cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
              {currentNavItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[#2B2521] hover:bg-white/80 hover:text-[#B12B2B] transition"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Quick Actions & Auth Footer */}
            <div className="p-4 border-t border-[#E8DDD0] bg-white space-y-2 shrink-0">
              {isLoggedIn ? (
                <>
                  <Link
                    to={getAuthenticatedDashboardRoute()}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center min-h-[44px] w-full py-2.5 bg-[#B12B2B] hover:bg-[#8F2020] text-white text-sm font-bold rounded-xl transition shadow-xs"
                  >
                    Go to Portal Dashboard
                  </Link>

                  {(user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") && (
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        setEditPromptOpen(true);
                      }}
                      className="flex items-center justify-center gap-2 min-h-[44px] w-full py-2 border border-[#B12B2B] text-[#B12B2B] hover:bg-[#B12B2B]/5 text-sm font-bold rounded-xl transition cursor-pointer"
                    >
                      <SettingsIcon className="w-4 h-4" />
                      <span>Edit Website</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      logout();
                    }}
                    className="flex items-center justify-center min-h-[44px] w-full py-2 text-xs font-bold text-[#5C5148] hover:text-[#B12B2B] transition cursor-pointer"
                  >
                    Sign Out ({user?.name || 'Account'})
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center min-h-[44px] w-full py-2.5 bg-[#B12B2B] hover:bg-[#8F2020] text-white text-sm font-bold rounded-xl transition shadow-xs"
                  >
                    Login / Register
                  </Link>
                  <Link
                    to="/contact"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center min-h-[44px] w-full py-2 text-xs font-bold text-[#5C5148] hover:text-[#B12B2B] transition"
                  >
                    Need Help? Contact Support
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
    </div>

    {/* Edit Website Prompt Modal */}
    {editPromptOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl relative text-left">
          <button onClick={() => setEditPromptOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">Enable Edit Mode</h3>
          <p className="text-sm text-gray-600 mb-4">You are about to enter visual editing mode for the entire website. This will allow you to click on text and change it live.</p>
          <form onSubmit={handleEditWebsiteSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Please type <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-jadmaa-red">edit website</span> to confirm:
              </label>
              <input
                type="text"
                autoFocus
                value={editPromptText}
                onChange={e => setEditPromptText(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-jadmaa-red"
                placeholder="edit website"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-jadmaa-red hover:bg-red-800 text-white font-bold py-2 rounded-lg transition-colors"
            >
              Confirm
            </button>
          </form>
        </div>
      </div>
    )}

    {/* Discard Changes Warning Modal */}
    {discardWarningOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-left border border-gray-100">
          <button 
            onClick={() => setDiscardWarningOpen(false)} 
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">
            Discard Unsaved Changes?
          </h3>
          
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            You have <strong className="text-gray-900">{pendingChangesCount} unsaved edit{pendingChangesCount > 1 ? 's' : ''}</strong>. 
            Exiting now will discard these changes without saving. Do you want to discard your changes or stay in edit website mode?
          </p>

          <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:justify-end">
            <button
              type="button"
              onClick={() => setDiscardWarningOpen(false)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold text-sm transition"
            >
              Cancel (Stay in Edit Mode)
            </button>
            <button
              type="button"
              onClick={handleDiscardAndExit}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#B12B2B] hover:bg-red-800 text-white font-semibold text-sm transition shadow-sm"
            >
              Discard Changes & Exit
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};
