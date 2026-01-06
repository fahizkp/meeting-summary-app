const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/meeting_app';

let isConnected = false;

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
  if (isConnected) {
    console.log('MongoDB: Using existing connection');
    return;
  }

  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      // Mongoose 6+ doesn't need these options, but keeping for compatibility
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
      isConnected = true;
    });

  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    // Don't exit the process - allow fallback to Google Sheets
    isConnected = false;
  }
};

/**
 * Check if MongoDB is connected
 */
const isMongoConnected = () => {
  return isConnected && mongoose.connection.readyState === 1;
};

/**
 * Disconnect from MongoDB
 */
const disconnectDB = async () => {
  if (isConnected) {
    await mongoose.connection.close();
    isConnected = false;
    console.log('MongoDB disconnected');
  }
};

module.exports = {
  connectDB,
  isMongoConnected,
  disconnectDB,
  mongoose,
};
