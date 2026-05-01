const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const adminRole = 4;
    const adminUser = await prisma.user.upsert({
        where: { mobile: '0000000000' },
        update: { role_id: adminRole },
        create: {
            mobile: '0000000000',
            full_name: 'MTS Admin',
            role_id: adminRole,
            status: 'active'
        }
    });
    console.log('Admin user created/updated:', adminUser);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
