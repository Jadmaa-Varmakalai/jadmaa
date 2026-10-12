import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../../components/common/SEO';
import { User, Mail, Phone, Lock, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchApi } from '../../lib/api/apiClient';
import { authApi } from '../../lib/api/authApi';
import { ImageUpload } from '../../components/common/ImageUpload';

export const StudentProfile: React.FC = () => {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(() => user || null);
  const [loading, setLoading] = useState(!user);
  
  // Profile update state
  const [name, setName] = useState(() => user?.name || '');
  const [phone, setPhone] = useState(() => (user as any)?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(() => (user as any)?.avatarUrl || '');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPassError("New passwords do not match.");
      return;
    }
    setPassLoading(true);
    setPassError(null);
    setPassSuccess(null);
    try {
      const res = await authApi.changePassword({ currentPassword, newPassword, confirmPassword });
      setPassSuccess(res.message || "Password changed successfully.");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPassError(err.message || 'Failed to change password');
    } finally {
      setPassLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateLoading(true);
    setUpdateError(null);
    setUpdateSuccess(null);
    try {
      const res = await fetchApi('/auth/update-profile', { 
        method: 'PUT', 
        body: JSON.stringify({ name, phone, avatarUrl }) 
      });
      if (res.success) {
        setUpdateSuccess("Profile updated successfully.");
        setProfile({ ...(profile || user), name: res.data.name, phone: res.data.phone, avatarUrl: res.data.avatarUrl });
      } else {
        setUpdateError(res.error?.message || 'Failed to update profile');
      }
    } catch (err: any) {
      setUpdateError(err.message || 'Failed to update profile');
    } finally {
      setUpdateLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    const loadProfile = async () => {
      try {
        const res = await fetchApi('/auth/me');
        if (res.success && res.data) {
          setProfile(res.data);
          setName(res.data.name || '');
          setPhone(res.data.phone || '');
          if (res.data.avatarUrl) setAvatarUrl(res.data.avatarUrl);
        }
      } catch (err) {
        console.warn('Could not fetch fresh profile:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [isLoggedIn, navigate]);

  if (loading && !profile) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-pulse h-8 w-8 bg-gray-200 rounded-full"></div>
    </div>
  );

  return (
    <>
      <SEO title="My Profile | JADMAA LMS" />
      
      <section className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-heading font-extrabold text-3xl text-gray-900">
            My Profile
          </h1>
          <p className="text-gray-500 mt-2">Manage your account information and preferences.</p>
        </div>
      </section>

      <section className="py-12 bg-gray-50 min-h-[600px]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-4 border-white shadow-md flex-shrink-0 text-3xl font-bold text-gray-400">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                profile?.name?.charAt(0).toUpperCase() || <User className="w-10 h-10" />
              )}
            </div>
            <div className="flex-grow text-center sm:text-left space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">{profile?.name}</h2>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 text-sm text-gray-600">
                <span className="flex items-center justify-center sm:justify-start gap-2">
                  <Mail className="w-4 h-4 text-gray-400" /> {profile?.email}
                </span>
                <span className="flex items-center justify-center sm:justify-start gap-2">
                  <Phone className="w-4 h-4 text-gray-400" /> {profile?.phone || 'Not provided'}
                </span>
              </div>
              <div className="pt-2 flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold">
                 <span className="px-2 py-1 bg-green-100 text-green-800 rounded flex items-center gap-1">
                   <CheckCircle className="w-3 h-3" /> Active Account
                 </span>
                 <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded flex items-center gap-1">
                   <Clock className="w-3 h-3" /> Joined {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Active Member'}
                 </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
              <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-3">Personal Information</h3>
              
              {updateError && <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4 border border-red-100">{updateError}</div>}
              {updateSuccess && <div className="bg-green-50 text-green-700 p-3 rounded text-sm mb-4 border border-green-100">{updateSuccess}</div>}
              
              <form className="space-y-4" onSubmit={handleUpdateProfile}>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-jadmaa-red focus:border-jadmaa-red" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                  <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-jadmaa-red focus:border-jadmaa-red" />
                </div>
                <ImageUpload 
                  label="Profile Picture (Avatar)"
                  value={avatarUrl}
                  onChange={setAvatarUrl}
                  aspectRatio="square"
                  helperText="Upload a photo from your device or paste an image URL"
                />
                <div className="pt-2">
                  <button type="submit" disabled={updateLoading} className="px-5 py-2.5 bg-gray-900 text-white font-semibold rounded text-sm hover:bg-gray-800 transition disabled:opacity-50">
                    {updateLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
              <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
                <Lock className="w-4 h-4" /> Security & Login
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                  <input type="email" disabled value={profile?.email || ''} className="w-full px-3 py-2 border border-gray-200 bg-gray-50 text-gray-500 rounded cursor-not-allowed" />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed directly.</p>
                </div>
                
                <div className="pt-4 border-t border-gray-100 mt-6">
                   <h4 className="text-sm font-bold text-gray-900 mb-4">Change Password</h4>
                   
                   {passError && <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4 border border-red-100">{passError}</div>}
                   {passSuccess && <div className="bg-green-50 text-green-700 p-3 rounded text-sm mb-4 border border-green-100">{passSuccess}</div>}
                   
                   <form className="space-y-4" onSubmit={handleChangePassword}>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                       <input 
                         type="password" 
                         required
                         value={currentPassword}
                         onChange={(e) => setCurrentPassword(e.target.value)}
                         className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-jadmaa-red focus:border-jadmaa-red" 
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                       <input 
                         type="password" 
                         required
                         value={newPassword}
                         onChange={(e) => setNewPassword(e.target.value)}
                         className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-jadmaa-red focus:border-jadmaa-red" 
                         placeholder="Min 8 chars, 1 uppercase, 1 number"
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                       <input 
                         type="password" 
                         required
                         value={confirmPassword}
                         onChange={(e) => setConfirmPassword(e.target.value)}
                         className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-jadmaa-red focus:border-jadmaa-red" 
                       />
                     </div>
                     <div className="pt-2">
                       <button type="submit" disabled={passLoading} className="px-5 py-2.5 bg-gray-900 text-white font-semibold rounded text-sm hover:bg-gray-800 transition disabled:opacity-50">
                         {passLoading ? 'Changing...' : 'Change Password'}
                       </button>
                     </div>
                   </form>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>
    </>
  );
};
