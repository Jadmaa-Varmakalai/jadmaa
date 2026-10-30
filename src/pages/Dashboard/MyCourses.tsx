import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SEO } from '../../components/common/SEO';
import { PlayCircle, Award, BookOpen, Search, CheckCircle } from 'lucide-react';
import { progressApi } from '../../lib/api/progressApi';
import { useAuth } from '../../context/AuthContext';

export const MyCourses: React.FC = () => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [enrolledList, setEnrolledList] = useState<any[]>(() => progressApi.getCachedEnrollments());
  const [loading, setLoading] = useState(() => progressApi.getCachedEnrollments().length === 0);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'IN_PROGRESS' | 'NOT_STARTED' | 'COMPLETED'>('ALL');

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    const fetchEnrollments = async () => {
      try {
        const res = await progressApi.getMyEnrollments();
        if (res.success && res.data) {
          setEnrolledList(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch enrollments", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEnrollments();
  }, [isLoggedIn, navigate]);

  const filteredCourses = useMemo(() => {
    return enrolledList.filter(item => {
      const matchesSearch = item.course.title.toLowerCase().includes(search.toLowerCase()) || 
                            (item.course.instructor?.displayName || 'JADMAA Master').toLowerCase().includes(search.toLowerCase());
      
      let matchesTab = true;
      if (activeTab === 'IN_PROGRESS') matchesTab = item.status === 'ACTIVE' && item.progress > 0;
      if (activeTab === 'NOT_STARTED') matchesTab = item.status === 'ACTIVE' && item.progress === 0;
      if (activeTab === 'COMPLETED') matchesTab = item.status === 'COMPLETED';

      return matchesSearch && matchesTab;
    });
  }, [enrolledList, search, activeTab]);

  const counts = useMemo(() => ({
    ALL: enrolledList.length,
    IN_PROGRESS: enrolledList.filter(i => i.status === 'ACTIVE' && i.progress > 0).length,
    NOT_STARTED: enrolledList.filter(i => i.status === 'ACTIVE' && i.progress === 0).length,
    COMPLETED: enrolledList.filter(i => i.status === 'COMPLETED').length,
  }), [enrolledList]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO title="My Courses | JADMAA LMS" />
      
      <section className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="font-heading font-extrabold text-3xl text-gray-900">
              My Courses
            </h1>
            <div className="relative max-w-sm w-full">
              <input 
                type="text" 
                placeholder="Search your courses..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-jadmaa-red focus:border-jadmaa-red"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>
          
          <div className="flex space-x-6 border-b border-gray-200 overflow-x-auto no-scrollbar">
            {[
              { id: 'ALL', label: 'All', count: counts.ALL },
              { id: 'IN_PROGRESS', label: 'In Progress', count: counts.IN_PROGRESS },
              { id: 'NOT_STARTED', label: 'Not Started', count: counts.NOT_STARTED },
              { id: 'COMPLETED', label: 'Completed', count: counts.COMPLETED }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab.id 
                    ? 'border-jadmaa-red text-gray-900' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} <span className="ml-1 text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full">{tab.count}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {enrolledList.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">No courses yet</h3>
              <p className="text-gray-500 mb-6">Explore JADMAA courses and start learning.</p>
              <Link to="/courses" className="px-6 py-3 bg-jadmaa-red text-white font-semibold rounded-lg shadow-sm hover:bg-red-800 transition">
                Browse Courses
              </Link>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              No courses found matching your criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((item) => {
                const { course, progress, status } = item;
                const isCompleted = status === 'COMPLETED';
                
                return (
                  <div key={course.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group">
                    <div className="aspect-video bg-gray-100 overflow-hidden relative">
                      <ResponsiveImage src={course.thumbnailUrl || '/images/course-basic.jpg'} alt={course.title} width={360} height={202} aspectRatio="16/9" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      {isCompleted && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          COMPLETED
                        </div>
                      )}
                    </div>
                    <div className="p-5 flex flex-col flex-grow">
                      <h3 className="font-heading font-bold text-lg text-gray-900 line-clamp-2 mb-1">{course.title}</h3>
                      <p className="text-xs text-gray-500 mb-4">{course.instructor?.displayName || 'JADMAA Master'}</p>
                      
                      <div className="mt-auto space-y-4">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-gray-600">{progress}% completed</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div className={`h-1.5 rounded-full animate-progress-fill ${isCompleted ? 'bg-green-500' : 'bg-jadmaa-red'}`} style={{ width: `${progress}%` }}></div>
                          </div>
                        </div>
                        
                        {isCompleted ? (
                           <Link
                             to="/certificates"
                             className="w-full inline-flex items-center justify-center gap-2 py-2.5 border border-gray-300 hover:border-gray-400 text-gray-700 text-sm font-semibold rounded-lg transition-colors"
                           >
                             <Award className="w-4 h-4" />
                             <span>View Certificate</span>
                           </Link>
                        ) : (
                          <Link
                            to={`/learn/${course.id}`}
                            className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-lg transition-colors"
                          >
                            <PlayCircle className="w-4 h-4" />
                            <span>{progress === 0 ? 'Start Course' : 'Continue Learning'}</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </section>
    </>
  );
};
