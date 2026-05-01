const uploadService = require('../services/upload.services');

exports.uploadImage = async (req, res, next) => {
    try {
        const data = await uploadService.uploadImage(req.file, req.body?.asset_type);
        res.status(201).json({ success: true, data });
    } catch (error) {
        if (error.message === 'Image file is required') {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
};
