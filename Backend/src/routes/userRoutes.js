const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middleware/auth');

// All user routes require authentication
router.use(authMiddleware);

router.get('/me', userController.getUserProfile);
router.put('/me', userController.updateUserProfile);

module.exports = router;
