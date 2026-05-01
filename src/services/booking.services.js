const bookingRepository = require('../repositories/booking.repository');
const reviewRepository = require('../repositories/review.repository');
const notificationService = require('./notification.services');
const vendorServiceRepository = require('../repositories/vendor-service.repository');
const vendorAvailabilityRepository = require('../repositories/vendor-availability.repository');
const prisma = require('../config/db');
const {
    buildDateSlots,
    formatTimeLabel,
    formatLocalDateKey,
    mergeScheduleWithDefaults,
} = require('../utils/availability');

let bookingCompletionOtpColumnsEnsured = false;

const ensureBookingCompletionOtpColumns = async () => {
    if (bookingCompletionOtpColumnsEnsured) {
        return;
    }

    await prisma.$executeRawUnsafe(`
        ALTER TABLE "bookings"
        ADD COLUMN IF NOT EXISTS "completion_otp" TEXT,
        ADD COLUMN IF NOT EXISTS "completion_otp_generated_at" TIMESTAMP(3),
        ADD COLUMN IF NOT EXISTS "completion_otp_verified_at" TIMESTAMP(3)
    `);

    await prisma.$executeRawUnsafe(`
        UPDATE "bookings"
        SET
            "completion_otp" = COALESCE("completion_otp", LPAD(((ABS(("booking_id" * 7919) % 900000)) + 100000)::text, 6, '0')),
            "completion_otp_generated_at" = COALESCE("completion_otp_generated_at", "created_at", CURRENT_TIMESTAMP)
        WHERE "completion_otp" IS NULL
    `);

    bookingCompletionOtpColumnsEnsured = true;
};

const generateCompletionOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const sanitizeVendorBookingResponse = (booking) => {
    if (!booking) {
        return booking;
    }

    const sanitizedBooking = { ...booking };
    delete sanitizedBooking.completion_otp;
    delete sanitizedBooking.completion_otp_generated_at;
    delete sanitizedBooking.completion_otp_verified_at;
    return sanitizedBooking;
};

exports.createBooking = async (bookingData) => {
    await ensureBookingCompletionOtpColumns();

    if (!Number.isInteger(Number(bookingData.user_id)) || Number(bookingData.user_id) <= 0) {
        const error = new Error('Please log in with a user account to continue');
        error.statusCode = 401;
        throw error;
    }

    const service = await vendorServiceRepository.findById(bookingData.vendor_service_id, 'id');
    if (!service || !service.is_available || service.approval_status !== 'approved') {
        throw new Error('Selected service is not available for booking');
    }

    const serviceDetails = await vendorServiceRepository.findServiceDetails(bookingData.vendor_service_id);
    const vendor = serviceDetails?.vendor;
    if (!vendor || vendor.approval_status !== 'approved' || !vendor.is_available) {
        throw new Error('Vendor is not available for booking');
    }

    if (!bookingData.scheduled_at || Number.isNaN(bookingData.scheduled_at.getTime())) {
        throw new Error('Please select a valid booking time');
    }

    const vendorSchedule = await vendorAvailabilityRepository.findByVendor(vendor.vendor_id);
    const daySchedule = mergeScheduleWithDefaults(vendorSchedule).find(
        (item) => item.day_of_week === bookingData.scheduled_at.getDay()
    );

    const startOfDay = new Date(bookingData.scheduled_at);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const dayBookings = await bookingRepository.findVendorBookingsInRange(
        vendor.vendor_id,
        startOfDay,
        endOfDay
    );

    const availableDates = buildDateSlots({
        schedule: vendorSchedule,
        bookings: dayBookings,
        days: 1,
        vendorAvailable: vendor.is_available,
        startDate: startOfDay,
    });

    const requestedDate = formatLocalDateKey(bookingData.scheduled_at);
    const requestedTime = bookingData.scheduled_at.toTimeString().slice(0, 5);
    const matchingDate = availableDates.find((item) => item.date === requestedDate);
    const matchingSlot = matchingDate?.slots.find((slot) => slot.value === requestedTime);

    if (!matchingSlot?.available) {
        throw new Error('Selected slot is no longer available');
    }

    const conflictingBooking = await bookingRepository.findVendorBookingConflict(
        vendor.vendor_id,
        bookingData.scheduled_at
    );
    if (conflictingBooking) {
        throw new Error('Selected slot is already booked');
    }

    const booking = await bookingRepository.create({
        ...bookingData,
        completion_otp: generateCompletionOtp(),
        completion_otp_generated_at: new Date(),
        booking_date: requestedDate,
        booking_time: formatTimeLabel(requestedTime),
    });

    await Promise.all([
        notificationService.createNotification({
            recipient_user_id: bookingData.user_id,
            booking_id: booking.booking_id,
            title: 'Booking request submitted',
            message: `${vendor.business_name} has received your booking request for ${service.service_title}.`,
            type: 'booking_created',
        }),
        notificationService.createNotification({
            recipient_user_id: vendor.vendor_id,
            booking_id: booking.booking_id,
            title: 'New booking request',
            message: `You received a new booking request for ${service.service_title} on ${requestedDate} at ${formatTimeLabel(requestedTime)}.`,
            type: 'booking_created',
        }),
    ]);

    return booking;
};

