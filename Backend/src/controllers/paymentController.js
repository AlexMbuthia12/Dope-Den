const axios = require('axios');
const Product = require('../models/Product');
const Order = require('../models/Order');

const DARAJA_BASE_URL = process.env.DARAJA_BASE_URL || 'https://sandbox.safaricom.co.ke';
const DARAJA_CONSUMER_KEY = process.env.DARAJA_CONSUMER_KEY;
const DARAJA_CONSUMER_SECRET = process.env.DARAJA_CONSUMER_SECRET;
const DARAJA_PASSKEY = process.env.DARAJA_PASSKEY;
const DARAJA_SHORTCODE = process.env.DARAJA_SHORTCODE;
const DARAJA_CALLBACK_URL = process.env.DARAJA_CALLBACK_URL || 'https://example.com/api/v1/payments/callback';
const DARAJA_ACCOUNT_REFERENCE = process.env.DARAJA_ACCOUNT_REFERENCE || 'DopeDen';
const DARAJA_TRANSACTION_TYPE = process.env.DARAJA_TRANSACTION_TYPE || 'CustomerPayBillOnline';

const normalizePhone = (rawPhone) => {
  if (!rawPhone) return null;
  const value = String(rawPhone).replace(/[^0-9+]/g, '');
  if (!value) return null;
  if (value.startsWith('+254')) return value.replace('+', '');
  if (value.startsWith('254')) return value;
  if (value.startsWith('0')) return `254${value.slice(1)}`;
  return value;
};

const getTimestamp = () => {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
};

const buildDarajaPassword = () => {
  const timestamp = getTimestamp();
  return Buffer.from(`${DARAJA_SHORTCODE}${DARAJA_PASSKEY}${timestamp}`).toString('base64');
};

const getAccessToken = async () => {
  if (!DARAJA_CONSUMER_KEY || !DARAJA_CONSUMER_SECRET) {
    throw new Error('Daraja credentials are not configured. Add DARAJA_CONSUMER_KEY, DARAJA_CONSUMER_SECRET, DARAJA_SHORTCODE, and DARAJA_PASSKEY.');
  }

  const response = await axios.get(`${DARAJA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${DARAJA_CONSUMER_KEY}:${DARAJA_CONSUMER_SECRET}`).toString('base64')}`,
    },
  });

  if (!response.data?.access_token) {
    throw new Error('Daraja token generation failed.');
  }

  return response.data.access_token;
};

const finalizeSuccessfulOrder = async (orderDoc) => {
  if (!orderDoc) return null;
  if (orderDoc.status === 'paid') return orderDoc;

  const productUpdates = [];

  for (const item of orderDoc.items || []) {
    const product = await Product.findById(item.productId);
    if (!product) continue;

    const remainingQuantity = Math.max(0, Number(product.stock || 0) - Number(item.quantity || 0));
    product.stock = remainingQuantity;
    product.status = remainingQuantity <= 0 ? 'sold' : 'active';
    productUpdates.push(product.save());
  }

  await Promise.all(productUpdates);

  orderDoc.status = 'paid';
  orderDoc.paymentConfirmedAt = new Date();
  await orderDoc.save();

  return orderDoc;
};

const initiateStkPush = async (req, res) => {
  try {
    const { orderId, amount, phone, order } = req.body || {};

    if (!orderId || !amount || !phone) {
      return res.status(400).json({
        success: false,
        message: 'orderId, amount, and phone are required.',
      });
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({
        success: false,
        message: 'A valid M-Pesa phone number is required.',
      });
    }

    const token = await getAccessToken();
    const timestamp = getTimestamp();
    const password = Buffer.from(`${DARAJA_SHORTCODE}${DARAJA_PASSKEY}${timestamp}`).toString('base64');

    const payload = {
      BusinessShortCode: Number(DARAJA_SHORTCODE),
      Password: password,
      Timestamp: timestamp,
      TransactionType: DARAJA_TRANSACTION_TYPE,
      Amount: Number(amount),
      PartyA: Number(normalizedPhone),
      PartyB: Number(DARAJA_SHORTCODE),
      PhoneNumber: Number(normalizedPhone),
      CallBackURL: DARAJA_CALLBACK_URL,
      AccountReference: DARAJA_ACCOUNT_REFERENCE,
      TransactionDesc: `DopeDen order ${orderId}`,
    };

    const response = await axios.post(`${DARAJA_BASE_URL}/mpesa/stkpush/v1/processrequest`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const orderDoc = await Order.findOneAndUpdate(
      { orderId },
      {
        orderId,
        customerPhone: normalizedPhone,
        amount: Number(amount),
        orderType: order?.type || 'delivery',
        items: order?.items || [],
        form: order?.form || {},
        merchantRequestId: response.data?.MerchantRequestID || null,
        checkoutRequestId: response.data?.CheckoutRequestID || null,
        status: 'initiated',
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: 'M-Pesa payment request sent successfully.',
      checkoutRequestId: orderDoc.checkoutRequestId,
      merchantRequestId: orderDoc.merchantRequestId,
      orderId: orderDoc.orderId,
    });
  } catch (error) {
    const message = error.response?.data?.errorMessage || error.message;
    return res.status(500).json({
      success: false,
      message: message || 'Unable to initiate M-Pesa payment right now.',
    });
  }
};

const handleCallback = async (req, res) => {
  try {
    const callback = req.body?.Body?.stkCallback;

    if (!callback) {
      return res.status(400).json({
        success: false,
        message: 'Invalid callback payload.',
      });
    }

    const checkoutRequestId = callback.CheckoutRequestID;
    const statusCode = Number(callback.ResultCode ?? -1);
    const order = await Order.findOne({ checkoutRequestId }) || await Order.findOne({ merchantRequestId: callback.MerchantRequestID });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found for this callback.',
      });
    }

    if (statusCode !== 0) {
      order.status = 'failed';
      order.failureReason = callback.ResultDesc || 'Payment failed';
      await order.save();

      return res.status(200).json({
        success: false,
        message: callback.ResultDesc || 'Payment failed.',
        orderId: order.orderId,
      });
    }

    const metadata = callback.CallbackMetadata?.Item || [];
    const amountEntry = metadata.find((item) => item.Name === 'Amount');
    const transactionIdEntry = metadata.find((item) => item.Name === 'TransactionID');
    const phoneEntry = metadata.find((item) => item.Name === 'PhoneNumber');

    order.amount = Number(amountEntry?.Value ?? order.amount ?? 0);
    order.transactionId = transactionIdEntry?.Value || order.transactionId;
    order.customerPhone = phoneEntry ? String(phoneEntry.Value || order.customerPhone) : order.customerPhone;

    await finalizeSuccessfulOrder(order);

    return res.status(200).json({
      success: true,
      message: 'Payment confirmed successfully.',
      orderId: order.orderId,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to process Daraja callback.',
    });
  }
};

const getOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    return res.status(200).json({
      success: true,
      orderId: order.orderId,
      status: order.status,
      transactionId: order.transactionId,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to load payment status.',
    });
  }
};

const mockSuccessfulPayment = async (req, res) => {
  try {
    const { orderId } = req.body || {};

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'orderId is required.',
      });
    }

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    await finalizeSuccessfulOrder(order);

    return res.status(200).json({
      success: true,
      message: 'Mock payment confirmation successful.',
      orderId: order.orderId,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to simulate successful payment.',
    });
  }
};

module.exports = {
  initiateStkPush,
  handleCallback,
  getOrderStatus,
  mockSuccessfulPayment,
  finalizeSuccessfulOrder,
};