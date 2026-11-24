import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL
});

async function main() {
  const courses = await prisma.course.findMany({
    select: { id: true, title: true, slug: true, status: true, thumbnailUrl: true }
  });
  console.log("Courses in DB:", JSON.stringify(courses, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
