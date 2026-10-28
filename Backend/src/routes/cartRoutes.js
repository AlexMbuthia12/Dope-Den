const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authMiddleware } = require('../middleware/auth');

// All cart routes require authentication
router.use(authMiddleware);

router.get('/', cartController.getCart);
router.post('/items', cartController.addToCart);
router.put('/items/:itemId', cartController.updateCartItem);
router.delete('/items/:itemId', cartController.removeFromCart);

module.exports = router;
