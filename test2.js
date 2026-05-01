const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const vendors = await prisma.vendor.findMany({ include: { services: true } });
  console.log("Vendors:", JSON.stringify(vendors, null, 2));
}

main().finally(() => prisma.$disconnect());
