const { PrismaClient } = require('@prisma/client');
const path = require('path');

// Load .env from the backend directory specifically
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('[DATABASE] Error: DATABASE_URL is not defined.');
  console.error('[DATABASE] Make sure backend/.env exists with DATABASE_URL set.');
  process.exit(1);
}

console.log('[DATABASE] Connecting to PostgreSQL...');

// Pass the URL directly so Prisma always gets the right connection string
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
});

module.exports = prisma;
