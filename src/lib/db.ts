// src/lib/db.ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// We must explicitly use the adapter for Prisma 7 + Supabase Pooler
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in your environment.");
}

const adapter = new PrismaPg({ connectionString });

const globalForPrisma = globalThis as unknown as { 
  prisma: PrismaClient | undefined 
};

// Use existing instance in dev to prevent hot-reload connection leaks
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}