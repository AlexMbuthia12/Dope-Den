const mongoose = require('mongoose');
const { seedDefaultCategories } = require('./defaultCategories');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.DB_URI;

  if (!uri) {
    throw new Error('Please define MONGODB_URI or DB_URI in your environment variables.');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);

  mongoose.connection.on('connected', () => {
    console.log('MongoDB connected');
  });

  mongoose.connection.on('error', (error) => {
    console.error('MongoDB connection error:', error);
  });

  await seedDefaultCategories();
};

const getDb = () => {
  if (!mongoose.connection.db) {
    throw new Error('Database not connected yet.');
  }
  return mongoose.connection.db;
};

module.exports = { connectDB, getDb };