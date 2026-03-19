import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = global as unknown as { 
  prisma: PrismaClient,
  pool: Pool
};

const getPrisma = () => {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  console.log('Initializing Prisma with REAL PG adapter...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  const adapter = new PrismaPg(pool as any);

  const prisma = new PrismaClient({
    adapter: adapter as any,
    omit: {}
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
    globalForPrisma.pool = pool;
  }
  return prisma;
};

export const prisma = getPrisma();
export default prisma;
