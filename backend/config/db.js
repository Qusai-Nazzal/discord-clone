const mongoose = require('mongoose');

let isFallback = false;

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/discord_clone';
  try {
    mongoose.set('strictQuery', false);
    console.log(`Attempting to connect to MongoDB at ${mongoURI}...`);
   
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000
    });
    console.log('MongoDB Connected Successfully.');
    isFallback = false;
  } catch (err) {
    console.warn('\n======================================================');
    console.warn('WARNING: Failed to connect to MongoDB.');
    console.warn('Reason:', err.message);
    console.warn('FALLING BACK: Initializing in-memory JSON file database.');
    console.warn('Application remains fully functional!');
    console.warn('======================================================\n');
    isFallback = true;
  }
};

const getIsFallback = () => isFallback;

module.exports = { connectDB, getIsFallback };
