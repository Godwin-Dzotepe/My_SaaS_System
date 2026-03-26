import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type SchoolColumnSupport = {
  logo_url: boolean;
  sms_username: boolean;
  isActive: boolean;
  deactivationMessage: boolean;
};

let cachedSchoolColumnSupport: SchoolColumnSupport | null = null;

export function getSupportedSchoolData(data: Record<string, unknown>) {
  const schoolModel = Prisma.dmmf.datamodel.models.find((model) => model.name === 'School');
  const supportedFields = new Set(
    (schoolModel?.fields || []).map((field) => field.name)
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
    const columns = await prisma.$queryRaw<Array<{ column_name: string }>>(Prisma.sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'School'
        AND column_name IN ('logo_url', 'sms_username', 'isActive', 'deactivationMessage')
    `);

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
