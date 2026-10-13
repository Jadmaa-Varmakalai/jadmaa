import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

function sanitizeDbUrl(raw?: string): string | undefined {
  if (!raw) return undefined;
  let url = raw.trim();
  // Strip env var prefix if copied as key=value
  url = url.replace(/^(DATABASE_URL|DIRECT_URL)=\s*/i, '').trim();
  // Strip surrounding quotes
  url = url.replace(/^['"]+|['"]+$/g, '').trim();

  if (!url) return undefined;

  // Handle special characters in password if unencoded
  // format: postgresql://user:password@host:port/database?params
  try {
    const match = url.match(/^(postgres(?:ql)?:\/\/)([^:]+):(.+)@([^@\/]+)(:\d+)?(\/[^?]*)?(\?.*)?$/);
    if (match) {
      const [, protocol, user, pass, host, port, dbPath, query] = match;
      if (pass.includes('@') || pass.includes('#') || pass.includes('$')) {
        const encodedPass = encodeURIComponent(decodeURIComponent(pass));
        url = `${protocol}${user}:${encodedPass}@${host}${port || ''}${dbPath || ''}${query || ''}`;
      }
    }
  } catch {
    // Keep URL as-is if regex parsing fails
  }

  // Ensure connection_limit=1 for Supabase pooler / serverless environments to prevent pool exhaustion
  if (url.includes('pooler.supabase.com') || url.includes('pgbouncer=true')) {
    if (!url.includes('connection_limit=')) {
      const sep = url.includes('?') ? '&' : '?';
      url = `${url}${sep}connection_limit=1`;
    }
  }

  return url;
}

const dbUrl = sanitizeDbUrl(process.env.DATABASE_URL || process.env.DIRECT_URL);

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasourceUrl: dbUrl || undefined,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

// Always cache instance on globalThis in all environments (including serverless production)
// to prevent connection leaks across warm lambda container invocations
globalForPrisma.prisma = prisma;