exports.getUserBookings = async (userId) => {
    await ensureBookingCompletionOtpColumns();
    return await bookingRepository.findUserBookings(userId);
};

exports.getVendorBookings = async (vendorId) => {
    await ensureBookingCompletionOtpColumns();
    return await bookingRepository.findVendorBookings(vendorId);
};

exports.updateBookingStatus = async (id, status, vendorId, completionOtp) => {
    await ensureBookingCompletionOtpColumns();

    const booking = await bookingRepository.findByIdWithVendor(id);
    if (!booking || booking.vendor_service?.vendor_id !== vendorId) {
        throw new Error('Booking not found');
    }

    const normalizedStatus = String(status || '').trim().toLowerCase();
    const currentStatus = String(booking.booking_status || '').trim().toLowerCase();

    const allowedStatuses = ['confirmed', 'accepted', 'cancelled', 'completed'];
    if (!allowedStatuses.includes(normalizedStatus)) {
        const error = new Error('Invalid booking status');
        error.statusCode = 400;
        throw error;
    }

    if (currentStatus === 'completed') {
        const error = new Error('This booking is already completed');
        error.statusCode = 400;
        throw error;
    }

    if (currentStatus === 'cancelled') {
        const error = new Error('This booking has already been cancelled');
        error.statusCode = 400;
        throw error;
    }

    if (normalizedStatus === 'completed' && !['accepted', 'confirmed'].includes(currentStatus)) {
        const error = new Error('Only accepted orders can be marked as done');
        error.statusCode = 400;
        throw error;
    }

    const updateData = {
        booking_status: normalizedStatus === 'accepted' ? 'confirmed' : normalizedStatus,
    };

    if (['confirmed', 'accepted'].includes(normalizedStatus)) {
        updateData.completion_otp = booking.completion_otp || generateCompletionOtp();
        updateData.completion_otp_generated_at = booking.completion_otp_generated_at || new Date();
        updateData.completion_otp_verified_at = null;
    }

    if (normalizedStatus === 'completed') {
        const normalizedOtp = String(completionOtp || '').trim();
        if (!normalizedOtp) {
            const error = new Error('Please enter the user OTP to mark this order as done');
            error.statusCode = 400;
            throw error;
        }

        if (!booking.completion_otp || normalizedOtp !== String(booking.completion_otp)) {
            const error = new Error('Invalid OTP');
            error.statusCode = 400;
            throw error;
        }

        updateData.completion_otp_verified_at = new Date();
    }

    const updatedBooking = await bookingRepository.update(id, updateData, 'booking_id');

    const bookingDetails = await bookingRepository.findByIdWithDetails(id);
    if (bookingDetails) {
        const serviceTitle = bookingDetails.vendor_service?.service_title || 'your service';
        const vendorName = bookingDetails.vendor_service?.vendor?.business_name || 'The vendor';
        const finalStatus = updateData.booking_status;
        const statusLabel = finalStatus.charAt(0).toUpperCase() + finalStatus.slice(1);
        const otpLine = ['confirmed', 'accepted'].includes(normalizedStatus) && bookingDetails.completion_otp
            ? ` Your service completion OTP is ${bookingDetails.completion_otp}. Share it only after the service is finished.`
            : '';

        await notificationService.createNotification({
            recipient_user_id: bookingDetails.user_id,
            booking_id: bookingDetails.booking_id,
            title: `Booking ${statusLabel}`,
            message: `${vendorName} marked your booking for ${serviceTitle} as ${finalStatus}.${otpLine}`,
            type: 'booking_status',
        });
    }

    return sanitizeVendorBookingResponse(updatedBooking);
};

exports.getUserBookingById = async (bookingId, userId) => {
    await ensureBookingCompletionOtpColumns();
    const booking = await bookingRepository.findByIdForUser(bookingId, userId);
    if (!booking) {
        throw new Error('Booking not found');
    }
    return booking;
};

exports.saveReview = async (bookingId, userId, reviewData) => {
    await ensureBookingCompletionOtpColumns();
    const rating = Number(reviewData.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        throw new Error('Please provide a valid rating between 1 and 5');
    }

    const booking = await bookingRepository.findCompletedBookingForUser(bookingId, userId);
    if (!booking) {
        throw new Error('Completed booking not found');
    }

    await reviewRepository.upsertForBooking(bookingId, userId, {
        rating,
        comment: reviewData.comment,
    });
    return await bookingRepository.findByIdForUser(bookingId, userId);
};
