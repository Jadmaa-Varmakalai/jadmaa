import React, { useState, useEffect } from 'react';
import { SEO } from '../components/common/SEO';
import { CourseCard, isOnlineCourse } from '../components/courses/CourseCard';
import { Search, Filter, BookOpen, Video, MapPin, Layers } from 'lucide-react';
import { courseApi } from '../lib/api/courseApi';
import { EditableText } from '../components/common/EditableText';
import type { Course } from '../types';

export const Courses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>(() => courseApi.getCachedCourses());
  const [loading, setLoading] = useState(() => courseApi.getCachedCourses().length === 0);
  const [error, setError] = useState('');
  
  // Format filter: 'all' | 'online' | 'branch'
  const [trainingFilter, setTrainingFilter] = useState<'all' | 'online' | 'branch'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await courseApi.getCourses();
        if (data && data.length > 0) {
          setCourses(data);
          setError('');
        }
      } catch (err: any) {
        if (courses.length === 0) {
          setError(err.message || 'Failed to load courses');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const categories = ['All', 'Varmakalai', 'Self-Defence', 'Kids', 'Fitness'];
  const levels = ['All', 'Beginner', 'Intermediate', 'All Levels'];

  const normalizeCat = (cat: string) => cat.toLowerCase().replace(/[\s-_]/g, '');

  const filteredCourses = courses.filter(course => {
    // Training mode filter
    if (trainingFilter === 'online' && !isOnlineCourse(course)) return false;
    if (trainingFilter === 'branch' && isOnlineCourse(course)) return false;

    // Category filter
    const matchesCategory = selectedCategory === 'All' || 
      normalizeCat(course.category || '') === normalizeCat(selectedCategory);

    // Level filter
    const matchesLevel = selectedLevel === 'All' || course.level === selectedLevel;

    // Search query
    const matchesSearch = 
      (course.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (course.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.category || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesLevel && matchesSearch;
  });

  const onlineCourses = filteredCourses.filter(c => isOnlineCourse(c));
  const branchCourses = filteredCourses.filter(c => !isOnlineCourse(c));

  return (
    <>
      <SEO 
        title="Courses & Training Programs | JADMAA Varmakalai Academy"
        description="Explore JADMAA recorded online LMS courses and in-person branch training across Thanjavur, Kumbakonam, and Ariyalur."
      />

      {/* Page Header */}
      <section className="bg-jadmaa-cream py-12 md:py-16 border-b border-jadmaa-border text-left" data-aos="fade-up">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 space-y-3">
          <span className="text-base md:text-lg font-bold text-jadmaa-red uppercase tracking-wider block">
            <EditableText
              settingKey="courses.hero.eyebrow"
              defaultText="Academy Curriculum & Training"
            />
          </span>
          <h1 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-jadmaa-charcoal">
            <EditableText
              settingKey="courses.hero.title"
              defaultText="Courses & Training Programs"
            />
          </h1>
          <p className="text-base md:text-lg text-jadmaa-textMuted max-w-3xl leading-relaxed">
            <EditableText
              settingKey="courses.hero.description"
              defaultText="Recorded online LMS courses for self-paced video learning, and in-person academy classes across our branches in Thanjavur, Kumbakonam, and Ariyalur."
              multiline
            />
          </p>
        </div>
      </section>

      {/* Course Catalog Content */}
      <section className="py-12 bg-[#FCFAF7] border-b border-jadmaa-border min-h-screen">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 space-y-8">
          
          {/* Top Format Selector (Online vs Branch) */}
          <div className="flex flex-wrap items-center gap-3 p-1.5 bg-[#F0EBE3] rounded-2xl border border-[#E0D7CC] w-fit" data-aos="fade-up">
            <button
              onClick={() => setTrainingFilter('all')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                trainingFilter === 'all'
                  ? 'bg-white text-[#2B2521] shadow-sm'
                  : 'text-[#5C5148] hover:text-[#2B2521]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>All Programs ({courses.length})</span>
            </button>
            <button
              onClick={() => setTrainingFilter('online')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                trainingFilter === 'online'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-[#5C5148] hover:text-emerald-800'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Recorded Online LMS</span>
            </button>
            <button
              onClick={() => setTrainingFilter('branch')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                trainingFilter === 'branch'
                  ? 'bg-[#B12B2B] text-white shadow-sm'
                  : 'text-[#5C5148] hover:text-[#B12B2B]'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>In-Person Branch Training</span>
            </button>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-5 rounded-2xl border border-jadmaa-border shadow-sm space-y-4" data-aos="fade-up">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Search courses or training programs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-jadmaa-border bg-[#FAF8F5] text-jadmaa-charcoal focus:border-jadmaa-red focus:ring-1 focus:ring-jadmaa-red outline-none"
                />
              </div>

              {/* Level selector */}
              <div className="flex items-center space-x-2 text-xs sm:text-sm">
                <Filter className="w-4 h-4 text-jadmaa-textMuted" />
                <span className="font-bold text-jadmaa-charcoal">Level:</span>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="py-2 px-3.5 rounded-xl border border-jadmaa-border bg-[#FAF8F5] text-jadmaa-charcoal font-medium outline-none text-xs sm:text-sm"
                >
                  {levels.map(lvl => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2 pt-3 border-t border-jadmaa-border/60">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    selectedCategory === cat
                      ? 'bg-jadmaa-red text-white shadow-sm'
                      : 'bg-[#FAF8F5] text-jadmaa-charcoal hover:bg-jadmaa-cream hover:text-jadmaa-red border border-jadmaa-border'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

          </div>

          {loading ? (
            <div className="py-24 text-center text-jadmaa-textMuted flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-[#B12B2B] border-t-transparent rounded-full animate-spin" />
              <span className="font-medium text-sm">Loading course catalog...</span>
            </div>
          ) : error ? (
            <div className="py-20 text-center bg-red-50 rounded-2xl border border-red-200 text-red-600 space-y-2">
              <p className="font-bold">Error loading course catalog</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-jadmaa-border space-y-3">
              <BookOpen className="w-10 h-10 text-gray-400 mx-auto" />
              <h3 className="font-heading font-extrabold text-lg text-jadmaa-charcoal">
                <EditableText
                  settingKey="courses.empty.title"
                  defaultText="No courses match your criteria"
                />
              </h3>
              <p className="text-sm text-jadmaa-textMuted max-w-md mx-auto">
                <EditableText
                  settingKey="courses.empty.description"
                  defaultText="Try adjusting your format toggle, category tabs, or search keyword."
                />
              </p>
              <button
                onClick={() => { setTrainingFilter('all'); setSelectedCategory('All'); setSelectedLevel('All'); setSearchQuery(''); }}
                className="px-4 py-2 text-sm font-bold text-jadmaa-red hover:underline"
              >
                Reset All Filters
              </button>
            </div>
          ) : trainingFilter === 'all' ? (
            /* ALL PROGRAMS VIEW: Clearly Separated Sections */
            <div className="space-y-16">
              
              {/* 1. Recorded Online LMS Section */}
              {onlineCourses.length > 0 && (
                <div className="space-y-6">
                  <div className="border-b border-[#E8DDD0] pb-4">
                    <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                      <Video className="w-4 h-4" />
                      <span>Recorded Video Learning</span>
                    </div>
                    <h2 className="font-heading font-bold text-2xl sm:text-3xl text-[#1F2937] mt-1">
                      Recorded Online LMS Courses
                    </h2>
                    <p className="text-sm sm:text-base text-[#4B5563] mt-1 max-w-3xl">
                      Learn self-paced with recorded video lessons, progress tracking, and verifiable digital certification. Accessible through our online student learning portal.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch" data-aos="fade-up">
                    {onlineCourses.map((course, idx) => (
                      <div key={course.id} className="flex" data-aos="fade-up" data-aos-delay={(idx % 3) * 100}>
                        <CourseCard course={course} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. In-Person Branch Training Section */}
              {branchCourses.length > 0 && (
                <div className="space-y-6">
                  <div className="border-b border-[#E8DDD0] pb-4" data-aos="fade-up">
                    <div className="flex items-center gap-2 text-[#B12B2B] text-xs font-bold uppercase tracking-wider">
                      <MapPin className="w-4 h-4" />
                      <span>Academy Branch Training</span>
                    </div>
                    <h2 className="font-heading font-bold text-2xl sm:text-3xl text-[#1F2937] mt-1">
                      In-Person Branch Training
                    </h2>
                    <p className="text-sm sm:text-base text-[#4B5563] mt-1 max-w-3xl">
                      Hands-on traditional martial arts instruction under certified Aasans. Regular batches conducted at our branches in Thanjavur, Kumbakonam, and Ariyalur.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch" data-aos="fade-up">
                    {branchCourses.map((course, idx) => (
                      <div key={course.id} className="flex" data-aos="fade-up" data-aos-delay={(idx % 3) * 100}>
                        <CourseCard course={course} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
            /* FILTERED VIEW (EITHER ONLINE OR BRANCH ONLY) */
            <div className="space-y-6">
              <div className="border-b border-[#E8DDD0] pb-4" data-aos="fade-up">
                <h2 className="font-heading font-bold text-2xl sm:text-3xl text-[#1F2937]">
                  {trainingFilter === 'online' ? 'Recorded Online LMS Courses' : 'In-Person Branch Training'}
                </h2>
                <p className="text-sm sm:text-base text-[#4B5563] mt-1">
                  {trainingFilter === 'online'
                    ? 'Courses accessible via our self-paced recorded video LMS with progress tracking and certification.'
                    : 'Authentic academy training conducted in-person at our Thanjavur, Kumbakonam, and Ariyalur branches.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch" data-aos="fade-up">
                {filteredCourses.map((course, idx) => (
                  <div key={course.id} className="flex" data-aos="fade-up" data-aos-delay={(idx % 3) * 100}>
                    <CourseCard course={course} />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </section>
    </>
  );
};
