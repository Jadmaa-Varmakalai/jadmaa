import React, { useState, useEffect } from 'react';
import { ResponsiveImage } from '../../components/common/ResponsiveImage';
import { Link, useSearchParams } from 'react-router-dom';
import { SEO } from '../../components/common/SEO';
import { Lock, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { authApi } from '../../lib/api/authApi';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const userId = searchParams.get('id');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token || !userId) {
      setError("Invalid or missing password reset token.");
    }
  }, [token, userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !userId) return;
    
    if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await authApi.resetPassword({ userId, token, password, confirmPassword });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'This password reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Reset Password | JADMAA LMS" />
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Link to="/" className="flex justify-center mb-6">
            <ResponsiveImage src="/images/logo-1.png" alt="JADMAA Logo" width={64} height={64} priority={true} aspectRatio="1/1" className="h-14 sm:h-16 w-auto mx-auto object-contain" />
          </Link>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 font-heading">
            Reset your password
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200">
            
            {success ? (
               <div className="text-center space-y-4">
                 <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                 <h3 className="text-lg font-bold text-gray-900">Password updated successfully</h3>
                 <p className="text-sm text-gray-500">You can now login with your new password.</p>
                 <div className="pt-4">
                   <Link to="/login" className="inline-block px-6 py-2 bg-jadmaa-red text-white font-bold rounded shadow-sm hover:bg-red-800 transition">
                     Login
                   </Link>
                 </div>
               </div>
            ) : error && (!token || !userId) ? (
                <div className="text-center space-y-4">
                    <p className="text-red-600 font-semibold">{error}</p>
                    <Link to="/forgot-password" className="inline-block px-6 py-2 border border-gray-300 text-gray-700 font-bold rounded hover:bg-gray-50 transition">
                      Request a New Reset Link
                    </Link>
                </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded text-sm text-center">
                    {error}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="focus:ring-jadmaa-red focus:border-jadmaa-red block w-full pl-10 pr-10 sm:text-sm border-gray-300 rounded-md py-2.5 border"
                      placeholder="Min. 8 chars, uppercase, lowercase, number"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="focus:ring-jadmaa-red focus:border-jadmaa-red block w-full pl-10 pr-10 sm:text-sm border-gray-300 rounded-md py-2.5 border"
                      placeholder="Confirm your new password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-jadmaa-red hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-jadmaa-red transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            )}
            
          </div>
        </div>
      </div>
    </>
  );
};
