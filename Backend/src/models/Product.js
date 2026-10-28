const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    index: true,
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative'],
  },
  originalPrice: {
    type: Number,
    default: null,
  },
  discount: {
    type: String,
    default: null,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
  },
  images: {
    type: [String],
    required: [true, 'At least one image is required'],
  },
  sizes: {
    type: [String],
    enum: ['XXS', 'XS', 'S', 'S/M', 'M', 'M/L', 'L', 'XL', 'XXL', 'N/A', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    required: [true, 'At least one size is required'],
  },
  colors: {
    type: [String],
    required: [true, 'At least one color is required'],
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0,
  },
  status: {
    type: String,
    enum: ['active', 'sold'],
    default: 'active',
    index: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true,
  },
  brand: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create text index for search
productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
