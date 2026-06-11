const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lifeos';
  console.log(`MONGODB_URI exists: ${!!process.env.MONGODB_URI}`);
  console.log(`Connecting to: ${mongoURI.substring(0, 30)}...`);
  try {
    const conn = await mongoose.connect(mongoURI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`DB Connection Failed: ${error.message}`);
    // Don't exit, let the server still run
  }
};

module.exports = connectDB;
