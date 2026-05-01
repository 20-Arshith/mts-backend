const multer = require('multer');

function createUpload({ maxSize, mimePrefix, errorMessage }) {
    return multer({
        storage: multer.memoryStorage(),
        limits: {
            fileSize: maxSize,
        },
        fileFilter: (req, file, cb) => {
            if (!file.mimetype || !file.mimetype.startsWith(mimePrefix)) {
                const error = new Error(errorMessage);
                error.statusCode = 400;
                cb(error);
                return;
            }

            cb(null, true);
        },
    });
}

const videoUpload = createUpload({
    maxSize: 100 * 1024 * 1024,
    mimePrefix: 'video/',
    errorMessage: 'Only video files are allowed',
});

const imageUpload = createUpload({
    maxSize: 10 * 1024 * 1024,
    mimePrefix: 'image/',
    errorMessage: 'Only image files are allowed',
});

module.exports = {
    uploadVideo: videoUpload.single('video'),
    uploadImage: imageUpload.single('file'),
};
