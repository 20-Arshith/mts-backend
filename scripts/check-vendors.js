const prisma = require('../src/config/db');

async function main() {
    // Show all users and their roles
    const users = await prisma.user.findMany({
        select: { user_id: true, full_name: true, mobile: true, role_id: true }
    });
    console.log('=== USERS ===');
    console.log(JSON.stringify(users, null, 2));

    // Show all OTP verifications (most recent)
    const otps = await prisma.oTPVerification.findMany({
        orderBy: { created_at: 'desc' },
        take: 5
    });
    console.log('\n=== RECENT OTPs (check console for live OTPs) ===');
    console.log(JSON.stringify(otps, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
