import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const globalForPrisma = global as unknown as {
  prisma?: PrismaClient;
  prismaAdapter?: PrismaMariaDb;
};

const getDatabaseUrl = () => {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set. Prisma cannot connect without it.');
  }
  return databaseUrl;
};

const getDatabaseProtocol = (databaseUrl: string) => {
  try {
    return new URL(databaseUrl).protocol.replace(':', '').toLowerCase();
  } catch {
    throw new Error('DATABASE_URL is invalid. Expected a full connection URL.');
  }
};

const getMariaDbConfig = (databaseUrl: string) => {
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

  const databaseUrl = getDatabaseUrl();
  const protocol = getDatabaseProtocol(databaseUrl);
  if (protocol !== 'mysql' && protocol !== 'mariadb') {
    throw new Error(
      `DATABASE_URL protocol "${protocol}" is not supported by this app. Use a MySQL/MariaDB connection URL.`
    );
  }

  const adapter =
    globalForPrisma.prismaAdapter ??
    new PrismaMariaDb(getMariaDbConfig(databaseUrl));

  const prisma = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
    globalForPrisma.prismaAdapter = adapter;
  }
  return prisma;
};

export const prisma = getPrisma();
export default prisma;

