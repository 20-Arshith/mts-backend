const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');
const { uploadImage } = require('../middlewares/upload.middleware');
const { auth } = require('../middlewares/auth.middleware');

router.post('/image', auth, uploadImage, uploadController.uploadImage);

module.exports = router;
