import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL
});

async function main() {
  const courses = await prisma.course.findMany({
    select: { slug: true }
  });
  console.log(courses.map(c => c.slug));
}
main().catch(console.error).finally(() => prisma.$disconnect());
