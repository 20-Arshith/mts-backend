const errorHandler = (err, req, res, next) => {
    if (err.code === 'P2002') {
        const fields = Array.isArray(err.meta?.target) ? err.meta.target : [];
        const fieldLabels = fields.map((field) => {
            switch (field) {
                case 'mobile':
                    return 'phone number';
                case 'email':
                    return 'email';
                case 'whatsapp_number':
                    return 'WhatsApp number';
                default:
                    return field.replace(/_/g, ' ');
            }
        });

        const duplicateTarget = fieldLabels.length > 0 ? fieldLabels.join(' and ') : 'details';
        return res.status(409).json({
            success: false,
            message: `This ${duplicateTarget} already exists. Please use a different one.`,
        });
    }

    const statusCode = err.code === 'LIMIT_FILE_SIZE' ? 400 : (err.statusCode || 500);
    const message = err.code === 'LIMIT_FILE_SIZE'
        ? 'Video file is too large. Maximum allowed size is 100MB.'
        : (err.message || 'Internal Server Error');

    console.error(`[Error] ${message}`, err.stack);

    res.status(statusCode).json({
        success: false,
        message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
};

module.exports = { errorHandler };
