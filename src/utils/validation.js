function createValidationError(message) {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
}

function createConflictError(message) {
    const error = new Error(message);
    error.statusCode = 409;
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

const EMPTY_OPTIONAL_VALUES = new Set(['', 'undefined', 'null']);

function normalizeOptionalAgentCode(value) {
    if (value === undefined || value === null) {
        return null;
    }

    const normalized = String(value).trim();
    if (EMPTY_OPTIONAL_VALUES.has(normalized.toLowerCase())) {
        return null;
    }

    return normalized.toUpperCase();
}

function normalizeLatitudeLongitude(value, label) {
    if (value === undefined || value === null || value === '') {
        return null;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        throw createValidationError(`${label} must be a valid number`);
    }

    return parsed;
}

function normalizeCategoryIds(categories) {
    const rawCategories = Array.isArray(categories)
        ? categories
        : (categories === undefined || categories === null || categories === '' ? [] : [categories]);

    const normalizedCategories = rawCategories
        .map((categoryId) => Number.parseInt(categoryId, 10))
        .filter((categoryId) => Number.isInteger(categoryId) && categoryId > 0);

    return [...new Set(normalizedCategories)];
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

function validateVendorRegistrationInput(payload = {}) {
    const full_name = normalizeOptionalString(payload.full_name);
    const business_name = normalizeOptionalString(payload.business_name);
    const mobile = normalizeOptionalString(payload.mobile);
    const email = normalizeOptionalString(payload.email, { lowercase: true });
    const whatsapp_number = normalizeOptionalString(payload.whatsapp_number) || mobile;
    const description = normalizeOptionalString(payload.description);
    const address = normalizeOptionalString(payload.address);
    const latitude = normalizeLatitudeLongitude(payload.latitude, 'Latitude');
    const longitude = normalizeLatitudeLongitude(payload.longitude, 'Longitude');
    const agent_code = normalizeOptionalAgentCode(payload.agent_code);
    const categories = normalizeCategoryIds(payload.categories);

    if (!full_name) {
        throw createValidationError('Owner name is required');
    }

    if (!business_name) {
        throw createValidationError('Business name is required');
    }

    if (!mobile && !email) {
        throw createValidationError('Mobile number or email is required');
    }

    if (mobile && !/^\d{10}$/.test(mobile)) {
        throw createValidationError('Mobile number must be exactly 10 digits');
    }

    if (whatsapp_number && !/^\d{10}$/.test(whatsapp_number)) {
        throw createValidationError('WhatsApp number must be exactly 10 digits');
    }

    if (email && !isValidEmail(email)) {
        throw createValidationError('Please enter a valid email address');
    }

    return {
        full_name,
        business_name,
        mobile,
        email,
        whatsapp_number,
        description,
        address,
        latitude,
        longitude,
        agent_code,
        categories,
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
    createConflictError,
    normalizeOptionalString,
    normalizeOptionalAgentCode,
    validateAgentOnboardingInput,
    validateVendorRegistrationInput,
    validateUserProfileInput,
    validateVendorServicePayload,
    isValidEmail,
};
