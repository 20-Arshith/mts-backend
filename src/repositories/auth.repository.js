const BaseRepository = require('./base.repository');

class AuthRepository extends BaseRepository {
    constructor() {
        super('oTPVerification');
    }

    async findLatestOtpByContact(contact) {
        return await this.model.findFirst({
            where: { contact },
            orderBy: { created_at: 'desc' }
        });
    }

    async verifyOtp(otpId) {
        return await this.model.update({
            where: { otp_id: otpId },
            data: { verified: true }
        });
    }
}

module.exports = new AuthRepository();
