
import "dotenv/config";
import { prisma } from '../lib/prisma';

async function main() {
  try {
    console.log('--- Testing Prisma from lib ---');
    const schools = await prisma.school.count();
    console.log('Total Schools:', schools);
    
    const users = await prisma.user.count();
    console.log('Total Users:', users);
    
    console.log('Prisma initialized successfully!');
  } catch (error) {
    console.error('Prisma initialization failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
