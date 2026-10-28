const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  size: {
    type: String,
    default: null,
  },
  color: {
    type: String,
    default: null,
  },
  image: {
    type: String,
    default: null,
  },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  customerPhone: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  orderType: {
    type: String,
    enum: ['delivery', 'pickup'],
    required: true,
  },
  items: {
    type: [orderItemSchema],
    required: true,
  },
  form: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  status: {
    type: String,
    enum: ['pending', 'initiated', 'paid', 'failed'],
    default: 'pending',
    index: true,
  },
  merchantRequestId: {
    type: String,
    default: null,
  },
  checkoutRequestId: {
    type: String,
    default: null,
  },
  transactionId: {
    type: String,
    default: null,
  },
  failureReason: {
    type: String,
    default: null,
  },
  paymentConfirmedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

orderSchema.pre('save', function preSave(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Order', orderSchema);
