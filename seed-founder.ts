import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasourceUrl: 'postgresql://postgres.kakomchteolqajcjjgtr:Jadmaa@2026@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
});

async function main() {
  const adminEmail = 'info@jadmaa.com';
  let adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
  
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Mr. Bojagarajan',
        passwordHash: 'seeded',
        role: 'SUPER_ADMIN',
        isActive: true,
      }
    });
  } else {
    adminUser = await prisma.user.update({
      where: { email: adminEmail },
      data: { name: 'Mr. Bojagarajan', role: 'SUPER_ADMIN' }
    });
  }
  
  // Find or Create Mr. Bojagarajan as instructor
  let founder = await prisma.instructor.findUnique({ where: { userId: adminUser.id } });
  if (!founder) {
    founder = await prisma.instructor.create({
      data: {
        userId: adminUser.id,
        displayName: 'Mr. Bojagarajan',
        title: 'Founder and Chief Instructor',
        bio: 'Founder of JADMAA',
        isActive: true,
      }
    });
  } else {
    founder = await prisma.instructor.update({
      where: { id: founder.id },
      data: {
        displayName: 'Mr. Bojagarajan',
        title: 'Founder and Chief Instructor',
      }
    });
  }

  // Update all courses to belong to Mr. Bojagarajan
  await prisma.course.updateMany({
    data: { instructorId: founder.id }
  });

  // Now delete all other instructors
  await prisma.instructor.deleteMany({
    where: { id: { not: founder.id } }
  });
  
  console.log("Successfully seeded Mr. Bojagarajan, assigned all courses to him, and deleted other instructors.");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
