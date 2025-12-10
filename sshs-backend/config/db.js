// sshs-backend/config/db.js
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('MongoDB connection failed: MONGO_URI is not set');
      return;
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected successfully.');
  } catch (err) {
    console.error(`MongoDB Connection Error: ${err.message}`);
    // In serverless we avoid process.exit; just log and let the function fail
  }
};

module.exports = connectDB;
