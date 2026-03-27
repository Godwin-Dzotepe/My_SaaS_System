import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

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

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(getMariaDbConfig()),
});

async function main() {
  console.log('Starting migration script to populate class_id for existing attendance records...');

  try {
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        // @ts-ignore: Intentionally checking invalid state from old schema
        class_id: null,
      },
      include: {
        student: {
          select: {
            class_id: true,
          },
        },
      },
    });

    if (attendanceRecords.length === 0) {
      console.log('No attendance records with null class_id found. Exiting.');
      return;
    }

    console.log(`Found ${attendanceRecords.length} attendance records with null class_id. Populating...`);

    for (const record of attendanceRecords) {
      const studentClassId = (record as any).student?.class_id;

      if (studentClassId) {
        await prisma.attendance.update({
          where: { id: record.id },
          data: { class_id: studentClassId },
        });
        console.log(`Updated attendance record ${record.id} with class_id: ${studentClassId}`);
      } else {
        console.warn(`Could not determine class_id for attendance record ${record.id}. Student or student.class_id is missing.`);
      }
    }

    console.log('Finished populating class_id for existing attendance records.');
  } catch (error) {
    console.error('Error during migration script:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

