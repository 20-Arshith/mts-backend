const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendor.controller');
const { auth } = require('../middlewares/auth.middleware');

router.get('/categories', vendorController.getCategories);
router.get('/', auth, vendorController.getAllVendors);
router.get('/profile', auth, vendorController.getProfile);
router.patch('/profile', auth, vendorController.updateProfile);
router.get('/availability', auth, vendorController.getAvailability);
router.patch('/availability', auth, vendorController.updateAvailability);
router.get('/:id', auth, vendorController.getVendorDetails);
router.post('/my-services', auth, vendorController.saveMyServices);
router.post('/services', auth, vendorController.addService);
router.put('/services/:id', auth, vendorController.updateService);
router.patch('/services/:id/availability', auth, vendorController.updateServiceAvailability);

// Gallery (portfolio images)
router.get('/gallery/my', auth, vendorController.getGallery);
router.post('/gallery', auth, vendorController.addGalleryImage);
router.delete('/gallery/:id', auth, vendorController.deleteGalleryImage);

module.exports = router;
