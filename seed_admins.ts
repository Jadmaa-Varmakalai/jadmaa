import { PrismaClient } from '@prisma/client';
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
  await prisma.user.updateMany({
    where: {
      OR: [
        { email: 'info@jadmaa.com' },
        { name: 'Mr. Bojagarajan' }
      ]
    },
    data: {
      isAdmin: true
    }
  });
  console.log('Updated info@jadmaa.com and Mr. Bojagarajan to have isAdmin = true');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
