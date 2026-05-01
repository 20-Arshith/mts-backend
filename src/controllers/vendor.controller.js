const vendorService = require('../services/vendor.services');

exports.getAllVendors = async (req, res, next) => {
    try {
        const vendors = await vendorService.getAllVendors();
        res.status(200).json({ success: true, data: vendors });
    } catch (error) {
        next(error);
    }
};

exports.getProfile = async (req, res, next) => {
    try {
        const vendor = await vendorService.getVendorProfile(req.user.user_id);
        res.status(200).json({ success: true, data: vendor });
    } catch (error) {
        next(error);
    }
};

exports.updateProfile = async (req, res, next) => {
    try {
        const vendor = await vendorService.updateVendorProfile(req.user.user_id, req.body || {});
        res.status(200).json({ success: true, data: vendor });
    } catch (error) {
        next(error);
    }
};

exports.getVendorDetails = async (req, res, next) => {
    try {
        const vendor = await vendorService.getVendorById(parseInt(req.params.id));
        res.status(200).json({ success: true, data: vendor });
    } catch (error) {
        next(error);
    }
};

exports.getCategories = async (req, res, next) => {
    try {
        const categories = await vendorService.getAllCategories();
        res.status(200).json({ success: true, data: categories });
    } catch (error) {
        next(error);
    }
};

exports.saveMyServices = async (req, res, next) => {
    try {
        const { categories } = req.body;
        const vendorId = req.user.user_id;
        const result = await vendorService.saveVendorServices(vendorId, categories);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

exports.addService = async (req, res, next) => {
    try {
        const vendorId = req.user.user_id;
        const service = await vendorService.addSpecificService({
            vendor_id: vendorId,
            ...(req.body || {}),
        });
        res.status(201).json({ success: true, data: service });
    } catch (error) {
        next(error);
    }
};

exports.updateService = async (req, res, next) => {
    try {
        const vendorId = req.user.user_id;
        const serviceId = parseInt(req.params.id, 10);

        const service = await vendorService.updateSpecificService(serviceId, vendorId, req.body || {});

        res.status(200).json({ success: true, data: service });
    } catch (error) {
        if (error.message === 'Service not found') {
            return res.status(404).json({ success: false, message: 'Service not found' });
        }
        next(error);
    }
};

exports.updateServiceAvailability = async (req, res, next) => {
    try {
        const vendorId = req.user.user_id;
        const serviceId = parseInt(req.params.id, 10);
        const service = await vendorService.updateServiceAvailability(serviceId, vendorId, req.body.is_available);

        res.status(200).json({ success: true, data: service });
    } catch (error) {
        if (error.message === 'Service not found') {
            return res.status(404).json({ success: false, message: 'Service not found' });
        }
        next(error);
    }
};

exports.getAvailability = async (req, res, next) => {
    try {
        const availability = await vendorService.getVendorAvailability(req.user.user_id);
        res.status(200).json({ success: true, data: availability });
    } catch (error) {
        next(error);
    }
};

exports.updateAvailability = async (req, res, next) => {
    try {
        const availability = await vendorService.updateVendorAvailability(req.user.user_id, req.body || {});
        res.status(200).json({ success: true, data: availability });
    } catch (error) {
        if (error.message?.includes('Schedule') || error.message?.includes('time') || error.message?.includes('day')) {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
};

exports.getGallery = async (req, res, next) => {
    try {
        const items = await vendorService.getVendorGallery(req.user.user_id);
        res.status(200).json({ success: true, data: items });
    } catch (error) {
        next(error);
    }
};

exports.addGalleryImage = async (req, res, next) => {
    try {
        const { image_url, caption } = req.body || {};
        if (!image_url) {
            return res.status(400).json({ success: false, message: 'image_url is required' });
        }
        const item = await vendorService.addGalleryImage(req.user.user_id, { image_url, caption });
        res.status(201).json({ success: true, data: item });
    } catch (error) {
        next(error);
    }
};

exports.deleteGalleryImage = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        await vendorService.deleteGalleryImage(req.user.user_id, id);
        res.status(200).json({ success: true, message: 'Gallery image deleted' });
    } catch (error) {
        if (error.message === 'Not found') {
            return res.status(404).json({ success: false, message: 'Gallery image not found' });
        }
        next(error);
    }
};
