import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  ShoppingBag
} from 'lucide-react';
import { mainNavItems } from '../../data/navigation';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useCart } from '../../context/CartContext';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { user, isLoggedIn, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [editPromptOpen, setEditPromptOpen] = useState(false);
  const [editPromptText, setEditPromptText] = useState('');
  const [discardWarningOpen, setDiscardWarningOpen] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

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
  }, [location.pathname]);

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
    <header className={`sticky top-0 z-50 bg-[#FAF6F0] transition-shadow duration-200 border-b border-[#E8DDD0] ${
      scrolled ? 'shadow-sm py-2 sm:py-3' : 'py-2.5 sm:py-4'
    }`}>
      <div className="max-w-[1500px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12">
        <div className="flex items-center justify-between">
          
          {/* Logo & Brand Name */}
          <Link to="/" className="flex items-center space-x-2 sm:space-x-3 group min-w-0 pr-2">
            <img 
              src="/images/logo-1.png" 
              alt="JADMAA Varmakalai Logo" 
              className="h-[42px] sm:h-12 w-auto object-contain shrink-0"
            />
            <span className="font-heading font-semibold text-[13px] sm:text-[18px] text-[#2B2521] tracking-[0.5px] leading-[1.3125rem] truncate">
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

            {/* Auth / Profile Links */}
            {isLoggedIn ? (
              <div className="relative ml-2">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center space-x-1.5 font-body text-[15px] font-medium text-[#2B2521] hover:text-[#B12B2B] transition px-3 py-2"
                >
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 p-4 z-50 animate-fade-in">
                    <div className="mb-3 pb-3 border-b border-gray-100">
                      <p className="text-sm font-bold text-gray-800 truncate">{user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-xs font-bold text-gray-600 rounded">
                        {user?.role}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <Link
                        to={user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" ? "/admin" : user?.role === "INSTRUCTOR" ? "/instructor" : "/student"}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center space-x-2 w-full px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-jadmaa-red rounded-lg transition"
                      >
                        <LayoutDashboard className="w-4 h-4" />
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
                          <SettingsIcon className="w-4 h-4" />
                          <span>Edit Website</span>
                        </button>
                      ) : (
                        <Link
                          to={user?.role === "INSTRUCTOR" ? "/instructor#settings" : "/student#settings"}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center space-x-2 w-full px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-jadmaa-red rounded-lg transition"
                        >
                          <SettingsIcon className="w-4 h-4" />
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
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center ml-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-[14px] font-semibold text-white bg-[#B12B2B] hover:bg-[#8F2020] rounded-lg transition-colors tracking-wide"
                >
                  Login / Register
                </Link>
              </div>
            )}

            {/* Cart Button (Disabled for Admins) */}
            {!isAdmin && (
              <button
                onClick={openCart}
                className="relative p-2 text-[#2B2521] hover:text-[#B12B2B] transition-colors rounded-lg hover:bg-black/5 cursor-pointer flex items-center justify-center ml-2"
                title="Shopping Cart"
                aria-label="Shopping Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#B12B2B] text-white text-[10px] font-extrabold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-sm">
                    {totalItems}
                  </span>
                )}
              </button>
            )}
          </nav>

          {/* Mobile Actions: Cart + Login + Hamburger */}
          <div className="flex items-center space-x-2 md:hidden shrink-0">
            {!isAdmin && (
              <button
                onClick={openCart}
                className="relative p-1.5 text-[#2B2521] hover:text-[#B12B2B] transition-colors cursor-pointer"
                title="Shopping Cart"
                aria-label="Shopping Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#B12B2B] text-white text-[10px] font-extrabold min-w-[16px] h-[16px] px-0.5 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
            )}
            {isLoggedIn ? (
              <Link
                to={user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" ? "/admin" : user?.role === "INSTRUCTOR" ? "/instructor" : "/student"}
                className="px-3 py-1.5 text-[14px] font-semibold text-white bg-[#B12B2B] hover:bg-[#8F2020] rounded-lg transition-colors"
              >
                Profile
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1.5 text-[14px] font-semibold text-white bg-[#B12B2B] hover:bg-[#8F2020] rounded-lg transition-colors leading-none inline-flex items-center justify-center"
              >
                Login
              </Link>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1.5 rounded-lg text-[#2B2521] hover:text-[#B12B2B] flex items-center justify-center transition-colors"
              aria-label="Toggle Menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden bg-[#FAF6F0] border-t border-[#E8DDD0] shadow-xl px-4 py-4 space-y-2 text-left animate-drawer">
          {currentNavItems.map((item) => (
            <Link
              key={item.id}
              to={item.href}
              className="block px-3 py-2 text-sm font-semibold text-[#5C5148] hover:text-[#B12B2B]"
            >
              {item.label}
            </Link>
          ))}

          <div className="pt-3 border-t border-[#E8DDD0] space-y-2">
            {isLoggedIn ? (
              <>
                <Link
                  to={user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" ? "/admin" : user?.role === "INSTRUCTOR" ? "/instructor" : "/student"}
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center py-2 bg-[#B12B2B] text-white text-sm font-bold rounded"
                >
                  My Profile
                </Link>

                {(user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") && (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setEditPromptOpen(true);
                    }}
                    className="flex items-center justify-center space-x-2 w-full py-2 border border-[#B12B2B] text-[#B12B2B] hover:bg-[#B12B2B]/5 text-sm font-bold rounded transition"
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
                  className="block w-full text-center py-2 text-sm font-bold text-[#5C5148] hover:text-[#B12B2B]"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex space-x-2">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center py-2 bg-[#B12B2B] text-white text-sm font-bold rounded"
                >
                  Login / Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>

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
