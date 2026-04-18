/**
 * Manually applies all schema additions without touching existing tables.
 * Run with: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/apply-schema-changes.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function safeAlter(sql: string, description: string): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(sql);
    console.log(`  ✓ ${description}`);
  } catch (err: any) {
    const msg: string = err?.message ?? String(err);
    // 1060 = duplicate column, 1061 = duplicate key, 1050 = table already exists
    if (msg.includes('1060') || msg.includes('1061') || msg.includes('1050') ||
        msg.toLowerCase().includes('duplicate column') ||
        msg.toLowerCase().includes('already exists')) {
      console.log(`  ⏭  ${description} (already exists, skipped)`);
    } else {
      console.error(`  ✗ ${description}: ${msg}`);
      throw err;
    }
  }
}

async function main() {
  console.log('\n=== Applying schema changes ===\n');

  // ── Event: add updated_at ─────────────────────────────────────────────────
  await safeAlter(
    `ALTER TABLE \`Event\` ADD COLUMN \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
    'Event.updated_at'
  );

  // ── TeacherAttendance: add created_at and updated_at ─────────────────────
  await safeAlter(
    `ALTER TABLE \`TeacherAttendance\` ADD COLUMN \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    'TeacherAttendance.created_at'
  );
  await safeAlter(
    `ALTER TABLE \`TeacherAttendance\` ADD COLUMN \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
    'TeacherAttendance.updated_at'
  );

  // ── User: add deleted_at ──────────────────────────────────────────────────
  await safeAlter(
    `ALTER TABLE \`User\` ADD COLUMN \`deleted_at\` DATETIME NULL DEFAULT NULL`,
    'User.deleted_at'
  );
  await safeAlter(
    `ALTER TABLE \`User\` ADD INDEX \`User_deleted_at_idx\` (\`deleted_at\`)`,
    'User.deleted_at index'
  );

  // ── Student: add deleted_at ───────────────────────────────────────────────
  await safeAlter(
    `ALTER TABLE \`Student\` ADD COLUMN \`deleted_at\` DATETIME NULL DEFAULT NULL`,
    'Student.deleted_at'
  );
  await safeAlter(
    `ALTER TABLE \`Student\` ADD INDEX \`Student_school_id_deleted_at_idx\` (\`school_id\`, \`deleted_at\`)`,
    'Student(school_id, deleted_at) index'
  );

  // ── TokenBlacklist ────────────────────────────────────────────────────────
  await safeAlter(
    `CREATE TABLE IF NOT EXISTS \`TokenBlacklist\` (
      \`id\`         VARCHAR(191) NOT NULL,
      \`token_hash\` VARCHAR(191) NOT NULL,
      \`expires_at\` DATETIME NOT NULL,
      \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`TokenBlacklist_token_hash_key\` (\`token_hash\`),
      INDEX \`TokenBlacklist_expires_at_idx\` (\`expires_at\`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    'TokenBlacklist table'
  );

  // ── UserTotpSecret ────────────────────────────────────────────────────────
  await safeAlter(
    `CREATE TABLE IF NOT EXISTS \`UserTotpSecret\` (
      \`id\`         VARCHAR(191) NOT NULL,
      \`user_id\`    VARCHAR(191) NOT NULL,
      \`secret\`     VARCHAR(500) NOT NULL,
      \`verified\`   TINYINT(1) NOT NULL DEFAULT 0,
      \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`UserTotpSecret_user_id_key\` (\`user_id\`),
      CONSTRAINT \`UserTotpSecret_user_id_fkey\` FOREIGN KEY (\`user_id\`) REFERENCES \`User\` (\`id\`) ON DELETE CASCADE
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    'UserTotpSecret table'
  );

  // ── AuditLog ──────────────────────────────────────────────────────────────
  await safeAlter(
    `CREATE TABLE IF NOT EXISTS \`AuditLog\` (
      \`id\`           VARCHAR(191) NOT NULL,
      \`school_id\`    VARCHAR(191) NULL,
      \`performed_by\` VARCHAR(191) NOT NULL,
      \`actor_role\`   VARCHAR(191) NULL,
      \`action\`       VARCHAR(191) NOT NULL,
      \`entity_type\`  VARCHAR(191) NOT NULL,
      \`entity_id\`    VARCHAR(191) NOT NULL,
      \`changes\`      JSON NULL,
      \`ip_address\`   VARCHAR(191) NULL,
      \`created_at\`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      INDEX \`AuditLog_school_id_entity_type_created_at_idx\` (\`school_id\`, \`entity_type\`, \`created_at\`),
      INDEX \`AuditLog_entity_id_entity_type_idx\` (\`entity_id\`, \`entity_type\`),
      INDEX \`AuditLog_performed_by_created_at_idx\` (\`performed_by\`, \`created_at\`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    'AuditLog table'
  );

  console.log('\n=== All schema changes applied. Generating Prisma client... ===\n');
}

main()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
