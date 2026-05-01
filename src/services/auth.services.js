const otpGenerator = require("../utils/otp")
const authRepository = require("../repositories/auth.repository")
const userRepository = require('../repositories/user.repository');
const vendorRepository = require('../repositories/vendor.repository');
const agentRepository = require('../repositories/agent.repository');
const { ROLES } = require('../utils/constants');
const logger = require('../utils/logger');
const { createValidationError } = require('../utils/validation');

const PLACEHOLDER_USER_NAME = 'User';

const createAccessError = (message, statusCode = 403) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const createOtpError = (message = 'Invalid OTP', statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const isMeaningfulName = (value) => {
    if (!value || typeof value !== 'string') {
        return false;
    }

    const normalized = value.trim().toLowerCase();
    return normalized.length > 0 && normalized !== PLACEHOLDER_USER_NAME.toLowerCase();
};

const isVendorRegistrationComplete = (vendor) => Boolean(
    vendor?.user &&
    vendor?.business_name?.trim() &&
    vendor?.owner_name?.trim() &&
    (vendor?.mobile || vendor?.email || vendor?.user?.mobile || vendor?.user?.email)
);

exports.isUserRegistrationComplete = (user) => Boolean(
    user &&
    isMeaningfulName(user.full_name) &&
    (user.mobile || user.email)
);

const getVendorActivationBlockReason = (vendor, services = []) => {
    if (!vendor) {
        return 'Vendor profile not found.';
    }

    if (vendor.approval_status !== 'approved') {
        return 'Your vendor profile is still pending approval.';
    }

    if (vendor.agent && vendor.agent.approval_status !== 'approved') {
        return 'Your assigned agent is not approved yet.';
    }

    if (!Array.isArray(services) || services.length === 0) {
        return 'Add at least one service before going active.';
    }

    const approvedServices = services.filter((service) => service.approval_status === 'approved');
    if (approvedServices.length === 0) {
        return 'Your services are still pending admin approval.';
    }

    const approvedAvailableServices = approvedServices.filter((service) => service.is_available === true);
    if (approvedAvailableServices.length === 0) {
        return 'Turn on at least one approved service before going active.';
    }

    return '';
};

exports.sendOtp = async (mobile) => {
    const otp = otpGenerator().toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // store in DB via Repository
    await authRepository.create({
        contact: mobile,
        otp_code: otp,
        expires_at: expiresAt
    })

    // TODO: send sms (Integrating with a provider like Twilio/Msg91)
    console.log(`OTP for ${mobile}: ${otp}`)

    return otp
}

exports.verifyOtp = async (mobile, otp) => {
    const latestOtp = await authRepository.findLatestOtpByContact(mobile);

    if (!latestOtp || latestOtp.otp_code !== String(otp) || latestOtp.expires_at < new Date()) {
        throw createOtpError('Invalid OTP');
    }

    if (latestOtp.verified) {
        throw createOtpError('OTP already verified');
    }

    await authRepository.verifyOtp(latestOtp.otp_id);
    return true;
}

exports.ensureVendorContactExists = async (contact) => {
    const vendor = await vendorRepository.findByContact(contact);
    if (!vendor) {
        throw new Error('You are not registered by authorized agent. Please contact agent to onboard you.');
    }

    return vendor;
}

exports.validateVendorAccess = async (contact) => {
    const vendor = await vendorRepository.findByContact(contact);
    if (!vendor || !vendor.user) {
        logger.warn('Vendor login blocked because vendor record was not found', { contact });
        throw createAccessError('Contact admin for access');
    }

    if (!isVendorRegistrationComplete(vendor)) {
        logger.warn('Vendor login blocked because registration is incomplete', {
            contact,
            vendorId: vendor.vendor_id,
        });
        throw createAccessError('Contact admin for access');
    }

    return vendor;
};

exports.validateAgentAccess = async (contact) => {
    const agent = await agentRepository.findByContact(contact);
    if (!agent) {
        logger.warn('Agent login blocked because agent record was not found', { contact });
        throw createAccessError('Contact admin for access');
    }

    if (!agent.referral_code || !agent.referral_code.trim()) {
        logger.warn('Agent login blocked because referral code is missing', {
            contact,
            agentId: agent.agent_id,
        });
        throw createAccessError('Agent referral required');
    }

    // Allow pending agents to log in so they can see their approval status
    // The frontend will handle showing appropriate UI for pending agents

    return agent;
};

exports.validateAgentReferralCode = async (agentCode) => {
    const normalizedAgentCode = agentCode?.trim().toUpperCase() || null;

    if (!normalizedAgentCode) {
        throw createValidationError('Agent Code is required');
    }

    const agent = await agentRepository.findByReferralCode(normalizedAgentCode);
    if (!agent) {
        throw createValidationError('Invalid agent referral code');
    }

    if (agent.approval_status !== 'approved') {
        throw createAccessError('This agent is not approved by admin and cannot onboard vendors yet');
    }

    return agent;
};

exports.getVendorActivationBlockReason = getVendorActivationBlockReason;

exports.registerVendor = async (data) => {
    const {
        mobile,
        full_name,
        business_name,
        agent_code,
        address,
        latitude,
        longitude,
        email,
        whatsapp_number,
        description,
        categories = []
    } = data;

    const normalizedMobile = mobile?.trim() || null;
    const normalizedEmail = email?.trim() || null;
    const normalizedWhatsapp = (whatsapp_number?.trim() || normalizedMobile || null);
    const normalizedAgentCode = agent_code?.trim().toUpperCase() || null;
    const primaryContact = normalizedMobile || normalizedEmail;

    if (!primaryContact) {
        throw new Error('Mobile number or email is required');
    }

    // 1. Check if user already exists
    let user = await userRepository.findByContact(primaryContact);

    // 2. Find Agent by referral code when a vendor provides one
    const agent = normalizedAgentCode ? await exports.validateAgentReferralCode(normalizedAgentCode) : null;
    const vendorApprovalStatus = agent ? 'approved' : 'pending';

    // 3. Create or Update user with Vendor role
    if (!user) {
        user = await userRepository.model.create({
            data: {
                full_name: 'Vendor User',
                mobile: normalizedMobile,
                email: normalizedEmail,
                role_id: ROLES.VENDOR,
                status: 'active'
            }
        });
    } else {
        user = await userRepository.model.update({
            where: { user_id: user.user_id },
            data: {
                ...(normalizedMobile ? { mobile: normalizedMobile } : {}),
                ...(normalizedEmail ? { email: normalizedEmail } : {}),
                role_id: ROLES.VENDOR,
                status: 'active'
            }
        });
    }

    const vendor = await vendorRepository.model.upsert({
        where: { vendor_id: user.user_id },
        update: {
            agent_id: agent ? agent.agent_id : null,
            category_id: Array.isArray(categories) && categories.length > 0 ? parseInt(categories[0], 10) : null,
            business_name,
            owner_name: full_name,
            mobile: normalizedMobile,
            email: normalizedEmail,
            whatsapp_number: normalizedWhatsapp,
            description: description || null,
            address,
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
            is_available: false,
            approval_status: vendorApprovalStatus
        },
        create: {
            vendor_id: user.user_id,
            agent_id: agent ? agent.agent_id : null,
            category_id: Array.isArray(categories) && categories.length > 0 ? parseInt(categories[0], 10) : null,
            business_name,
            owner_name: full_name,
            mobile: normalizedMobile,
            email: normalizedEmail,
            whatsapp_number: normalizedWhatsapp,
            description: description || null,
            address,
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
            is_available: false,
            approval_status: vendorApprovalStatus
        },
        include: {
            agent: true,
            services: {
                include: { category: true }
            }
        }
    });

    if (Array.isArray(categories) && categories.length > 0) {
        await vendorRepository.model.update({
            where: { vendor_id: vendor.vendor_id },
            data: {
                services: {
                    deleteMany: {
                        service_title: 'General Service'
                    },
                    create: categories.map((categoryId) => ({
                        category_id: parseInt(categoryId, 10),
                        service_title: 'General Service',
                        approval_status: 'pending',
                        status: 'pending',
                        is_available: false
                    }))
                }
            }
        });
    }

    const updatedUser = await userRepository.findByContact(primaryContact);
    return { user: updatedUser, vendor: await vendorRepository.findVendorDetails(user.user_id) };
}

const SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

async function generateUniqueReferralCode() {
    const generate = () => {
        const part = (n) =>
            Array.from({ length: n }, () => SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)]).join('');

        return `AGT-${part(4)}-${part(4)}`;
    };

    let attempts = 0;
    while (attempts < 20) {
        const code = generate();
        const existing = await agentRepository.findByReferralCode(code);
        if (!existing) {
            return code;
        }
        attempts += 1;
    }

    throw new Error('Could not generate a unique referral code. Please try again.');
}

exports.registerAgent = async (data) => {
    const { mobile, full_name, email } = data;
    
    // We reuse the basic logic:
    const normalizedMobile = mobile?.trim() || null;
    const normalizedFullName = full_name?.trim() || null;
    const normalizedEmail = email?.trim() || null;

    if (!normalizedMobile) {
        throw new Error('Mobile number is required');
    }
    
    if (!normalizedFullName) {
        throw new Error('Full name is required');
    }

    const existingMobile = await agentRepository.findByContact(normalizedMobile);
    if (existingMobile) {
        throw new Error('An agent with this phone number already exists');
    }

    const existingEmail = normalizedEmail ? await agentRepository.findByContact(normalizedEmail) : null;
    if (existingEmail) {
        throw new Error('An agent with this email already exists');
    }

    const referralCode = await generateUniqueReferralCode();

    const agent = await agentRepository.model.create({
        data: {
            name: normalizedFullName,
            mobile: normalizedMobile,
            email: normalizedEmail,
            referral_code: referralCode,
            approval_status: 'pending',
            commission_balance: 0
        }
    });

    logger.info('Agent self-onboarded', {
        agentId: agent.agent_id,
        mobile: agent.mobile,
        email: agent.email,
    });

    return agent;
};
