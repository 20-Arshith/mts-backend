const agentService = require('../services/agent.services');

exports.getProfile = async (req, res, next) => {
    try {
        const agentId = req.user.agent_id;
        const profile = await agentService.getAgentProfile(agentId);
        res.status(200).json({ success: true, data: profile });
    } catch (error) {
        next(error);
    }
};

exports.updateProfile = async (req, res, next) => {
    try {
        const agentId = req.user.agent_id;
        const profile = await agentService.updateAgentProfile(agentId, req.body);
        res.status(200).json({ success: true, data: profile });
    } catch (error) {
        next(error);
    }
};

exports.getMyVendors = async (req, res, next) => {
    try {
        const agentId = req.user.agent_id;
        const vendors = await agentService.getAgentVendors(agentId);
        res.status(200).json({ success: true, data: vendors });
    } catch (error) {
        next(error);
    }
};

exports.getCommission = async (req, res, next) => {
    try {
        const agentId = req.user.agent_id;
        // In reality, you'd want a more detailed commission log, but for now we get the balance
        const agentData = await agentService.getAgentVendors(agentId);
        res.status(200).json({ success: true, balance: agentData?.commission_balance || 0 });
    } catch (error) {
        next(error);
    }
};

exports.createPayoutRequest = async (req, res, next) => {
    try {
        const agentId = req.user.agent_id;
        const payout = await agentService.createPayoutRequest(agentId, req.body || {});
        res.status(201).json({ success: true, data: payout });
    } catch (error) {
        if (
            error.message === 'Minimum payout amount is ₹50' ||
            error.message === 'Insufficient commission balance' ||
            error.message === 'Choose either bank account or UPI, not both' ||
            error.message === 'Bank account number and IFSC are required' ||
            error.message === 'UPI ID is required'
        ) {
            return res.status(400).json({ success: false, message: error.message });
        }

        next(error);
    }
};
