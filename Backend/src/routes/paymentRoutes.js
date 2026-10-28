const express = require('express');
const paymentController = require('../controllers/paymentController');

console.log('PAYMENT CONTROLLER:', paymentController);

const router = express.Router();

router.post('/stkpush', paymentController.initiateStkPush);
router.post('/callback', paymentController.handleCallback);
router.get('/status/:orderId', paymentController.getOrderStatus);
router.post('/mock-success', paymentController.mockSuccessfulPayment);

module.exports = router;
