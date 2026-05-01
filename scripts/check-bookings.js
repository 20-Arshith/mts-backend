const prisma = require('../src/config/db');

async function main() {
    const bookings = await prisma.booking.findMany();
    console.log(JSON.stringify(bookings, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
