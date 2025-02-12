// src/database/connectDB.js
const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables
const logger = require('../utils/logger'); // Structured logging utility

// Retry function with exponential backoff
const retryOperation = async (operation, retries = 10, delay = 2000) => {
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

// Function to connect to MongoDB Atlas
const connectDB = async () => {
    const uri = process.env.MIKIINDIA_MONGODB_URI;

    if (!uri) {
        logger.error('No MongoDB URI provided in environment variables.');
        throw new Error('Database URI not configured');
    }

    try {
        // Retry the connection with the retryOperation function
        await retryOperation(() =>
            mongoose.connect(uri, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                maxPoolSize: 10, // Limit the number of connections in the pool
                serverSelectionTimeoutMS: 20000, // Timeout for server selection
                socketTimeoutMS: 45000, // Timeout for socket operations
            })
        );

        logger.info('✅ MongoDB Atlas connected successfully.');
    } catch (err) {
        logger.error(`❌ Failed to connect to MongoDB after retries: ${err.message}`);
        process.exit(1); // Exit the process if all retries fail
    }

    // Set up Mongoose event listeners
    mongoose.connection.on('connected', () => logger.info('Mongoose connected.'));
    mongoose.connection.on('error', (err) => logger.error(`Mongoose error: ${err.message}`));
    mongoose.connection.on('disconnected', () => logger.warn('Mongoose disconnected.'));
};

// Graceful shutdown handling
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed due to application termination.');
    process.exit(0);
});

module.exports = connectDB;
