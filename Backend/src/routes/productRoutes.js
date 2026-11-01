const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { limitProductBatches } = require('../middleware/rateLimiter'); // Imported the token bucket rate limiter middleware

// Public routes
// CHANGED: Added `limitProductBatches` middleware before `getProducts`. 
// WHY: This enforces the token bucket rate limit (max 3 batch queries per 3 seconds, capped at 69 items per request) 
// tracked uniquely per user ID (if logged in) or IP address (for guests) to prevent scraping and abuse.
router.get('/', limitProductBatches, productController.getProducts);
router.get('/:id', productController.getProductById);

// Admin routes (Unchanged)
router.post('/', authMiddleware, adminMiddleware, productController.createProduct);
router.put('/:id', authMiddleware, adminMiddleware, productController.updateProduct);
router.delete('/:id', authMiddleware, adminMiddleware, productController.deleteProduct);

module.exports = router;