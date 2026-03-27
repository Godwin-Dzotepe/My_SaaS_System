require('dotenv').config();
const { Client } = require('pg');
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

function quotePgIdentifier(identifier) {
  return `"${identifier.replace(/"/g, '""')}"`;
}

function quoteMySqlIdentifier(identifier) {
  return `\`${identifier.replace(/`/g, '``')}\``;
}

function normalizeValue(value) {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return JSON.stringify(value);
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
}

function topologicalSortTables(tables, dependencies) {
  const indegree = new Map();
  const graph = new Map();

  for (const table of tables) {
    indegree.set(table, 0);
    graph.set(table, []);
  }

  for (const [child, parent] of dependencies) {
    if (!indegree.has(child) || !indegree.has(parent)) continue;
    graph.get(parent).push(child);
    indegree.set(child, indegree.get(child) + 1);
  }

  const queue = [];
  for (const [table, degree] of indegree.entries()) {
    if (degree === 0) queue.push(table);
  }

  const sorted = [];
  while (queue.length > 0) {
    const current = queue.shift();
    sorted.push(current);

    for (const neighbor of graph.get(current)) {
      indegree.set(neighbor, indegree.get(neighbor) - 1);
      if (indegree.get(neighbor) === 0) queue.push(neighbor);
    }
  }

  const unresolved = tables.filter((table) => !sorted.includes(table));
  return sorted.concat(unresolved);
}

async function main() {
  const pgUrl = process.env.PG_DATABASE_URL;
  const mysqlUrl = process.env.MYSQL_DATABASE_URL || process.env.DATABASE_URL;

  if (!pgUrl) {
    throw new Error('PG_DATABASE_URL is required for source PostgreSQL connection.');
  }
  if (!mysqlUrl) {
    throw new Error('MYSQL_DATABASE_URL or DATABASE_URL is required for target MySQL connection.');
  }

  const pgClient = new Client({ connectionString: pgUrl });
  const mysqlConfig = parseMySqlUrl(mysqlUrl);
  const mysqlConn = await mysql.createConnection(mysqlConfig);

  try {
    await pgClient.connect();

    const tablesResult = await pgClient.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name <> '_prisma_migrations'
      ORDER BY table_name
    `);
    const tableNames = tablesResult.rows.map((row) => row.table_name);

    const fkResult = await pgClient.query(`
      SELECT
        tc.table_name AS child_table,
        ccu.table_name AS parent_table
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.constraint_column_usage AS ccu
        ON tc.constraint_name = ccu.constraint_name
       AND tc.table_schema = ccu.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
    `);

    const dependencies = fkResult.rows.map((row) => [row.child_table, row.parent_table]);
    const orderedTables = topologicalSortTables(tableNames, dependencies);

    await mysqlConn.query('SET FOREIGN_KEY_CHECKS = 0');

    for (const tableName of orderedTables) {
      const columnsResult = await pgClient.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);

      const columns = columnsResult.rows.map((row) => row.column_name);
      if (columns.length === 0) continue;

      const quotedPgCols = columns.map(quotePgIdentifier).join(', ');
      const sourceRows = await pgClient.query(`SELECT ${quotedPgCols} FROM ${quotePgIdentifier(tableName)}`);

      await mysqlConn.query(`DELETE FROM ${quoteMySqlIdentifier(tableName)}`);

      if (sourceRows.rows.length === 0) {
        console.log(`Copied ${tableName}: 0 rows`);
        continue;
      }

      const columnList = columns.map(quoteMySqlIdentifier).join(', ');
      const chunkSize = 500;

      for (let i = 0; i < sourceRows.rows.length; i += chunkSize) {
        const chunk = sourceRows.rows.slice(i, i + chunkSize);
        const placeholders = chunk
          .map(() => `(${columns.map(() => '?').join(', ')})`)
          .join(', ');

        const values = [];
        for (const row of chunk) {
          for (const column of columns) {
            values.push(normalizeValue(row[column]));
          }
        }

        const insertSql = `INSERT INTO ${quoteMySqlIdentifier(tableName)} (${columnList}) VALUES ${placeholders}`;
        await mysqlConn.query(insertSql, values);
      }

      console.log(`Copied ${tableName}: ${sourceRows.rows.length} rows`);
    }

    await mysqlConn.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('PostgreSQL -> MySQL data migration complete.');
  } finally {
    await pgClient.end();
    await mysqlConn.end();
  }
}

main().catch((error) => {
  console.error('Data migration failed:', error);
  process.exit(1);
});

