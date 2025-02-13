const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables
const logger = require('../utils/logger'); // Import logging utility

// Determine the correct database URI based on environment
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const DB_URI = IS_PRODUCTION ? process.env.MIKIINDIA_MONGODB_URI : process.env.MONGO_URI_LOCAL;
const DB_SOURCE = IS_PRODUCTION ? 'MongoDB Atlas (Production)' : 'MongoDB Compass (Local)';

// Retry function with exponential backoff for reliability
const retryOperation = async (operation, retries = 5, delay = 2000) => {
    let lastError;
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            logger.error(`Retry ${attempt + 1}/${retries} failed: ${error.message}`);

            if (attempt < retries - 1) {
                const delayTime = delay * Math.pow(2, attempt); // Exponential backoff
                logger.info(`Retrying in ${delayTime / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, delayTime));
            }
        }
    }
    throw lastError; // Throw last error if retries are exhausted
};

// Function to connect to MongoDB (Local or Atlas)
const connectDB = async () => {
    if (!DB_URI) {
        logger.error('❌ No MongoDB URI provided in environment variables.');
        throw new Error('Database URI is not configured');
    }

    try {
        await retryOperation(() =>
            mongoose.connect(DB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                maxPoolSize: 10, // Limit connection pool size
                serverSelectionTimeoutMS: 20000, // Wait time for selecting a server
                socketTimeoutMS: 45000, // Timeout for socket operations
            })
        );

        logger.info(`✅ Connected to ${DB_SOURCE} in ${process.env.NODE_ENV} mode.`);
    } catch (err) {
        logger.error(`❌ Failed to connect to MongoDB after retries: ${err.message}`);
        process.exit(1); // Exit the process if all retries fail
    }

    // Mongoose Event Listeners
    mongoose.connection.on('connected', () => logger.info(`🔄 Mongoose connected to ${DB_SOURCE}.`));
    mongoose.connection.on('error', err => logger.error(`⚠️ Mongoose error: ${err.message}`));
    mongoose.connection.on('disconnected', () => logger.warn('⚠️ Mongoose disconnected.'));

    // Handle unexpected disconnections
    process.on('SIGINT', async () => {
        await mongoose.connection.close();
        logger.info('🚪 MongoDB connection closed due to application termination.');
        process.exit(0);
    });
};

module.exports = connectDB;
