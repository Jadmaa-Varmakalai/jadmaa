import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SEO } from '../../components/common/SEO';
import { PlayCircle, Award, BookOpen } from 'lucide-react';
import { progressApi } from '../../lib/api/progressApi';
import { useAuth } from '../../context/AuthContext';

export const StudentDashboard: React.FC = () => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(() => progressApi.getCachedDashboard());
  const [loading, setLoading] = useState(() => !progressApi.getCachedDashboard());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    const fetchDashboard = async () => {
      try {
        const res = await progressApi.getDashboard();
        if (res.success) {
          setData(res.data);
        } else {
          setError(res.error?.message || "Failed to load dashboard");
        }
      } catch (err) {
        setError("Something went wrong loading your dashboard.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [isLoggedIn, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
          <div className="h-3 w-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center flex-col">
        <p className="text-red-500 mb-4">{error || "Something went wrong."}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-jadmaa-red text-white rounded">
          Try Again
        </button>
      </div>
    );
  }

  const { student, stats, continueLearning, recentCourses } = data;

  return (
    <>
      <SEO title="Student Dashboard | JADMAA LMS" />
      
      {/* Header */}
      <section className="bg-white border-b border-gray-200 pt-8 pb-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden border border-gray-200 flex-shrink-0">
               {student.avatarUrl ? (
                 <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center bg-jadmaa-cream text-jadmaa-red font-bold text-xl">
                   {student.name.charAt(0).toUpperCase()}
                 </div>
               )}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-gray-900">
                Welcome back, {student.name.split(' ')[0]}
              </h1>
              <p className="text-gray-500 text-sm mt-1">Continue your Varmakalai learning journey.</p>
            </div>
          </div>
          <Link to="/courses" className="px-5 py-2.5 bg-jadmaa-red hover:bg-red-800 text-white text-sm font-semibold rounded shadow-sm transition self-start sm:self-auto">
            Browse New Courses
          </Link>
        </div>
      </section>

      <section className="py-8 bg-gray-50 min-h-[600px]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-sm">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Enrolled</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.enrolledCourses}</p>
            </div>
            <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-sm">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Completed</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.completedCourses}</p>
            </div>
            <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-sm">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Certificates</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.certificates}</p>
            </div>
            <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-sm">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Avg Progress</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.averageProgress}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Continue Learning & My Courses */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Continue Learning */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900">Continue Learning</h2>
                
                {continueLearning ? (
                  <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col sm:flex-row">
                    <div className="w-full sm:w-1/3 h-40 sm:h-auto bg-gray-100 flex-shrink-0">
                      <img 
                        src={continueLearning.course.thumbnail} 
                        alt={continueLearning.course.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-5 flex-grow flex flex-col justify-center space-y-3">
                      <h3 className="font-heading font-bold text-xl text-gray-900">{continueLearning.course.title}</h3>
                      {continueLearning.moduleTitle && (
                        <p className="text-sm text-gray-500">
                          {continueLearning.moduleTitle} &bull; {continueLearning.lessonTitle}
                        </p>
                      )}
                      
                      <div className="space-y-1.5 pt-2">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-gray-500">Progress</span>
                          <span className="text-gray-900">{continueLearning.course.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: `${continueLearning.course.progress}%` }}></div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <Link 
                          to={`/learn/${continueLearning.course.id}`}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded transition"
                        >
                          <PlayCircle className="w-4 h-4" />
                          <span>{continueLearning.course.progress === 0 ? "Start Course" : "Continue"}</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
                    <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <h3 className="font-bold text-gray-900 mb-1">Start your first course</h3>
                    <p className="text-sm text-gray-500 mb-5">Enroll in a course to begin your Varmakalai journey.</p>
                    <Link to="/courses" className="px-5 py-2.5 bg-jadmaa-red text-white text-sm font-semibold rounded shadow-sm">
                      Browse Courses
                    </Link>
                  </div>
                )}
              </div>

              {/* My Courses Summary */}
              {recentCourses.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">My Courses</h2>
                    <Link to="/my-courses" className="text-sm font-semibold text-jadmaa-red hover:underline">
                      View all &rarr;
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {recentCourses.map((c: any) => (
                      <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-4 hover:border-gray-300 transition group">
                        <div className="w-20 h-16 rounded overflow-hidden flex-shrink-0 bg-gray-100 hidden sm:block">
                          <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-grow min-w-0">
                          <h4 className="font-bold text-gray-900 text-sm truncate">{c.title}</h4>
                          <div className="flex items-center gap-3 mt-1.5">
                            <div className="flex-grow bg-gray-100 rounded-full h-1.5 max-w-[120px]">
                              <div className={`h-1.5 rounded-full ${c.status === 'COMPLETED' ? 'bg-green-500' : 'bg-jadmaa-red'}`} style={{ width: `${c.progress}%` }}></div>
                            </div>
                            <span className="text-xs text-gray-500 font-medium">{c.progress}%</span>
                          </div>
                        </div>
                        <Link 
                          to={c.status === 'COMPLETED' ? `/certificates` : `/learn/${c.id}`}
                          className="px-4 py-2 border border-gray-200 group-hover:border-gray-300 text-gray-700 text-xs font-semibold rounded transition whitespace-nowrap"
                        >
                          {c.status === 'COMPLETED' ? 'Certificate' : c.progress === 0 ? 'Start' : 'Continue'}
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Certificates & Activity */}
            <div className="space-y-8">
              
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h3 className="font-bold text-gray-900">Earned Certificates</h3>
                  <Award className="w-5 h-5 text-gray-400" />
                </div>
                {data.certificates.length > 0 ? (
                  <div className="space-y-3">
                    {data.certificates.map((cert: any) => (
                      <div key={cert.id} className="flex flex-col gap-1 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                        <span className="text-sm font-semibold text-gray-900 leading-tight">{cert.course.title}</span>
                        <span className="text-xs text-gray-500">Issued {new Date(cert.issuedAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                    <Link to="/certificates" className="block text-center text-sm text-jadmaa-red font-semibold pt-2 hover:underline">
                      View all certificates
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">You haven't earned any certificates yet.</p>
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>
      </section>
    </>
  );
};
