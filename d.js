const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

(async () => {
  try {
    // Use raw SQL to delete records, bypassing enum validation
    const result = await prisma.$executeRaw`
      DELETE FROM "VerificationToken" WHERE type = 'IP_LOGIN_VERIFICATION'
    `;
    console.log(`Deleted ${result} IP_LOGIN_VERIFICATION tokens.`);
  } catch (error) {
    console.error("Error deleting verification tokens:", error);
  } finally {
    await prisma.$disconnect();
  }
})();
