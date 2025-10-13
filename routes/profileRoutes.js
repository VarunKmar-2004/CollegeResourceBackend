const express = require('express');
const auth = require('../middleware/auth');
const profileController = require('../controllers/profileController');

const router = express.Router();

// GET /api/profile/me
router.get('/me', auth, profileController.getMyProfile);

module.exports = router;
