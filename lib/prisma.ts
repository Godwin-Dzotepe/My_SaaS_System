import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const globalForPrisma = global as unknown as {
  prisma?: PrismaClient
  prismaAdapter?: PrismaMariaDb
};

const getMariaDbConfig = () => {
  const databaseUrl = process.env.DATABASE_URL ?? '';
  const parsed = new URL(databaseUrl);

  return {
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password || ''),
    database: decodeURIComponent(parsed.pathname.replace(/^\//, '')),
  };
};

const getPrisma = () => {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const adapter =
    globalForPrisma.prismaAdapter ??
    new PrismaMariaDb(getMariaDbConfig());

  const prisma = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
    globalForPrisma.prismaAdapter = adapter;
  }
  return prisma;
};

export const prisma = getPrisma();
export default prisma;

