const agentRepository = require('../repositories/agent.repository');
const prisma = require('../config/db');

const MIN_PAYOUT_AMOUNT = 50;

const ensurePayoutMethodColumns = async () => {
    await prisma.$executeRawUnsafe(`
        ALTER TABLE "payout_requests"
        ALTER COLUMN "account_number" DROP NOT NULL,
        ALTER COLUMN "ifsc_code" DROP NOT NULL,
        ALTER COLUMN "bank_name" DROP NOT NULL
    `);

    await prisma.$executeRawUnsafe(`
        ALTER TABLE "payout_requests"
        ADD COLUMN IF NOT EXISTS "payout_method" TEXT NOT NULL DEFAULT 'BANK',
        ADD COLUMN IF NOT EXISTS "upi_id" TEXT,
        ADD COLUMN IF NOT EXISTS "proof_image_url" TEXT
    `);
};

exports.getAgentProfile = async (agentId) => {
    return await agentRepository.findProfile(agentId);
};

exports.updateAgentProfile = async (agentId, data) => {
    const payload = {};

    if (typeof data.name === 'string') {
        payload.name = data.name.trim();
    }
    if (typeof data.mobile === 'string') {
        payload.mobile = data.mobile.trim() || null;
    }
    if (typeof data.email === 'string') {
        payload.email = data.email.trim() || null;
    }

    return await agentRepository.updateProfile(agentId, payload);
};

exports.getAgentVendors = async (agentId) => {
    return await agentRepository.findWithVendors(agentId);
};

exports.updateCommission = async (agentId, amount) => {
    return await agentRepository.updateBalance(agentId, amount);
};

exports.createPayoutRequest = async (agentId, payload = {}) => {
    await ensurePayoutMethodColumns();

    const agent = await agentRepository.findProfile(agentId);
    const amount = Number(payload.amount || agent?.commission_balance || 0);

    if (!Number.isFinite(amount) || amount < MIN_PAYOUT_AMOUNT) {
        throw new Error('Minimum payout amount is ₹50');
    }

    if (Number(agent?.commission_balance || 0) < amount) {
        throw new Error('Insufficient commission balance');
    }

    const payoutMethod = String(payload.payout_method || '').trim().toUpperCase();
    const accountNumber = String(payload.account_number || '').replace(/\s/g, '');
    const ifscCode = String(payload.ifsc_code || '').trim().toUpperCase();
    const bankName = String(payload.bank_name || '').trim();
    const upiId = String(payload.upi_id || '').trim().toLowerCase();
    const hasBankDetails = Boolean(accountNumber || ifscCode || bankName);
    const hasUpi = Boolean(upiId);

    if ((payoutMethod === 'BANK' && hasUpi) || (payoutMethod === 'UPI' && hasBankDetails) || (hasBankDetails && hasUpi)) {
        throw new Error('Choose either bank account or UPI, not both');
    }

    if (payoutMethod === 'UPI' || hasUpi) {
        if (!upiId) {
            throw new Error('UPI ID is required');
        }
    } else if (!accountNumber || !ifscCode) {
        throw new Error('Bank account number and IFSC are required');
    }

    const normalizedMethod = payoutMethod === 'UPI' || hasUpi ? 'UPI' : 'BANK';

    const rows = await prisma.$queryRawUnsafe(`
        INSERT INTO payout_requests (
            agent_id,
            amount,
            account_number,
            ifsc_code,
            bank_name,
            payout_method,
            upi_id,
            status,
            updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW())
        RETURNING payout_id, agent_id, amount, account_number, ifsc_code, bank_name, payout_method, upi_id, status, created_at, updated_at
    `,
        Number(agentId),
        amount,
        normalizedMethod === 'BANK' ? accountNumber : null,
        normalizedMethod === 'BANK' ? ifscCode : null,
        normalizedMethod === 'BANK' ? bankName || null : null,
        normalizedMethod,
        normalizedMethod === 'UPI' ? upiId : null
    );

    return rows[0];
};
