import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL
});

async function main() {
  const courses = await prisma.course.findMany();
  console.log("Courses in DB:", courses.length);
}
main().catch(console.error).finally(() => prisma.$disconnect());
