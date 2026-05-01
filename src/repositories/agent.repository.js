const BaseRepository = require('./base.repository');

class AgentRepository extends BaseRepository {
    constructor() {
        super('agent');
    }

    async findByMobile(mobile) {
        if (!mobile) {
            return null;
        }

        return await this.model.findUnique({
            where: { mobile }
        });
    }

    async findByEmail(email) {
        if (!email) {
            return null;
        }

        return await this.model.findUnique({
            where: { email }
        });
    }

    async findByContact(contact) {
        if (!contact) {
            return null;
        }

        const trimmedContact = contact.trim();
        if (trimmedContact.includes('@')) {
            return this.findByEmail(trimmedContact);
        }

        return this.findByMobile(trimmedContact);
    }

    async findWithVendors(agentId) {
        return await this.model.findUnique({
            where: { agent_id: agentId },
            include: {
                vendors: {
                    include: {
                        category: true,
                        services: {
                            include: {
                                category: true
                            }
                        }
                    }
                }
            }
        });
    }

    async findByReferralCode(code) {
        if (!code) {
            return null;
        }

        const normalizedCode = code.trim();

        return await this.model.findFirst({
            where: {
                referral_code: {
                    equals: normalizedCode,
                    mode: 'insensitive'
                }
            }
        });
    }

    async findProfile(agentId) {
        return await this.model.findUnique({
            where: { agent_id: agentId }
        });
    }

    async updateProfile(agentId, data) {
        return await this.model.update({
            where: { agent_id: agentId },
            data
        });
    }

    async updateBalance(agentId, amount) {
        return await this.model.update({
            where: { agent_id: agentId },
            data: {
                commission_balance: {
                    increment: amount
                }
            }
        });
    }
}

module.exports = new AgentRepository();
