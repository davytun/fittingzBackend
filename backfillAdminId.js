const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testConnection() {
  try {
    const styleImage = await prisma.styleImage.findUnique({
      where: { id: 'cmdn6f5n10000tviko977itul' },
      include: { client: true },
    });
    console.log('Test query result:', styleImage);
  } catch (error) {
    console.error('Test query error:', error);
  } finally {
    await prisma.$disconnect();
  }
}
testConnection();