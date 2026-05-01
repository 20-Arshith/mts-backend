function createValidationError(message) {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
}

function normalizeOptionalString(value, { lowercase = false } = {}) {
    if (value === undefined || value === null) {
        return null;
    }

    const normalized = String(value).trim();
    if (!normalized) {
        return null;
    }

    return lowercase ? normalized.toLowerCase() : normalized;
}

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateAgentOnboardingInput(payload = {}) {
    const full_name = normalizeOptionalString(payload.full_name);
    const mobile = normalizeOptionalString(payload.mobile);
    const email = normalizeOptionalString(payload.email, { lowercase: true });

    if (!full_name) {
        throw createValidationError('Full name is required');
    }

    if (!mobile && !email) {
        throw createValidationError('At least one contact detail is required: phone number or email');
    }

    if (mobile && !/^\d{10}$/.test(mobile)) {
        throw createValidationError('Mobile number must be exactly 10 digits');
    }

    if (email && !isValidEmail(email)) {
        throw createValidationError('Please enter a valid email address');
    }

    return {
        full_name,
        mobile,
        email,
    };
}

function validateUserProfileInput(payload = {}, options = {}) {
    const requireRegistrationFields = Boolean(options.requireRegistrationFields);
    const hasOwn = (key) => Object.prototype.hasOwnProperty.call(payload, key);

    const full_name = normalizeOptionalString(payload.full_name);
    const mobile = normalizeOptionalString(payload.mobile);
    const email = normalizeOptionalString(payload.email, { lowercase: true });
    const address = normalizeOptionalString(payload.address);
    const latitude = payload.latitude;
    const longitude = payload.longitude;

    if (hasOwn('full_name') && !full_name) {
        throw createValidationError('Name is required');
    }

    if (mobile && !/^\d{10}$/.test(mobile)) {
        throw createValidationError('Mobile number must be exactly 10 digits');
    }

    if (email && !isValidEmail(email)) {
        throw createValidationError('Please enter a valid email address');
    }

    if (hasOwn('latitude') && latitude !== null && latitude !== undefined && !Number.isFinite(Number(latitude))) {
        throw createValidationError('Latitude must be a valid number');
    }

    if (hasOwn('longitude') && longitude !== null && longitude !== undefined && !Number.isFinite(Number(longitude))) {
        throw createValidationError('Longitude must be a valid number');
    }

    if (requireRegistrationFields) {
        if (!full_name) {
            throw createValidationError('Name is required');
        }

        if (!mobile) {
            throw createValidationError('Phone number is required');
        }
    }

    return {
        ...(hasOwn('full_name') ? { full_name } : {}),
        ...(hasOwn('mobile') ? { mobile } : {}),
        ...(hasOwn('email') ? { email } : {}),
        ...(hasOwn('address') ? { address } : {}),
        ...(hasOwn('latitude') ? { latitude: latitude === null || latitude === undefined || latitude === '' ? null : Number(latitude) } : {}),
        ...(hasOwn('longitude') ? { longitude: longitude === null || longitude === undefined || longitude === '' ? null : Number(longitude) } : {}),
    };
}

function parseOptionalPrice(value) {
    if (value === undefined || value === null || value === '') {
        return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
}

function validateVendorServicePayload(payload = {}) {
    const categoryId = Number.parseInt(payload.category_id, 10);
    const serviceTitle = normalizeOptionalString(payload.service_title);
    const description = normalizeOptionalString(payload.description);
    const priceMin = parseOptionalPrice(payload.price_min);
    const rawPriceMax = parseOptionalPrice(payload.price_max);
    const priceMax = rawPriceMax === null ? priceMin : rawPriceMax;

    // image_urls: accept an array of strings, filter blanks, cap at 10
    const rawImageUrls = Array.isArray(payload.image_urls) ? payload.image_urls : [];
    const imageUrls = rawImageUrls
        .map((u) => (typeof u === 'string' ? u.trim() : ''))
        .filter(Boolean)
        .slice(0, 10);

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
        throw createValidationError('A valid service category is required');
    }

    if (!serviceTitle) {
        throw createValidationError('Service title is required');
    }

    if (Number.isNaN(priceMin) || priceMin === null || priceMin < 0) {
        throw createValidationError('Please enter a valid minimum price');
    }

    if (Number.isNaN(priceMax) || priceMax === null || priceMax < 0) {
        throw createValidationError('Please enter a valid maximum price');
    }

    if (priceMax < priceMin) {
        throw createValidationError('Maximum price must be greater than or equal to minimum price');
    }

    return {
        category_id: categoryId,
        service_title: serviceTitle,
        description,
        price_min: priceMin,
        price_max: priceMax,
        image_urls: imageUrls,
    };
}

module.exports = {
    createValidationError,
    normalizeOptionalString,
    validateAgentOnboardingInput,
    validateUserProfileInput,
    validateVendorServicePayload,
    isValidEmail,
};
