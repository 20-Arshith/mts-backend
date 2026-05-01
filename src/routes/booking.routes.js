const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { auth } = require('../middlewares/auth.middleware');

router.post('/', auth, bookingController.createBooking);
router.get('/my', auth, bookingController.getMyBookings);
router.get('/my/:id', auth, bookingController.getMyBookingById);
router.get('/vendor', auth, bookingController.getVendorBookings);
router.post('/:id/review', auth, bookingController.saveReview);
router.patch('/:id/status', auth, bookingController.updateStatus);
module.exports = router;
