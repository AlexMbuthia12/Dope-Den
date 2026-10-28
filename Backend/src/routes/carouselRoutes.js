const express = require('express');
const router = express.Router();
const carouselController = require('../controllers/carouselController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.get('/', carouselController.getCarouselSlides);
router.post('/', authMiddleware, adminMiddleware, carouselController.createCarouselSlide);
router.delete('/:id', authMiddleware, adminMiddleware, carouselController.deleteCarouselSlide);

module.exports = router;
