const mongoose = require('mongoose');

const carouselSlideSchema = new mongoose.Schema({
  title: {
    type: String,
    default: 'Featured drop',
    trim: true,
  },
  subtitle: {
    type: String,
    default: 'Fresh arrivals for the season.',
    trim: true,
  },
  cta: {
    type: String,
    default: 'Shop now',
    trim: true,
  },
  type: {
    type: String,
    enum: ['image', 'video'],
    default: 'image',
  },
  src: {
    type: String,
    required: [true, 'Media URL is required'],
  },
  storageProvider: {
    type: String,
    enum: ['local', 'cloud', 'remote'],
    default: 'local',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('CarouselSlide', carouselSlideSchema);
