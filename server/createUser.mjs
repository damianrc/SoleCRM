import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { generateUniqueUserId } from './utils/idGenerator.js';

const prisma = new PrismaClient();

async function createUser() {
  const email = 'admin@solecrm.co.za';
  const password = 'admin123';
  
  const passwordHash = await bcrypt.hash(password, 10);
  const userId = await generateUniqueUserId(prisma);
  
  try {
    const newUser = await prisma.user.create({
      data: {
        id: userId,
        email,
        passwordHash,
      },
    });
    console.log('User created:', newUser);
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('User already exists with email:', email);
    } else {
      console.error('Error creating user:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createUser();
