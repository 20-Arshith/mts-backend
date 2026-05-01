const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const config = {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET || 'your_default_secret',
    otpExpiry: 5 * 60 * 1000, // 5 minutes
};

module.exports = config;
