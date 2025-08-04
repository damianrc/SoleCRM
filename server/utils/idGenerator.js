const generateUserId = () => {
  // Generate a random 10-digit number
  const min = 1000000000;  // 10 digits
  const max = 9999999999;
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
};

const generateContactId = () => {
  // Generate a random 7-digit number with a prefix
  const min = 1000000;  // 7 digits
  const max = 9999999;
  const number = Math.floor(Math.random() * (max - min + 1) + min);
  return `CNT${number}`; // Adding a prefix to ensure uniqueness and proper string format
};

// Check if ID already exists in the database
const isIdUnique = async (prisma, model, id) => {
  const count = await prisma[model].count({
    where: { id }
  });
  return count === 0;
};

// Generate a unique ID with retries
const generateUniqueId = async (prisma, model, generator, maxAttempts = 5) => {
  for (let i = 0; i < maxAttempts; i++) {
    const id = generator();
    if (await isIdUnique(prisma, model, id)) {
      return id;
    }
  }
  throw new Error(`Failed to generate unique ${model} ID after ${maxAttempts} attempts`);
};

export const generateUniqueUserId = (prisma) => generateUniqueId(prisma, 'user', generateUserId);
export const generateUniqueContactId = (prisma) => generateUniqueId(prisma, 'contact', generateContactId);
