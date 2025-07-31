import { PrismaClient } from '@prisma/client';
import { customAlphabet } from 'nanoid';

const prisma = new PrismaClient();
// Use the same ID generator as in your auth route
const generateUserId = customAlphabet('0123456789', 8);

/**
 * Migrates a single user from an old ID format to the new numeric format.
 * @param {object} user - The user object to migrate.
 */
async function migrateUser(user) {
  // 1. Generate a new, unique ID
  let newId;
  let isUnique = false;
  while (!isUnique) {
    newId = generateUserId();
    const existingUser = await prisma.user.findUnique({ where: { id: newId } });
    if (!existingUser) {
      isUnique = true;
    }
  }

  console.log(`  - Planning migration for ${user.email}: ${user.id} -> ${newId}`);

  // 2. Perform the migration within a transaction for safety
  try {
    await prisma.$transaction(async (tx) => {
      // Create a new user record with the new ID and existing data
      await tx.user.create({
        data: {
          id: newId,
          email: user.email,
          passwordHash: user.passwordHash,
        },
      });

      // Re-link all associated contacts to the new user ID
      await tx.contact.updateMany({
        where: { userId: user.id },
        data: { userId: newId },
      });

      // Delete the old user record
      await tx.user.delete({
        where: { id: user.id },
      });
    });
    console.log(`  ✓ Successfully migrated ${user.email}`);
  } catch (error) {
    console.error(`  ✗ Failed to migrate ${user.email}. Rolled back changes. Error:`, error);
  }
}

async function main() {
  console.log('Starting user ID migration check...');

  const allUsers = await prisma.user.findMany();
  // Filter for users whose ID is not an 8-digit string
  const usersToMigrate = allUsers.filter(user => !/^\d{8}$/.test(user.id));

  if (usersToMigrate.length === 0) {
    console.log('All user IDs are in the new format. No migration needed.');
    return;
  }

  console.log(`Found ${usersToMigrate.length} user(s) with old ID format. Starting migration...`);

  for (const user of usersToMigrate) {
    await migrateUser(user);
  }

  console.log('Migration process finished.');
}

main()
  .catch((e) => {
    console.error('A critical error occurred during the migration process:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });