const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agent.controller');
const { auth, checkRole } = require('../middlewares/auth.middleware');
const { ROLES } = require('../utils/constants');

// Apply auth and role check (Only AGENTS can access these)
router.use(auth);
router.use(checkRole([ROLES.AGENT]));

router.get('/profile', agentController.getProfile);
router.put('/profile', agentController.updateProfile);
router.get('/my-vendors', agentController.getMyVendors);
router.get('/commission', agentController.getCommission);
router.post('/payout', agentController.createPayoutRequest);

module.exports = router;
