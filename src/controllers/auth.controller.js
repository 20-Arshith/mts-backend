const jwt = require('jsonwebtoken');
const config = require('../config/config');
const authService = require('../services/auth.services');
const userRepository = require('../repositories/user.repository');
const agentRepository = require('../repositories/agent.repository');
const { ROLES } = require('../utils/constants');

exports.sendOtp = async (req, res, next) => {
    try {
        const contact = (req.body.contact || req.body.mobile || '').trim();
        const actorType = req.body.actorType;

        if (!contact) {
            return res.status(400).json({ success: false, message: "Mobile number or email is required" });
        }

        if (actorType === 'vendor') {
            await authService.validateVendorAccess(contact);
        }

        if (actorType === 'agent') {
            await authService.validateAgentAccess(contact);
        }

        const otp = await authService.sendOtp(contact);
        res.status(200).json({
            success: true,
            message: "OTP sent successfully",
            ...(config.nodeEnv !== 'production' ? { debugOtp: otp } : {}),
        });
    } catch (error) {
        next(error);
    }
};

exports.verifyOtp = async (req, res, next) => {
    try {
        const contact = (req.body.contact || req.body.mobile || '').trim();
        const actorType = req.body.actorType;
        const otp = req.body.otp;

        if (!contact || !otp) {
            return res.status(400).json({ success: false, message: "Mobile/email and OTP are required" });
        }

        await authService.verifyOtp(contact, otp);

        if (actorType === 'vendor') {
            const vendor = await authService.validateVendorAccess(contact);
            const user = vendor.user;

            const token = jwt.sign(
                { user_id: user.user_id, role_id: user.role_id, actor_type: 'vendor' },
                config.jwtSecret,
                { expiresIn: '7d' }
            );

            return res.status(200).json({
                success: true,
                message: "Login successful",
                token,
                actorType: 'vendor',
                user: await userRepository.getProfileInfo(user.user_id),
                vendor
            });
        }

        let agent = null;
        if (actorType === 'agent') {
            agent = await authService.validateAgentAccess(contact);
        } else if (!actorType) {
            const matchingAgent = await agentRepository.findByContact(contact);
            if (matchingAgent) {
                agent = await authService.validateAgentAccess(contact);
            }
        }

        if (agent) {
            const token = jwt.sign(
                { agent_id: agent.agent_id, role_id: ROLES.AGENT, actor_type: 'agent' },
                config.jwtSecret,
                { expiresIn: '7d' }
            );

            return res.status(200).json({
                success: true,
                message: "Login successful",
                token,
                actorType: 'agent',
                user: agent,
                agent
            });
        }

        let user = await userRepository.findByContact(contact);

        if (!user) {
            await userRepository.model.create({
                data: {
                    ...(contact.includes('@') ? { email: contact } : { mobile: contact }),
                    full_name: 'User',
                    role_id: ROLES.USER,
                    status: 'active'
                }
            });

            user = await userRepository.findByContact(contact);
        }

        const registrationRequired = !authService.isUserRegistrationComplete(user);

        const token = jwt.sign(
            { user_id: user.user_id, role_id: user.role_id },
            config.jwtSecret,
            { expiresIn: '7d' }
        );

        res.status(200).json({ 
            success: true, 
            message: registrationRequired ? "Registration required" : "Login successful", 
            token,
            actorType: 'user',
            registrationRequired,
            user
        });
    } catch (error) {
        next(error);
    }
};

exports.validateAgentReferralCode = async (req, res, next) => {
    try {
        const agentCode = req.body.agent_code || req.body.agentCode || '';
        const agent = await authService.validateAgentReferralCode(agentCode);

        res.status(200).json({
            success: true,
            message: 'Agent code is valid',
            data: {
                agent_id: agent.agent_id,
                name: agent.name,
                referral_code: agent.referral_code,
                approval_status: agent.approval_status,
            },
        });
    } catch (error) {
        next(error);
    }
};

exports.registerVendor = async (req, res, next) => {
    try {
        const result = await authService.registerVendor(req.body);
        
        const token = jwt.sign(
            { user_id: result.user.user_id, role_id: result.user.role_id },
            config.jwtSecret,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: "Vendor registered successfully",
            token,
            user: result.user,
            vendor: result.vendor
        });
    } catch (error) {
        next(error);
    }
};

exports.registerAgent = async (req, res, next) => {
    try {
        const agent = await authService.registerAgent(req.body);

        const token = jwt.sign(
            { agent_id: agent.agent_id, role_id: ROLES.AGENT, actor_type: 'agent' },
            config.jwtSecret,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: "Agent registered successfully",
            token,
            actorType: 'agent',
            user: agent,
            agent
        });
    } catch (error) {
        next(error);
    }
};
