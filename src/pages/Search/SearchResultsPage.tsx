import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { SEO } from '../../components/common/SEO';
import { courseApi } from '../../lib/api/courseApi';
import { productApi, type Product } from '../../lib/api/productApi';
import { blogApi, type BlogPost } from '../../lib/api/blogApi';
import type { Course } from '../../types';
import { ResponsiveImage } from '../../components/common/ResponsiveImage';
import { 
  Search, 
  BookOpen, 
  ShoppingBag, 
  FileText, 
  ArrowRight, 
  Sparkles,
  X,
  Layers,
  ArrowUpRight
} from 'lucide-react';

type SearchCategory = 'ALL' | 'COURSES' | 'PRODUCTS' | 'BLOGS';

export const SearchResultsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  
  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('ALL');

  // Search Results State
  const [courses, setCourses] = useState<Course[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);

  // Sync state if query in URL changes
  useEffect(() => {
    setSearchTerm(queryParam);
  }, [queryParam]);

  // Execute universal multi-category search
  useEffect(() => {
    const fetchResults = async () => {
      const q = queryParam.trim().toLowerCase();
      if (!q) {
        setCourses([]);
        setProducts([]);
        setBlogs([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Parallel fetch across courses, products, and blogs
        const [allCourses, productsRes, allBlogs] = await Promise.all([
          courseApi.getCourses().catch(() => []),
          productApi.getProducts({ search: q }).catch(() => ({ data: [] })),
          blogApi.getBlogs().catch(() => [])
        ]);

        // Filter courses matching title, category, level, description
        const matchedCourses = (allCourses || []).filter((c) => {
          const title = (c.title || '').toLowerCase();
          const desc = (c.description || '').toLowerCase();
          const cat = (c.category || '').toLowerCase();
          const level = (c.level || '').toLowerCase();
          const instructor = (c.instructor?.displayName || '').toLowerCase();
          return title.includes(q) || desc.includes(q) || cat.includes(q) || level.includes(q) || instructor.includes(q);
        });

        // Products from API response
        const matchedProducts = productsRes?.data || [];

        // Filter blogs matching title, excerpt, topic, content
        const matchedBlogs = (allBlogs || []).filter((b) => {
          const title = (b.title || '').toLowerCase();
          const excerpt = (b.excerpt || '').toLowerCase();
          const topic = (b.topic || '').toLowerCase();
          return title.includes(q) || excerpt.includes(q) || topic.includes(q);
        });

        setCourses(matchedCourses);
        setProducts(matchedProducts);
        setBlogs(matchedBlogs);
      } catch (err) {
        console.error('Search query execution failed', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [queryParam]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setSearchParams({ q: searchTerm.trim() });
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchParams({});
  };

  const totalResults = courses.length + products.length + blogs.length;

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-[#2B2521] text-left">
      <SEO 
        title={queryParam ? `Search: "${queryParam}" | JADMAA` : "Search | JADMAA"} 
        description="Search across JADMAA courses, training programs, traditional martial arts equipment, store products, and Varmakalai articles."
      />

      {/* Hero Search Header */}
      <section className="bg-white border-b border-[#E8DDD0] py-8 sm:py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-6">
            <span className="text-[11px] font-bold text-[#B12B2B] uppercase tracking-wider inline-flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Universal Search
            </span>
            <h1 className="font-heading font-extrabold text-2xl sm:text-4xl text-[#2B2521]">
              Search JADMAA Academy
            </h1>
            <p className="text-xs sm:text-sm text-[#5C5148] mt-1.5">
              Find courses, training syllabi, store products, books, and research articles.
            </p>
          </div>

          {/* Large Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative max-w-3xl mx-auto">
            <div className="relative flex items-center shadow-sm rounded-2xl bg-[#FAF6F0] border-2 border-[#E8DDD0] focus-within:border-[#B12B2B] focus-within:bg-white transition-all overflow-hidden">
              <div className="pl-4 sm:pl-5 text-[#5C5148]">
                <Search className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
              </div>

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search courses, products, books, martial arts terms..."
                autoFocus
                className="w-full py-3 sm:py-4 pl-3 pr-24 text-sm sm:text-base text-[#2B2521] placeholder-[#5C5148]/60 bg-transparent focus:outline-none"
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg mr-2 transition cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}

              <button
                type="submit"
                className="mr-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-[#2B2521] hover:bg-[#B12B2B] text-white text-xs sm:text-sm font-semibold transition cursor-pointer shrink-0"
              >
                Search
              </button>
            </div>
          </form>

          {/* Quick Tag Recommendations - Clean text links, not bulky buttons */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 mt-4 text-xs text-[#5C5148]">
            <span className="font-semibold text-gray-400">Popular:</span>
            {['Varmakalai', 'Self-Defence', 'Books', 'Herbal', 'Treatment', 'Beginner'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setSearchTerm(tag);
                  setSearchParams({ q: tag });
                }}
                className="text-[#5C5148] hover:text-[#B12B2B] hover:underline underline-offset-4 font-medium transition cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Category Tabs & Filter Navigation - Clean Underline Tabs */}
      {queryParam && (
        <section className="bg-white border-b border-[#E8DDD0] sticky top-16 z-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between overflow-x-auto no-scrollbar">
            <div className="flex space-x-6 sm:space-x-8 shrink-0">
              <button
                type="button"
                onClick={() => setActiveCategory('ALL')}
                className={`flex items-center gap-2 py-3.5 border-b-2 text-xs sm:text-sm transition-colors cursor-pointer ${
                  activeCategory === 'ALL'
                    ? 'border-[#B12B2B] text-[#B12B2B] font-bold'
                    : 'border-transparent text-[#5C5148] hover:text-[#2B2521] font-medium'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>All Results</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    activeCategory === 'ALL'
                      ? 'bg-[#B12B2B]/10 text-[#B12B2B]'
                      : 'bg-black/5 text-[#5C5148]'
                  }`}
                >
                  {totalResults}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory('COURSES')}
                className={`flex items-center gap-2 py-3.5 border-b-2 text-xs sm:text-sm transition-colors cursor-pointer ${
                  activeCategory === 'COURSES'
                    ? 'border-[#B12B2B] text-[#B12B2B] font-bold'
                    : 'border-transparent text-[#5C5148] hover:text-[#2B2521] font-medium'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Courses & Classes</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    activeCategory === 'COURSES'
                      ? 'bg-[#B12B2B]/10 text-[#B12B2B]'
                      : 'bg-black/5 text-[#5C5148]'
                  }`}
                >
                  {courses.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory('PRODUCTS')}
                className={`flex items-center gap-2 py-3.5 border-b-2 text-xs sm:text-sm transition-colors cursor-pointer ${
                  activeCategory === 'PRODUCTS'
                    ? 'border-[#B12B2B] text-[#B12B2B] font-bold'
                    : 'border-transparent text-[#5C5148] hover:text-[#2B2521] font-medium'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Store Products</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    activeCategory === 'PRODUCTS'
                      ? 'bg-[#B12B2B]/10 text-[#B12B2B]'
                      : 'bg-black/5 text-[#5C5148]'
                  }`}
                >
                  {products.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory('BLOGS')}
                className={`flex items-center gap-2 py-3.5 border-b-2 text-xs sm:text-sm transition-colors cursor-pointer ${
                  activeCategory === 'BLOGS'
                    ? 'border-[#B12B2B] text-[#B12B2B] font-bold'
                    : 'border-transparent text-[#5C5148] hover:text-[#2B2521] font-medium'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Articles & Blog</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    activeCategory === 'BLOGS'
                      ? 'bg-[#B12B2B]/10 text-[#B12B2B]'
                      : 'bg-black/5 text-[#5C5148]'
                  }`}
                >
                  {blogs.length}
                </span>
              </button>
            </div>

            <span className="text-xs text-[#5C5148] hidden sm:block shrink-0">
              Query: <strong className="text-[#2B2521]">"{queryParam}"</strong>
            </span>
          </div>
        </section>
      )}

      {/* Main Results Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-3 border-[#B12B2B]/20 border-t-[#B12B2B] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-[#5C5148]">Searching across courses, products and articles...</p>
          </div>
        ) : !queryParam ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#E8DDD0] p-8 max-w-xl mx-auto shadow-2xs">
            <Search className="w-12 h-12 text-[#B12B2B]/30 mx-auto mb-3 stroke-[1.5]" />
            <h3 className="font-heading font-bold text-xl text-[#2B2521]">Type a query to search</h3>
            <p className="text-xs text-[#5C5148] mt-1 max-w-md mx-auto">
              Enter any keyword above to search courses, traditional products, herbal remedies, and blogs.
            </p>
          </div>
        ) : totalResults === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#E8DDD0] p-8 max-w-xl mx-auto shadow-2xs space-y-4">
            <div className="w-14 h-14 bg-red-50 text-[#B12B2B] rounded-2xl flex items-center justify-center mx-auto">
              <Search className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-xl text-[#2B2521]">
                No matches found for "{queryParam}"
              </h3>
              <p className="text-xs text-[#5C5148] mt-1 max-w-md mx-auto">
                We couldn't find any courses, products, or articles matching your keyword. Try a different search term or browse our categories.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                to="/courses"
                className="px-5 py-2.5 bg-[#B12B2B] hover:bg-[#8F2020] text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                Explore Courses
              </Link>
              <Link
                to="/products"
                className="px-5 py-2.5 bg-white border border-[#E8DDD0] hover:bg-[#FAF6F0] text-[#2B2521] rounded-xl text-xs font-bold transition"
              >
                Browse Store
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* 1. COURSES SECTION */}
            {(activeCategory === 'ALL' || activeCategory === 'COURSES') && courses.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#E8DDD0]">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#B12B2B]" />
                    <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#2B2521]">
                      Courses & Programs ({courses.length})
                    </h2>
                  </div>
                  <Link
                    to="/courses"
                    className="text-xs font-bold text-[#B12B2B] hover:underline flex items-center gap-1"
                  >
                    <span>View all courses</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {courses.map((course) => (
                    <Link
                      key={course.id}
                      to={`/courses/${course.slug}`}
                      className="bg-white rounded-2xl border border-[#E8DDD0] shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group hover:border-[#B12B2B]"
                    >
                      <div>
                        {/* Course Thumbnail */}
                        <div className="relative aspect-video w-full bg-gray-100 overflow-hidden">
                          {(course.thumbnail || (course as any).thumbnailUrl) ? (
                            <img
                              src={course.thumbnail || (course as any).thumbnailUrl}
                              alt={course.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#FAF6F0] text-[#B12B2B]">
                              <BookOpen className="w-10 h-10 opacity-30" />
                            </div>
                          )}
                        </div>

                        {/* Course Content */}
                        <div className="p-4 sm:p-5 space-y-1.5">
                          <span className="text-[10px] font-bold text-[#B12B2B] uppercase tracking-wider block">
                            {course.category || 'Varmakalai'}
                          </span>
                          <h3 className="font-heading font-bold text-base text-[#2B2521] group-hover:text-[#B12B2B] transition line-clamp-2">
                            {course.title}
                          </h3>
                          <p className="text-xs text-[#5C5148] line-clamp-2">
                            {course.subtitle || course.description}
                          </p>
                        </div>
                      </div>

                      {/* Course Footer */}
                      <div className="px-4 sm:px-5 py-3 bg-gray-50 border-t border-[#E8DDD0] flex items-center justify-between">
                        <span className="font-bold text-sm text-[#2B2521]">
                          {course.isFree || course.price === 0 ? 'Free' : `₹${course.price?.toLocaleString('en-IN')}`}
                        </span>
                        <span className="text-xs font-bold text-[#B12B2B] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          <span>Details</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 2. PRODUCTS SECTION */}
            {(activeCategory === 'ALL' || activeCategory === 'PRODUCTS') && products.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#E8DDD0]">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-[#B12B2B]" />
                    <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#2B2521]">
                      Store Products ({products.length})
                    </h2>
                  </div>
                  <Link
                    to="/products"
                    className="text-xs font-bold text-[#B12B2B] hover:underline flex items-center gap-1"
                  >
                    <span>View all products</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                  {products.map((product) => {
                    const primaryImg = product.images?.[0] || '/images/placeholder.jpg';
                    return (
                      <Link
                        key={product.id}
                        to={`/products/${product.slug}`}
                        className="bg-white rounded-2xl border border-[#E8DDD0] shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group hover:border-[#B12B2B]"
                      >
                        <div>
                          <div className="aspect-square bg-white relative overflow-hidden flex items-center justify-center p-3 border-b border-gray-100">
                            <ResponsiveImage
                              src={primaryImg}
                              alt={product.name}
                              width={240}
                              height={240}
                              aspectRatio="1/1"
                              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>

                          <div className="p-3 sm:p-4 space-y-1">
                            {product.category?.name && (
                              <span className="text-[10px] font-semibold text-[#5C5148] uppercase tracking-wider block">
                                {product.category.name}
                              </span>
                            )}
                            <h3 className="font-bold text-xs sm:text-sm text-[#2B2521] group-hover:text-[#B12B2B] transition line-clamp-2 leading-tight">
                              {product.name}
                            </h3>
                            <p className="text-[11px] text-[#5C5148] line-clamp-1">
                              {product.description}
                            </p>
                          </div>
                        </div>

                        <div className="p-3 sm:p-4 pt-0 flex items-center justify-between">
                          <span className="font-black text-sm text-[#2B2521]">
                            ₹{product.price?.toLocaleString('en-IN')}
                          </span>
                          <span className="p-1.5 rounded-lg bg-[#FAF6F0] text-[#B12B2B] group-hover:bg-[#B12B2B] group-hover:text-white transition">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. BLOGS & ARTICLES SECTION */}
            {(activeCategory === 'ALL' || activeCategory === 'BLOGS') && blogs.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#E8DDD0]">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#B12B2B]" />
                    <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#2B2521]">
                      Articles & Research ({blogs.length})
                    </h2>
                  </div>
                  <Link
                    to="/blog"
                    className="text-xs font-bold text-[#B12B2B] hover:underline flex items-center gap-1"
                  >
                    <span>View all blogs</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {blogs.map((post) => (
                    <Link
                      key={post.id}
                      to={`/blog/${post.slug}`}
                      className="bg-white rounded-2xl border border-[#E8DDD0] shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group hover:border-[#B12B2B] p-5 space-y-3"
                    >
                      <div>
                        {post.topic && (
                          <span className="text-[10px] font-bold text-[#B12B2B] uppercase tracking-wider block mb-1">
                            {post.topic}
                          </span>
                        )}
                        <h3 className="font-heading font-bold text-base text-[#2B2521] group-hover:text-[#B12B2B] transition line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-xs text-[#5C5148] line-clamp-3 mt-1.5 leading-relaxed">
                          {post.excerpt || post.content}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-[#5C5148]">
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        <span className="font-bold text-[#B12B2B] flex items-center gap-1">
                          Read article <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
};
