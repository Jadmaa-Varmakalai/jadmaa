import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
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
  const email = 'info@jadmaa.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMeImmediately123!';
  const passwordHash = await bcrypt.hash(password, 10);

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    await prisma.user.update({
      where: { email },
      data: {
        passwordHash,
        role: 'SUPER_ADMIN'
      }
    });
    console.log(`User ${email} updated to SUPER_ADMIN with new password.`);
  } else {
    await prisma.user.create({
      data: {
        name: 'Jadmaa Admin',
        email,
        passwordHash,
        role: 'SUPER_ADMIN'
      }
    });
    console.log(`User ${email} created as SUPER_ADMIN.`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
