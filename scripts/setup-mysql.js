require('dotenv').config();
const mysql = require('mysql2/promise');

function parseMySqlUrl(urlString) {
  const url = new URL(urlString);
  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password || ''),
    database: decodeURIComponent(url.pathname.replace(/^\//, '')),
  };
}

async function main() {
  const targetUrl = process.env.MYSQL_DATABASE_URL || process.env.DATABASE_URL;
  if (!targetUrl) {
    throw new Error('DATABASE_URL or MYSQL_DATABASE_URL must be set.');
  }

  const config = parseMySqlUrl(targetUrl);
  if (!config.database) {
    throw new Error('MySQL URL must include a database name.');
  }

  const connection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    multipleStatements: true,
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await connection.end();

  console.log(`MySQL database ready: ${config.database}`);
}

main().catch((error) => {
  console.error('Failed to prepare MySQL database:', error);
  process.exit(1);
});
