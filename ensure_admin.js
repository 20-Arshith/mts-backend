const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function ensureAdmin() {
  const mobile = '0000000000';
  const admin = await prisma.user.upsert({
    where: { mobile },
    update: { role_id: 4 },
    create: {
      mobile,
      full_name: 'Super Admin',
      role_id: 4,
      status: 'active'
    }
  });
  console.log('Admin user ensured:', admin);
}

ensureAdmin()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
