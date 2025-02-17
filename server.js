// src/server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv'); // For environment variables
const winston = require('winston'); // For logging
const helmet = require('helmet'); // For security headers
const connectDB = require('./src/config/db.js'); // MongoDB connection
const logger = require('./src/utils/logger'); // Import the logger
const cors = require('cors'); // Import CORS
const captureRequestMetadata = require('./src/middlewares/captureRequestMetadata');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const app = express();  // Create the app instance
 
// Load environment variables from .env file
dotenv.config();

app.use(captureRequestMetadata); // Apply globally
 
// retrieve the client's IP address from x-forwarded-for header if app is behind a proxy (e.g., AWS ELB, Nginx)
app.set('trust proxy', true);

// Use security headers with Helmet for enhanced security
app.use(helmet());

// Enable CORS
app.use(cors());  //  This allows all origins by default

// Middleware to parse incoming JSON requests
app.use(express.json());

// Middleware to log every incoming request (using Winston logger)
app.use((req, res, next) => {
  logger.info(`Request - ${req.method} ${req.url}`);
  next();
});

// Connect to MongoDB database
connectDB();

// Define a custom token for the endpoint
morgan.token('endpoint', (req) => {
  return req.originalUrl.split('?')[0]; // Remove query parameters
});

// Use the custom token in the log format
app.use(morgan(':method :endpoint :status :res[content-length] - :response-time ms'));

// // === Apply Rate Limiting ===
// // General API Rate Limiter (100 requests per 30 minutes)
// const generalRateLimiter = rateLimit({
//   windowMs: 30 * 60 * 1000, // 30 minutes
//   max: 100, // Limit each IP to 100 requests per window
//   message: { error: "Too many requests, please try again later." },
//   headers: true,
// });

// // Email Verification Rate Limiter (5 requests per 12 hours)
// const emailVerificationLimiter = rateLimit({
//   windowMs: 12 * 60 * 60 * 1000, // 12 hours
//   max: 5, // Limit each IP to 5 requests per window
//   message: { error: "You have reached the limit. Try again after 12 hours." },
//   headers: true,
// });   //

// // Apply general rate limiting to all routes except email verification
// app.use('/api', generalRateLimiter);
// app.use('/api/email-verification', emailVerificationLimiter);

// // Routes for user-related operations
 app.use('/api', require('./src/routes/roleRoutes'));
 app.use('/api', require('./src/routes/moduleNameRoutes'));
 app.use('/api', require('./src/routes/superAdminRoutes'));
// app.use('/api', require('./src/routes/usersRoutes'));
// app.use('/api', require('./src/routes/userBadgeRoutes'));
// app.use('/api', require('./src/routes/userPreferenceRoutes'));
//app.use('/api/email-verification', require('./src/routes/verifyEmailRoutes')); // Uses the special limiter



// Error Handling Middleware (404 for unknown routes)
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error Handling Middleware for uncaught exceptions and rejections
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1); // Exit the process with failure code
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1); // Exit the process with failure code
});

// Graceful Shutdown Handling
process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  await mongoose.connection.close();
  logger.info('MongoDB disconnected');
  process.exit(0);
});

// Start the server and listen on the specified port (3001 in this case)
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
