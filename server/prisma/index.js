import { PrismaClient } from '@prisma/client';

// Add prisma to the global object in development to prevent 
// exhausting database connections by creating a new PrismaClient on every hot reload.
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
