import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { generateUniqueUserId } from './utils/idGenerator.js';

const prisma = new PrismaClient();

async function main() {
  const email = "admin@solecrm.com";      // default admin email
  const password = "admin123";                // default admin password

  const passwordHash = await bcrypt.hash(password, 10);
  const userId = await generateUniqueUserId(prisma);

  const newUser = await prisma.user.create({
    data: {
      id: userId,
      email,
      passwordHash,
    },
  });

  console.log('User created:', newUser);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
