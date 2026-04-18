import { prisma } from '@/lib/prisma';

export type AiSchoolSetting = {
  schoolId: string;
  aiEnabled: boolean;
  telegramChatId: string | null;
  lastReportSentAt: Date | null;
  updatedAt: Date | null;
};

export type AiReportRecord = {
  id: string;
  schoolId: string | null;
  reportScope: 'school' | 'global';
  reportTitle: string;
  reportBody: string;
  sentToTelegram: boolean;
  telegramError: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
  estimatedCostUsd: number | null;
  createdAt: Date;
};

let ensureTablesPromise: Promise<void> | null = null;

function normalizeDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

async function ensureAiTables() {
  if (!ensureTablesPromise) {
    ensureTablesPromise = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS ai_school_settings (
          school_id VARCHAR(191) NOT NULL,
          ai_enabled TINYINT(1) NOT NULL DEFAULT 0,
          telegram_chat_id VARCHAR(191) NULL,
          last_report_sent_at DATETIME NULL,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (school_id)
        )
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS ai_reports (
          id VARCHAR(191) NOT NULL,
          school_id VARCHAR(191) NULL,
          report_scope VARCHAR(32) NOT NULL,
          report_title VARCHAR(255) NOT NULL,
          report_body LONGTEXT NOT NULL,
          sent_to_telegram TINYINT(1) NOT NULL DEFAULT 0,
          telegram_error TEXT NULL,
          prompt_tokens INT NULL DEFAULT NULL,
          completion_tokens INT NULL DEFAULT NULL,
          estimated_cost_usd DECIMAL(10,6) NULL DEFAULT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id)
        )
      `);

      // Add cost columns to existing tables (safe — ignores duplicate column errors)
      for (const col of [
        'ALTER TABLE ai_reports ADD COLUMN prompt_tokens INT NULL DEFAULT NULL',
        'ALTER TABLE ai_reports ADD COLUMN completion_tokens INT NULL DEFAULT NULL',
        'ALTER TABLE ai_reports ADD COLUMN estimated_cost_usd DECIMAL(10,6) NULL DEFAULT NULL',
      ]) {
        await prisma.$executeRawUnsafe(col).catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          // 1060 = Duplicate column name — safe to ignore
          if (!msg.includes('1060') && !msg.toLowerCase().includes('duplicate column')) throw err;
        });
      }
    })().catch((error) => {
      ensureTablesPromise = null;
      throw error;
    });
  }

  await ensureTablesPromise;
}

export async function getAiSchoolSetting(schoolId: string): Promise<AiSchoolSetting> {
  await ensureAiTables();

  const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `
      SELECT school_id, ai_enabled, telegram_chat_id, last_report_sent_at, updated_at
      FROM ai_school_settings
      WHERE school_id = ?
      LIMIT 1
    `,
    schoolId
  );

  const row = rows[0];
  if (!row) {
    return {
      schoolId,
      aiEnabled: false,
      telegramChatId: null,
      lastReportSentAt: null,
      updatedAt: null,
    };
  }

  return {
    schoolId: String(row.school_id),
    aiEnabled: Number(row.ai_enabled) === 1,
    telegramChatId: row.telegram_chat_id ? String(row.telegram_chat_id) : null,
    lastReportSentAt: normalizeDate(row.last_report_sent_at),
    updatedAt: normalizeDate(row.updated_at),
  };
}

export async function getAiSchoolSettingsMap(): Promise<Record<string, AiSchoolSetting>> {
  await ensureAiTables();

  const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(`
    SELECT school_id, ai_enabled, telegram_chat_id, last_report_sent_at, updated_at
    FROM ai_school_settings
  `);

  const map: Record<string, AiSchoolSetting> = {};
  for (const row of rows) {
    const schoolId = String(row.school_id);
    map[schoolId] = {
      schoolId,
      aiEnabled: Number(row.ai_enabled) === 1,
      telegramChatId: row.telegram_chat_id ? String(row.telegram_chat_id) : null,
      lastReportSentAt: normalizeDate(row.last_report_sent_at),
      updatedAt: normalizeDate(row.updated_at),
    };
  }

  return map;
}

export async function upsertAiSchoolSetting(params: {
  schoolId: string;
  aiEnabled: boolean;
  telegramChatId?: string | null;
  lastReportSentAt?: Date | null;
}) {
  await ensureAiTables();

  const telegramChatId = params.telegramChatId ?? null;
  const lastReportSentAt = params.lastReportSentAt ?? null;

  await prisma.$executeRawUnsafe(
    `
      INSERT INTO ai_school_settings (school_id, ai_enabled, telegram_chat_id, last_report_sent_at)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        ai_enabled = VALUES(ai_enabled),
        telegram_chat_id = VALUES(telegram_chat_id),
        last_report_sent_at = VALUES(last_report_sent_at)
    `,
    params.schoolId,
    params.aiEnabled ? 1 : 0,
    telegramChatId,
    lastReportSentAt
  );

  return getAiSchoolSetting(params.schoolId);
}

export async function saveAiReport(params: {
  schoolId?: string | null;
  reportScope: 'school' | 'global';
  reportTitle: string;
  reportBody: string;
  sentToTelegram: boolean;
  telegramError?: string | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
  estimatedCostUsd?: number | null;
}) {
  await ensureAiTables();

  const id = crypto.randomUUID();

  await prisma.$executeRawUnsafe(
    `
      INSERT INTO ai_reports (
        id,
        school_id,
        report_scope,
        report_title,
        report_body,
        sent_to_telegram,
        telegram_error,
        prompt_tokens,
        completion_tokens,
        estimated_cost_usd
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    id,
    params.schoolId ?? null,
    params.reportScope,
    params.reportTitle,
    params.reportBody,
    params.sentToTelegram ? 1 : 0,
    params.telegramError ?? null,
    params.promptTokens ?? null,
    params.completionTokens ?? null,
    params.estimatedCostUsd ?? null
  );

  return id;
}

