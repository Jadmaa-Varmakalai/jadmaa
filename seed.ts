import { prisma } from './server/db.js';
import { mockCourses } from './src/data/courses.js';

async function main() {
  console.log('Start seeding...');
  
  // Create a default admin user
  const admin = await prisma.user.upsert({
    where: { email: 'info@jadmaa.com' },
    update: {},
    create: {
      name: 'Mr. Bojagarajan',
      email: 'info@jadmaa.com',
      passwordHash: 'hashed_password',
      role: 'SUPER_ADMIN',
      isAdmin: true
    }
  });

  for (const mc of mockCourses) {
    // 1. Ensure instructor exists
    let instructor = await prisma.instructor.findFirst({
      where: { displayName: mc.instructor.name }
    });

    if (!instructor) {
      // Create user for instructor
      const user = await prisma.user.create({
        data: {
          name: mc.instructor.name,
          email: `${mc.instructor.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}@jadmaa.com`,
          passwordHash: 'hashed_password',
          role: 'INSTRUCTOR',
          avatarUrl: mc.instructor.avatar
        }
      });

      instructor = await prisma.instructor.create({
        data: {
          userId: user.id,
          displayName: mc.instructor.name,
          title: mc.instructor.title,
          bio: mc.instructor.bio,
          avatarUrl: mc.instructor.avatar
        }
      });
    }

    // 2. Create Course
    const course = await prisma.course.upsert({
      where: { slug: mc.slug },
      update: {},
      create: {
        title: mc.title,
        slug: mc.slug,
        subtitle: mc.subtitle,
        description: mc.description,
        longDescription: mc.longDescription,
        thumbnailUrl: mc.thumbnail,
        category: mc.category,
        level: mc.level,
        duration: mc.duration,
        price: mc.price,
        isFree: mc.price === 0,
        status: 'PUBLISHED',
        instructorId: instructor.id,
      }
    });

    // 3. Create Modules & Lessons
    for (let mIndex = 0; mIndex < mc.modules.length; mIndex++) {
      const mm = mc.modules[mIndex];
      const module = await prisma.courseModule.create({
        data: {
          courseId: course.id,
          title: mm.title,
          sortOrder: mIndex
        }
      });

      for (let lIndex = 0; lIndex < mm.lessons.length; lIndex++) {
        const ml = mm.lessons[lIndex];
        const durationMatch = ml.duration.match(/(\d+)/);
        const durationMins = durationMatch ? parseInt(durationMatch[1], 10) : 0;
        
        await prisma.lesson.create({
          data: {
            moduleId: module.id,
            title: ml.title,
            durationSeconds: durationMins * 60,
            sortOrder: lIndex,
            isPreview: ml.isFreePreview || false
          }
        });
      }
    }
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
