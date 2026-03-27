const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

function getMariaDbConfig() {
  const databaseUrl = process.env.DATABASE_URL || '';
  const parsed = new URL(databaseUrl);

  return {
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username || ''),
    password: decodeURIComponent(parsed.password || ''),
    database: decodeURIComponent(parsed.pathname.replace(/^\//, '')),
  };
}

function createPrismaClient() {
  return new PrismaClient({
    adapter: new PrismaMariaDb(getMariaDbConfig()),
  });
}

module.exports = {
  createPrismaClient,
  getMariaDbConfig,
};