export async function listRecentAiReports(limit = 20): Promise<AiReportRecord[]> {
  await ensureAiTables();

  const safeLimit = Math.max(1, Math.min(limit, 100));

  const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `
      SELECT id, school_id, report_scope, report_title, report_body, sent_to_telegram, telegram_error, prompt_tokens, completion_tokens, estimated_cost_usd, created_at
      FROM ai_reports
      ORDER BY created_at DESC
      LIMIT ${safeLimit}
    `
  );

  return rows.map((row) => ({
    id: String(row.id),
    schoolId: row.school_id ? String(row.school_id) : null,
    reportScope: String(row.report_scope) === 'global' ? 'global' : 'school',
    reportTitle: String(row.report_title),
    reportBody: String(row.report_body),
    sentToTelegram: Number(row.sent_to_telegram) === 1,
    telegramError: row.telegram_error ? String(row.telegram_error) : null,
    promptTokens: row.prompt_tokens != null ? Number(row.prompt_tokens) : null,
    completionTokens: row.completion_tokens != null ? Number(row.completion_tokens) : null,
    estimatedCostUsd: row.estimated_cost_usd != null ? Number(row.estimated_cost_usd) : null,
    createdAt: normalizeDate(row.created_at) || new Date(),
  }));
}

export async function deleteAiReport(id: string): Promise<void> {
  await ensureAiTables();
  await prisma.$executeRawUnsafe(`DELETE FROM ai_reports WHERE id = ?`, id);
}

export async function deleteAllAiReports(): Promise<void> {
  await ensureAiTables();
  await prisma.$executeRawUnsafe(`DELETE FROM ai_reports`);
}

export async function listRecentAiReportsForSchool(schoolId: string, limit = 10): Promise<AiReportRecord[]> {
  await ensureAiTables();

  const safeLimit = Math.max(1, Math.min(limit, 50));
  const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `
      SELECT id, school_id, report_scope, report_title, report_body, sent_to_telegram, telegram_error, prompt_tokens, completion_tokens, estimated_cost_usd, created_at
      FROM ai_reports
      WHERE school_id = ?
      ORDER BY created_at DESC
      LIMIT ${safeLimit}
    `,
    schoolId
  );

  return rows.map((row) => ({
    id: String(row.id),
    schoolId: row.school_id ? String(row.school_id) : null,
    reportScope: String(row.report_scope) === 'global' ? 'global' : 'school',
    reportTitle: String(row.report_title),
    reportBody: String(row.report_body),
    sentToTelegram: Number(row.sent_to_telegram) === 1,
    telegramError: row.telegram_error ? String(row.telegram_error) : null,
    promptTokens: row.prompt_tokens != null ? Number(row.prompt_tokens) : null,
    completionTokens: row.completion_tokens != null ? Number(row.completion_tokens) : null,
    estimatedCostUsd: row.estimated_cost_usd != null ? Number(row.estimated_cost_usd) : null,
    createdAt: normalizeDate(row.created_at) || new Date(),
  }));
}
