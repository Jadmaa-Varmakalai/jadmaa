import React, { useState, useEffect } from 'react';
import { SEO } from '../components/common/SEO';
import { CourseCard } from '../components/courses/CourseCard';
import { Search, Filter, BookOpen } from 'lucide-react';
import { courseApi } from '../lib/api/courseApi';
import { EditableText } from '../components/common/EditableText';
import type { Course } from '../types';

export const Courses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>(() => courseApi.getCachedCourses());
  const [loading, setLoading] = useState(() => courseApi.getCachedCourses().length === 0);
  const [error, setError] = useState('');
  
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await courseApi.getCourses();
        if (data && data.length > 0) {
          setCourses(data);
        }
      } catch (err: any) {
        if (courses.length === 0) {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const categories = ['All', 'Varmakalai', 'Self Defence', 'Kids', 'Wellness'];
  const levels = ['All', 'Beginner', 'Intermediate', 'Advanced', 'All Levels'];

  const filteredCourses = courses.filter(course => {
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    const matchesLevel = selectedLevel === 'All' || course.level === selectedLevel;
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          course.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesLevel && matchesSearch;
  });

  return (
    <>
      <SEO 
        title="Courses Catalog | JADMAA Varmakalai Academy"
        description="Browse structured Varmakalai courses, Kids Martial Arts, Women's Tactical Self Defence, and Varma Healing programs."
      />

      {/* Page Header */}
      <section className="bg-jadmaa-cream py-12 border-b border-jadmaa-border text-left">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 space-y-3">
          <span className="text-base md:text-lg font-bold text-jadmaa-red uppercase tracking-wider block">
            <EditableText
              settingKey="courses.hero.eyebrow"
              defaultText="Academy Curriculum"
            />
          </span>
          <h1 className="font-heading font-medium text-3xl sm:text-4xl lg:text-5xl text-jadmaa-charcoal">
            <EditableText
              settingKey="courses.hero.title"
              defaultText="Explore All Courses"
            />
          </h2>
          <p className="text-base md:text-lg text-jadmaa-textMuted max-w-2xl">
            <EditableText
              settingKey="courses.hero.description"
              defaultText="Choose from authentic Varmakalai pressure point training, self-defence programs, children's fitness, and Siddha energy healing therapies."
              multiline
            />
          </p>
        </div>
      </section>

      {/* Course Catalog Content */}
      <section className="py-12 bg-white border-b border-jadmaa-border min-h-screen">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 space-y-8">
          
          {/* Filters Bar */}
          <div className="bg-jadmaa-cream/60 p-4 rounded-2xl border border-jadmaa-border space-y-4">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search courses by keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-jadmaa-border bg-white text-jadmaa-charcoal focus:border-jadmaa-red focus:ring-1 focus:ring-jadmaa-red outline-none"
                />
              </div>

              {/* Level selector */}
              <div className="flex items-center space-x-2 text-xs">
                <Filter className="w-4 h-4 text-jadmaa-textMuted" />
                <span className="font-bold text-jadmaa-charcoal">Level:</span>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="py-1.5 px-3 rounded-lg border border-jadmaa-border bg-white text-jadmaa-charcoal font-medium outline-none text-xs"
                >
                  {levels.map(lvl => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-jadmaa-border/60">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    selectedCategory === cat
                      ? 'bg-jadmaa-red text-white shadow'
                      : 'bg-white text-jadmaa-charcoal hover:bg-jadmaa-cream hover:text-jadmaa-red border border-jadmaa-border'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

          </div>

          {loading ? (
            <div className="py-16 text-center text-jadmaa-textMuted">Loading courses...</div>
          ) : error ? (
            <div className="py-16 text-center text-red-500">Error: {error}</div>
          ) : filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 reveal-stagger">
              {filteredCourses.map(course => (
                <div key={course.id} className="reveal-child">
                  <CourseCard course={course} />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center bg-jadmaa-cream/40 rounded-2xl border border-dashed border-jadmaa-border space-y-3">
              <BookOpen className="w-10 h-10 text-gray-400 mx-auto" />
              <h3 className="font-heading font-extrabold text-lg text-jadmaa-charcoal">
                <EditableText
                  settingKey="courses.empty.title"
                  defaultText="No courses match your criteria"
                />
              </h3>
              <p className="text-sm md:text-xl text-jadmaa-textMuted">
                <EditableText
                  settingKey="courses.empty.description"
                  defaultText="Try adjusting your category tabs or search query."
                />
              </p>
              <button
                onClick={() => { setSelectedCategory('All'); setSelectedLevel('All'); setSearchQuery(''); }}
                className="px-4 py-2 text-base md:text-lg font-bold text-jadmaa-red hover:underline"
              >
                Reset All Filters
              </button>
            </div>
          )}

        </div>
      </section>
    </>
  );
};
