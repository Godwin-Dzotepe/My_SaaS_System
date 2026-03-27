import { prisma } from '@/lib/prisma';

type SchoolColumnSupport = {
  logo_url: boolean;
  sms_username: boolean;
  isActive: boolean;
  deactivationMessage: boolean;
};

let cachedSchoolColumnSupport: SchoolColumnSupport | null = null;

export function getSupportedSchoolData(data: Record<string, unknown>) {
  const schoolModel = (prisma as any)?._runtimeDataModel?.models?.School;
  const fields = schoolModel?.fields;
  const supportedFields = new Set(
    Array.isArray(fields)
      ? fields.map((field: any) => field?.name).filter(Boolean)
      : fields && typeof fields === 'object'
        ? Object.keys(fields)
        : []
  );

  const filteredEntries = Object.entries(data).filter(([key]) => supportedFields.has(key));
  const unsupportedFields = Object.keys(data).filter((key) => !supportedFields.has(key));

  return {
    data: Object.fromEntries(filteredEntries),
    unsupportedFields,
  };
}

export async function getSchoolColumnSupport(): Promise<SchoolColumnSupport> {
  if (cachedSchoolColumnSupport) {
    return cachedSchoolColumnSupport;
  }

  try {
    let columns: Array<{ column_name: string }> = [];

    try {
      const databaseResult = await prisma.$queryRawUnsafe<Array<{ db_name: string | null }>>(
        `SELECT DATABASE() AS db_name`
      );
      const dbName = databaseResult[0]?.db_name;

      if (dbName) {
        columns = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(
          `SELECT COLUMN_NAME AS column_name
           FROM information_schema.columns
           WHERE table_schema = ?
             AND table_name = 'School'
             AND COLUMN_NAME IN ('logo_url', 'sms_username', 'isActive', 'deactivationMessage')`,
          dbName
        );
      }
    } catch {
      columns = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(
        `SELECT column_name
         FROM information_schema.columns
         WHERE table_schema = current_schema()
           AND table_name = 'School'
           AND column_name IN ('logo_url', 'sms_username', 'isActive', 'deactivationMessage')`
      );
    }

    const availableColumns = new Set(columns.map((column) => column.column_name));

    cachedSchoolColumnSupport = {
      logo_url: availableColumns.has('logo_url'),
      sms_username: availableColumns.has('sms_username'),
      isActive: availableColumns.has('isActive'),
      deactivationMessage: availableColumns.has('deactivationMessage'),
    };
  } catch (error) {
    console.warn('[school-model] Failed to inspect School columns:', error);
    cachedSchoolColumnSupport = {
      logo_url: false,
      sms_username: false,
      isActive: false,
      deactivationMessage: false,
    };
  }

  return cachedSchoolColumnSupport;
}
