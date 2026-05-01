const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);
router.post('/validate-agent-code', authController.validateAgentReferralCode);
router.post('/register-vendor', authController.registerVendor);
router.post('/register-agent', authController.registerAgent);
module.exports = router;
