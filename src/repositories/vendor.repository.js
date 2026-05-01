const BaseRepository = require('./base.repository');

class VendorRepository extends BaseRepository {
    constructor() {
        super('vendor');
    }

    async findByContact(contact) {
        const normalized = typeof contact === 'string' ? contact.trim() : '';
        const normalizedEmail = normalized.toLowerCase();
        const digitsOnly = normalized.replace(/\D/g, '');

        const phoneCandidates = [...new Set([
            normalized,
            digitsOnly,
            digitsOnly.length === 10 ? `+91${digitsOnly}` : '',
            digitsOnly.length === 12 && digitsOnly.startsWith('91') ? digitsOnly.slice(-10) : '',
        ])].filter(Boolean);

        const orConditions = [
            ...phoneCandidates.map((value) => ({ mobile: value })),
            ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
        ];

        if (orConditions.length === 0) {
            return null;
        }

        return await this.model.findFirst({
            where: {
                OR: orConditions
            },
            include: {
                user: true,
                agent: true,
                category: true,
                services: {
                    include: { category: true }
                }
            }
        });
    }

    async findAllWithServices() {
        return await this.model.findMany({
            include: {
                agent: true,
                category: true,
                services: {
                    include: { category: true }
                }
            }
        });
    }

    async findVendorDetails(vendorId) {
        return await this.model.findUnique({
            where: { vendor_id: vendorId },
            include: {
                user: {
                    include: {
                        role: true,
                        profile: true
                    }
                },
                agent: true,
                category: true,
                services: {
                    include: { category: true }
                },
                reels: true,
                gallery: {
                    orderBy: { created_at: 'desc' }
                }
            }
        });
    }

    async findProfile(vendorId) {
        return await this.model.findUnique({
            where: { vendor_id: vendorId },
            include: {
                user: {
                    include: {
                        role: true,
                        profile: true
                    }
                },
                agent: true,
                category: true,
                services: {
                    include: { category: true }
                },
                reels: true,
                gallery: {
                    orderBy: { created_at: 'desc' }
                }
            }
        });
    }

    async updateProfile(vendorId, data) {
        const {
            full_name,
            email,
            mobile,
            business_name,
            owner_name,
            whatsapp_number,
            logo_url,
            banner_url,
            description,
            address,
            latitude,
            longitude,
        } = data;
        const normalizedEmail = email === undefined ? undefined : email?.trim().toLowerCase() || null;
        const normalizedMobile = mobile === undefined ? undefined : mobile?.trim() || null;
        const normalizedWhatsapp = normalizedMobile !== undefined
            ? normalizedMobile
            : (whatsapp_number === undefined ? undefined : whatsapp_number?.trim() || null);

        return await this.model.update({
            where: { vendor_id: vendorId },
            data: {
                ...(normalizedMobile !== undefined ? { mobile: normalizedMobile } : {}),
                ...(normalizedEmail !== undefined ? { email: normalizedEmail } : {}),
                ...(business_name !== undefined ? { business_name } : {}),
                ...(owner_name !== undefined ? { owner_name } : {}),
                ...(normalizedWhatsapp !== undefined ? { whatsapp_number: normalizedWhatsapp } : {}),
                ...(logo_url !== undefined ? { logo_url } : {}),
                ...(banner_url !== undefined ? { banner_url } : {}),
                ...(description !== undefined ? { description } : {}),
                ...(address !== undefined ? { address } : {}),
                ...(latitude !== undefined ? { latitude } : {}),
                ...(longitude !== undefined ? { longitude } : {}),
                user: {
                    update: {
                        ...(full_name !== undefined ? { full_name } : {}),
                        ...(normalizedEmail !== undefined ? { email: normalizedEmail } : {}),
                        ...(normalizedMobile !== undefined ? { mobile: normalizedMobile } : {}),
                    }
                }
            },
            include: {
                user: {
                    include: {
                        role: true,
                        profile: true
                    }
                },
                agent: true,
                category: true,
                services: {
                    include: { category: true }
                },
                reels: true
            }
        });
    }
}

module.exports = new VendorRepository();
