import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SEO } from '../../components/common/SEO';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowRight, Award, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../lib/api/authApi';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [applyAsInstructor, setApplyAsInstructor] = useState(false);
  const [instructorWarning, setInstructorWarning] = useState<string | null>(null);
  const [checkingInstructor, setCheckingInstructor] = useState(false);

  const handleApplyInstructorToggle = async (checked: boolean) => {
    setApplyAsInstructor(checked);
    setInstructorWarning(null);

    if (checked && email.trim()) {
      try {
        setCheckingInstructor(true);
        const res = await authApi.checkInstructor(email.trim());
        if (res.data?.isInstructor) {
          setInstructorWarning("This ID is already registered as an Instructor. Please log in directly with your password.");
          setApplyAsInstructor(false);
        }
      } catch (_) {
      } finally {
        setCheckingInstructor(false);
      }
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      alert("Please enter your email address.");
      return;
    }

    // If "Apply as an Instructor" is checked
    if (applyAsInstructor) {
      try {
        setCheckingInstructor(true);
        const res = await authApi.checkInstructor(email.trim());
        if (res.data?.isInstructor) {
          setInstructorWarning("This ID is already registered as an Instructor. Please log in directly with your password.");
          setApplyAsInstructor(false);
          setCheckingInstructor(false);
          return;
        }
      } catch (_) {
      } finally {
        setCheckingInstructor(false);
      }

      // If not yet an instructor, navigate to instructor registration with email prefilled
      navigate(`/register?instructor=true&email=${encodeURIComponent(email.trim())}`);
      return;
    }

    if (!password) {
      alert("Please enter your password.");
      return;
    }
    
    try {
      const user = await login(email, password);
      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        navigate('/admin');
      } else if (user.role === 'INSTRUCTOR') {
        navigate('/instructor');
      } else {
        navigate('/student');
      }
    } catch (error: any) {
      alert(error?.message || "Login failed. Please check your credentials.");
    }
  };

  return (
    <>
      <SEO 
        title="Login | JADMAA Varmakalai"
        description="Login to your JADMAA student or instructor portal."
      />
      <section className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#FAF6F0]">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-[#E8DDD0] shadow-md space-y-6 text-left">
          
          <div className="text-center space-y-2">
            <img 
              src="/images/logo-1.png" 
              alt="JADMAA Logo" 
              className="h-14 w-auto mx-auto object-contain"
            />
            <h1 className="font-heading font-extrabold text-2xl text-[#2B2521]">
              Login to JADMAA
            </h1>
            <p className="text-xs text-[#5C5148]">
              Enter your credentials to access your portal.
            </p>
          </div>

          {instructorWarning && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start space-x-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Already an Instructor!</p>
                <p className="text-[11px] leading-relaxed">{instructorWarning}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#2B2521]">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (instructorWarning) setInstructorWarning(null);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#E8DDD0] text-xs text-[#2B2521] focus:border-[#B12B2B] focus:ring-1 focus:ring-[#B12B2B] outline-none"
                />
              </div>
            </div>

            {!applyAsInstructor && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#2B2521]">Password</label>
                  <Link to="/forgot-password" className="text-xs font-semibold text-[#B12B2B] hover:underline">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={!applyAsInstructor}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-[#E8DDD0] text-xs text-[#2B2521] focus:border-[#B12B2B] focus:ring-1 focus:ring-[#B12B2B] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-gray-400 hover:text-[#2B2521]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Apply as Instructor Section */}
            <div className="p-3 bg-[#FAF6F0] rounded-xl border border-[#E8DDD0] space-y-2">
              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  id="applyAsInstructor"
                  checked={applyAsInstructor}
                  onChange={(e) => handleApplyInstructorToggle(e.target.checked)}
                  className="mt-0.5 rounded border-gray-300 text-[#B12B2B] focus:ring-[#B12B2B]"
                />
                <div className="text-xs">
                  <span className="font-bold text-[#2B2521] flex items-center space-x-1">
                    <Award className="w-3.5 h-3.5 text-[#B12B2B]" />
                    <span>Apply as an Instructor</span>
                  </span>
                  <p className="text-[11px] text-[#5C5148] mt-0.5">
                    Want to join JADMAA as an instructor? Check this to register your instructor profile.
                  </p>
                </div>
              </label>

              {applyAsInstructor && (
                <div className="pt-2 border-t border-[#E8DDD0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                  <span className="text-[#5C5148] text-[11px]">
                    {checkingInstructor ? 'Checking credentials...' : 'Register your instructor candidate account:'}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate(`/register?instructor=true${email ? `&email=${encodeURIComponent(email)}` : ''}`)}
                    className="px-3 py-1 bg-[#B12B2B] hover:bg-[#8C1E1E] text-white font-bold text-xs rounded transition-colors"
                  >
                    Register Instructor Account →
                  </button>
                </div>
              )}
            </div>

            {!applyAsInstructor && (
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-[#B12B2B] focus:ring-[#B12B2B]"
                />
                <label htmlFor="remember" className="text-xs text-[#5C5148] cursor-pointer">
                  Remember me
                </label>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#B12B2B] hover:bg-[#8C1E1E] text-white font-bold text-sm rounded-lg shadow transition-all flex items-center justify-center space-x-2"
            >
              {applyAsInstructor ? (
                <>
                  <Award className="w-4 h-4" />
                  <span>Register as Instructor</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2 text-xs text-[#5C5148] border-t border-[#E8DDD0]">
            <span>Don't have an account? </span>
            <Link to="/register" className="font-bold text-[#B12B2B] hover:underline inline-flex items-center space-x-1">
              <span>Register Here</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

        </div>
      </section>
    </>
  );
};
