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
      slug: "varmakalai-foundation-free-starter-course",
      title: "Free Varmakalai Foundation Course Online | JADMAA Varmakalai",
      subtitle: "Start Varmakalai free",
      description: "Start Varmakalai free. Our online foundation course covers the basics of Varma points, breathing and posture — no fee, no prior experience needed. Taught by JADMAA, Thanjavur.",
      longDescription: "Start Varmakalai free. Our online foundation course covers the basics of Varma points, breathing and posture — no fee, no prior experience needed. Taught by JADMAA, Thanjavur.",
      thumbnailUrl: "/images/course-basic.jpg",
      category: "Varmakalai",
      level: "Beginner",
      duration: "1 Week",
      price: 0,
      isFree: true,
      status: CourseStatus.PUBLISHED,
      instructorId,
    },
    {
      slug: "7-weight-loss-training",
      title: "Weight Loss Training through Varmakalai | JADMAA Varmakalai",
      subtitle: "Traditional Varmakalai-based movement for fitness",
      description: "Lose weight the traditional way — Varmakalai-based movement, breathing and conditioning that builds strength and stamina alongside fat loss. Branch classes in Tamil Nadu.",
      longDescription: "Lose weight the traditional way — Varmakalai-based movement, breathing and conditioning that builds strength and stamina alongside fat loss. Branch classes in Tamil Nadu.",
      thumbnailUrl: "/images/course-weightloss-career.jpg",
      category: "Fitness",
      level: "All Levels",
      duration: "8 Weeks",
      price: 2499,
      isFree: false,
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
