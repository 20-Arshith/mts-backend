/**
 * One-time script: auto-approve all pending vendor services
 * where the vendor itself is already 'approved'.
 *
 * Run: node scripts/approve-pending-services.js
 */
const prisma = require('../src/config/db');

async function main() {
    const result = await prisma.vendorService.updateMany({
        where: {
            approval_status: 'pending',
            vendor: {
                approval_status: 'approved',
            },
        },
        data: {
            approval_status: 'approved',
        },
    });

    console.log(`✅  Updated ${result.count} service(s) to approved.`);
}

main()
    .catch((e) => {
        console.error('❌  Error:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
