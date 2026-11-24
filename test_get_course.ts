import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL
});

async function main() {
  const course = await prisma.course.findUnique({
    where: { slug: '1-basic-varmakalai-training' },
    include: {
      instructor: { select: { displayName: true, title: true, avatarUrl: true, bio: true } },
      modules: {
        include: { lessons: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { sortOrder: 'asc' }
      }
    }
  });
  console.log(course?.id, course?.title, course?.instructor);
}
main().catch(console.error).finally(() => prisma.$disconnect());
