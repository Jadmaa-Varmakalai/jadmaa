export interface Lesson {
  id: string;
  title: string;
  duration: string;
  isFreePreview?: boolean;
  videoUrl?: string;
  summary?: string;
}

export interface Module {
  id: string;
  title: string;
  description?: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  longDescription?: string;
  thumbnail: string;
  category: 'Varmakalai' | 'Self Defence' | 'Kids' | 'Wellness' | 'Career';
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  duration: string;
  totalLessons: number;
  instructor: {
    name: string;
    title: string;
    avatar: string;
    bio: string;
  };
  price: number;
  originalPrice?: number;
  isFree?: boolean;
  isAvailable?: boolean;
  status?: 'DRAFT' | 'PUBLISHED' | 'HOLD' | 'ARCHIVED' | string;
  isPopular?: boolean;
  rating: number;
  reviewCount: number;
  whatYouWillLearn: string[];
  requirements: string[];
  targetAudience: string[];
  modules: Module[];
  studentsCount?: number;
}

export interface Branch {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  mapEmbedUrl: string;
  image: string;
  isHeadquarters?: boolean;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  location: string;
  content: string;
  rating: number;
  avatar: string;
  courseTaken?: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
  tags: string[];
}

export interface FAQItem {
  id: string;
  category: 'General' | 'Courses' | 'Training' | 'Healing & Therapy' | 'Branches';
  question: string;
  answer: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | 'SUPER_ADMIN';
  avatar?: string;
  enrolledCourses: string[]; // course IDs
  progress: Record<string, number>; // courseId -> percentage
}

export interface LiveClass {
  id: string;
  title: string;
  courseTitle: string;
  instructorName: string;
  scheduledTime: string;
  meetUrl: string;
  recordingUrl?: string;
  status: 'upcoming' | 'live' | 'completed';
}
