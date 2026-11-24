import { PrismaClient, CourseStatus } from '@prisma/client';
import * as dotenv from 'dotenv';
import fs from 'fs';

const envConfig = dotenv.parse(fs.readFileSync('.env'))
for (const k in envConfig) {
  process.env[k] = envConfig[k]
}

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL || process.env.DIRECT_URL
});

async function main() {
  // Get founder instructor
  const founderUser = await prisma.user.findFirst({
    where: { name: 'Mr. Bojagarajan' },
    include: { instructorProfile: true }
  });
  
  if (!founderUser || !founderUser.instructorProfile) {
    throw new Error('Founder not found');
  }
  
  const instructorId = founderUser.instructorProfile.id;

  // Clear existing courses (and their modules/lessons)
  await prisma.lesson.deleteMany({});
  await prisma.courseModule.deleteMany({});
  await prisma.enrollment.deleteMany({});
  await prisma.course.deleteMany({});

  const coursesData = [
    {
      slug: "1-basic-varmakalai-training",
      title: "Basic Varma Training Course | Learn Varmakalai from Scratch | JADMAA",
      subtitle: "Learn the fundamentals of Varmakalai",
      description: "Basic Varma Training at JADMAA — learn the fundamentals of Varmakalai: vital points, stances, breathing and safe practice. For beginners in Thanjavur, Kumbakonam and Ariyalur.",
      longDescription: "Basic Varma Training at JADMAA — learn the fundamentals of Varmakalai: vital points, stances, breathing and safe practice. For beginners in Thanjavur, Kumbakonam and Ariyalur.",
      thumbnailUrl: "https://jadmaa.com/wp-content/uploads/2026/07/course-basic.jpg",
      category: "Varmakalai",
      level: "Beginner",
      duration: "4 Weeks",
      price: 1999,
      isFree: false,
      status: CourseStatus.PUBLISHED,
      instructorId,
    },
    {
      slug: "2-intermediate-varmakalai-training",
      title: "Intermediate Varmakalai Training Course | JADMAA Varmakalai",
      subtitle: "Deeper Varma point work and applied technique",
      description: "Intermediate Varmakalai training for students who know the basics — deeper Varma point work, applied technique and traditional practice under a qualified Asan in Tamil Nadu.",
      longDescription: "Intermediate Varmakalai training for students who know the basics — deeper Varma point work, applied technique and traditional practice under a qualified Asan in Tamil Nadu.",
      thumbnailUrl: "https://jadmaa.com/wp-content/uploads/2026/07/course-intermediate.jpg",
      category: "Varmakalai",
      level: "Intermediate",
      duration: "6 Weeks",
      price: 2999,
      isFree: false,
      status: CourseStatus.PUBLISHED,
      instructorId,
    },
    {
      slug: "4-kids-self-defence-training",
      title: "Kids Self-Defence Classes in Thanjavur | Varmakalai for Children | JADMAA",
      subtitle: "Builds confidence, focus and discipline",
      description: "Self-defence classes for children built on traditional Varmakalai. Builds confidence, focus and discipline in a safe, supervised setting. Branches in Thanjavur, Kumbakonam and Ariyalur.",
      longDescription: "Self-defence classes for children built on traditional Varmakalai. Builds confidence, focus and discipline in a safe, supervised setting. Branches in Thanjavur, Kumbakonam and Ariyalur.",
      thumbnailUrl: "https://jadmaa.com/wp-content/uploads/2026/07/course-kids.jpg",
      category: "Kids",
      level: "Beginner",
      duration: "8 Weeks",
      price: 1499,
      isFree: false,
      status: CourseStatus.PUBLISHED,
      instructorId,
    },
    {
      slug: "5-self-defence-training-for-all",
      title: "Self-Defence Training for All Ages | Varmakalai Classes | JADMAA",
      subtitle: "Practical self-defence training rooted in Varmakalai",
      description: "Practical self-defence training rooted in Varmakalai, open to all ages and fitness levels. Learn real techniques you can actually use. Classes across Thanjavur, Kumbakonam and Ariyalur.",
      longDescription: "Practical self-defence training rooted in Varmakalai, open to all ages and fitness levels. Learn real techniques you can actually use. Classes across Thanjavur, Kumbakonam and Ariyalur.",
      thumbnailUrl: "https://jadmaa.com/wp-content/uploads/2026/07/course-selfdefence-all.jpg",
      category: "Self-Defence",
      level: "All Levels",
      duration: "6 Weeks",
      price: 1999,
      isFree: false,
      status: CourseStatus.PUBLISHED,
      instructorId,
    },
    {
      slug: "6-womens-self-defence-program",
      title: "Women's Self-Defence Classes in Tamil Nadu | JADMAA Varmakalai",
      subtitle: "Supportive women-friendly environment",
      description: "Women's self-defence program at JADMAA — practical Varmakalai techniques for real situations, taught in a supportive women-friendly environment. Thanjavur, Kumbakonam and Ariyalur.",
      longDescription: "Women's self-defence program at JADMAA — practical Varmakalai techniques for real situations, taught in a supportive women-friendly environment. Thanjavur, Kumbakonam and Ariyalur.",
      thumbnailUrl: "https://jadmaa.com/wp-content/uploads/2026/07/course-womens.jpg",
      category: "Self-Defence",
      level: "All Levels",
      duration: "4 Weeks",
      price: 1999,
      isFree: false,
      status: CourseStatus.PUBLISHED,
      instructorId,
    },
    {
      slug: "7-weight-loss-training",
      title: "Weight Loss Training through Varmakalai | JADMAA Varmakalai",
      subtitle: "Traditional Varmakalai-based movement for fitness",
      description: "Lose weight the traditional way — Varmakalai-based movement, breathing and conditioning that builds strength and stamina alongside fat loss. Branch classes in Tamil Nadu.",
      longDescription: "Lose weight the traditional way — Varmakalai-based movement, breathing and conditioning that builds strength and stamina alongside fat loss. Branch classes in Tamil Nadu.",
      thumbnailUrl: "https://jadmaa.com/wp-content/uploads/2026/07/course-weightloss-career.jpg",
      category: "Fitness",
      level: "All Levels",
      duration: "8 Weeks",
      price: 2499,
      isFree: false,
      status: CourseStatus.PUBLISHED,
      instructorId,
    },
    {
      slug: "varmakalai-foundation-free-starter-course",
      title: "Free Varmakalai Foundation Course Online | JADMAA Varmakalai",
      subtitle: "Start Varmakalai free",
      description: "Start Varmakalai free. Our online foundation course covers the basics of Varma points, breathing and posture — no fee, no prior experience needed. Taught by JADMAA, Thanjavur.",
      longDescription: "Start Varmakalai free. Our online foundation course covers the basics of Varma points, breathing and posture — no fee, no prior experience needed. Taught by JADMAA, Thanjavur.",
      thumbnailUrl: "https://jadmaa.com/wp-content/uploads/2026/07/logo-1.png",
      category: "Varmakalai",
      level: "Beginner",
      duration: "1 Week",
      price: 0,
      isFree: true,
      status: CourseStatus.PUBLISHED,
      instructorId,
    }
  ];

  for (const cData of coursesData) {
    const course = await prisma.course.create({
      data: {
        slug: cData.slug,
        title: cData.title,
        subtitle: cData.subtitle,
        description: cData.description,
        longDescription: cData.longDescription,
        thumbnailUrl: cData.thumbnailUrl,
        category: cData.category,
        level: cData.level,
        duration: cData.duration,
        price: cData.price,
        isFree: cData.isFree,
        status: cData.status,
        instructorId: cData.instructorId,
      }
    });

    // Create a default module and lesson for it
    const mod = await prisma.courseModule.create({
      data: {
        courseId: course.id,
        title: 'Introduction',
        sortOrder: 1
      }
    });
    
    await prisma.lesson.create({
      data: {
        moduleId: mod.id,
        title: 'Welcome to the Course',
        durationSeconds: 300,
        sortOrder: 1,
        isPreview: true,
        youtubeVideoId: 'dQw4w9WgXcQ' // dummy video
      }
    });
  }

  console.log("Successfully seeded accurate courses from jadmaa.com");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
