import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { SEO } from '../../components/common/SEO';
import { User, Mail, Phone, Lock, UserPlus, ArrowRight, Award, AlertCircle, Briefcase, GraduationCap, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register } = useAuth();

  const isInstructorUrl = searchParams.get('instructor') === 'true' || searchParams.get('role') === 'instructor';
  const emailParam = searchParams.get('email') || '';

  const [formData, setFormData] = useState({
    name: '',
    email: emailParam,
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [applyAsInstructor, setApplyAsInstructor] = useState(isInstructorUrl);
  const [instructorData, setInstructorData] = useState({
    title: 'Senior Varma Practitioner',
    specialization: 'Varmakalai & Marma Therapy',
    experience: '5+ Years',
    bio: ''
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAlreadyInstructor, setIsAlreadyInstructor] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (emailParam && !formData.email) {
      setFormData(prev => ({ ...prev, email: emailParam }));
    }
    if (isInstructorUrl) {
      setApplyAsInstructor(true);
    }
  }, [emailParam, isInstructorUrl]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsAlreadyInstructor(false);

    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      alert("Please fill in all required fields.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match. Please re-enter.");
      return;
    }

    try {
      setSubmitting(true);
      const extraOptions = applyAsInstructor ? {
        applyAsInstructor: true,
        title: instructorData.title,
        specialization: instructorData.specialization,
        experience: instructorData.experience,
        bio: instructorData.bio
      } : {};

      await register(formData.name, formData.email, formData.phone, formData.password, extraOptions);

      if (applyAsInstructor) {
        alert("Registration successful!\n\nYour application to become an Instructor has been submitted to the Admin. Until approved, you can access your account as a student.");
      }
      navigate('/student');
    } catch (error: any) {
      if (error?.data?.isAlreadyInstructor || error?.message?.includes('already registered as an Instructor')) {
        setIsAlreadyInstructor(true);
        setErrorMessage("This ID is already registered as an Instructor. Please log in directly as an instructor.");
      } else {
        setErrorMessage(error?.message || "Registration failed. Please check your information and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SEO 
        title={`${applyAsInstructor ? 'Apply as Instructor' : 'Register Account'} | JADMAA Varmakalai`}
        description="Register a new student or instructor account at JADMAA Varmakalai."
      />

      <section className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#FAF6F0]">
        <div className="max-w-lg w-full bg-white p-8 rounded-2xl border border-[#E8DDD0] shadow-md space-y-6 text-left">
          
          <div className="text-center space-y-2">
            <img 
              src="/images/logo-1.png" 
              alt="JADMAA Logo" 
              className="h-14 w-auto mx-auto object-contain"
            />
            <h1 className="font-heading font-extrabold text-2xl text-[#2B2521]">
              {applyAsInstructor ? 'Instructor Application & Registration' : 'Register Account'}
            </h1>
            <p className="text-xs text-[#5C5148]">
              {applyAsInstructor 
                ? 'Submit your application to become an accredited JADMAA Instructor.'
                : 'Create your JADMAA student account to access courses.'}
            </p>
          </div>

          {isAlreadyInstructor && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 space-y-3">
              <div className="flex items-start space-x-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-sm">Already an Instructor!</p>
                  <p className="text-xs leading-relaxed">{errorMessage}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full py-2 bg-[#B12B2B] hover:bg-[#8C1E1E] text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center space-x-1"
              >
                <span>Login as Instructor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {errorMessage && !isAlreadyInstructor && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#2B2521]">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Master Senthil Kumar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#E8DDD0] text-xs text-[#2B2521] focus:border-[#B12B2B] focus:ring-1 focus:ring-[#B12B2B] outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#2B2521]">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="senthil@example.com"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (isAlreadyInstructor) setIsAlreadyInstructor(false);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#E8DDD0] text-xs text-[#2B2521] focus:border-[#B12B2B] focus:ring-1 focus:ring-[#B12B2B] outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#2B2521]">Phone Number *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#E8DDD0] text-xs text-[#2B2521] focus:border-[#B12B2B] focus:ring-1 focus:ring-[#B12B2B] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#2B2521]">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#E8DDD0] text-xs text-[#2B2521] focus:border-[#B12B2B] focus:ring-1 focus:ring-[#B12B2B] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#2B2521]">Confirm Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#E8DDD0] text-xs text-[#2B2521] focus:border-[#B12B2B] focus:ring-1 focus:ring-[#B12B2B] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Apply as an Instructor Checkbox */}
            <div className="p-3.5 bg-[#FAF6F0] rounded-xl border border-[#E8DDD0] space-y-3">
              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  id="applyAsInstructorRegister"
                  checked={applyAsInstructor}
                  onChange={(e) => setApplyAsInstructor(e.target.checked)}
                  className="mt-0.5 rounded border-gray-300 text-[#B12B2B] focus:ring-[#B12B2B]"
                />
                <div className="text-xs">
                  <span className="font-bold text-[#2B2521] flex items-center space-x-1.5">
                    <Award className="w-4 h-4 text-[#B12B2B]" />
                    <span>Apply as an Instructor</span>
                  </span>
                  <p className="text-[11px] text-[#5C5148] mt-0.5">
                    Check this box if you are a Varmakalai master or trainer applying to become an instructor.
                  </p>
                </div>
              </label>

              {applyAsInstructor && (
                <div className="pt-3 border-t border-[#E8DDD0] space-y-3 animate-fadeIn">
                  <div className="p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-lg text-[11px] text-[#5C5148] leading-relaxed">
                    <span className="font-bold text-amber-900">Note: </span>
                    Until the Admin approves your request, you will be registered with a student account. Once approved by the admin, your role will automatically upgrade to Instructor with a notification on your next login!
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#2B2521]">Professional Title</label>
                      <div className="relative">
                        <GraduationCap className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          placeholder="e.g. Senior Varma Practitioner"
                          value={instructorData.title}
                          onChange={(e) => setInstructorData({ ...instructorData, title: e.target.value })}
                          className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E8DDD0] text-xs text-[#2B2521] focus:border-[#B12B2B] outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#2B2521]">Specialization</label>
                      <div className="relative">
                        <Briefcase className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          placeholder="e.g. Varma Healing & Chikitsa"
                          value={instructorData.specialization}
                          onChange={(e) => setInstructorData({ ...instructorData, specialization: e.target.value })}
                          className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E8DDD0] text-xs text-[#2B2521] focus:border-[#B12B2B] outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#2B2521]">Years of Experience</label>
                      <input
                        type="text"
                        placeholder="e.g. 8+ Years"
                        value={instructorData.experience}
                        onChange={(e) => setInstructorData({ ...instructorData, experience: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-[#E8DDD0] text-xs text-[#2B2521] focus:border-[#B12B2B] outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#2B2521]">Brief Bio / Background</label>
                      <div className="relative">
                        <FileText className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          placeholder="Brief summary of teaching experience"
                          value={instructorData.bio}
                          onChange={(e) => setInstructorData({ ...instructorData, bio: e.target.value })}
                          className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E8DDD0] text-xs text-[#2B2521] focus:border-[#B12B2B] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 bg-[#B12B2B] hover:bg-[#8C1E1E] text-white font-bold text-sm rounded-lg shadow transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {applyAsInstructor ? (
                <>
                  <Award className="w-4 h-4" />
                  <span>{submitting ? 'Submitting Application...' : 'Apply & Register as Instructor'}</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>{submitting ? 'Creating Account...' : 'Register Account'}</span>
                </>
              )}
            </button>

          </form>

          <div className="text-center pt-2 text-xs text-[#5C5148] border-t border-[#E8DDD0]">
            <span>Already have an account? </span>
            <Link to="/login" className="font-bold text-[#B12B2B] hover:underline inline-flex items-center space-x-1">
              <span>Login Here</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

        </div>
      </section>
    </>
  );
};
