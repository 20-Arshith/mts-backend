const { v2: cloudinary } = require('cloudinary');

const isConfigured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}

function ensureConfigured() {
    if (!isConfigured) {
        const error = new Error('Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env');
        error.statusCode = 500;
        throw error;
    }
}

function uploadVideoBuffer(buffer, options = {}) {
    ensureConfigured();

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'video',
                folder: 'mts-india/reels',
                ...options,
            },
            (error, result) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(result);
            }
        );

        stream.end(buffer);
    });
}

function uploadImageBuffer(buffer, options = {}) {
    ensureConfigured();

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'image',
                folder: 'mts-india/vendor-media',
                ...options,
            },
            (error, result) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(result);
            }
        );

        stream.end(buffer);
    });
}

function buildVideoThumbnailUrl(publicId) {
    ensureConfigured();

    return cloudinary.url(publicId, {
        resource_type: 'video',
        format: 'jpg',
        secure: true,
        transformation: [
            { width: 480, height: 854, crop: 'fill', gravity: 'auto' }
        ],
    });
}

function extractPublicIdFromUrl(url) {
    if (!url) {
        return null;
    }

    const uploadSegment = '/upload/';
    const uploadIndex = url.indexOf(uploadSegment);
    if (uploadIndex === -1) {
        return null;
    }

    const pathAfterUpload = url.slice(uploadIndex + uploadSegment.length);
    const pathParts = pathAfterUpload.split('/');
    const versionIndex = pathParts.findIndex((part) => /^v\d+$/.test(part));
    const publicPathParts = versionIndex >= 0 ? pathParts.slice(versionIndex + 1) : pathParts;

    if (publicPathParts.length === 0) {
        return null;
    }

    const joined = publicPathParts.join('/');
    return joined.replace(/\.[^/.]+$/, '');
}

async function destroyVideoByUrl(url) {
    ensureConfigured();
    const publicId = extractPublicIdFromUrl(url);

    if (!publicId) {
        return null;
    }

    return cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
}

module.exports = {
    uploadImageBuffer,
    uploadVideoBuffer,
    buildVideoThumbnailUrl,
    destroyVideoByUrl,
};
