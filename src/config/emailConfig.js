const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const winston = require('winston'); // For logging
const { setTimeout } = require('timers/promises');

dotenv.config();

// ✅ Logger Configuration
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/email.log' }) // Save logs in file
    ],
});

// ✅ SMTP Configuration (Using Environment Variables)
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.EMAIL_SECURE === 'true', // Use SSL/TLS if true
    auth: {
        user: process.env.EMAIL_USER, // Email address
        pass: process.env.EMAIL_PASS, // App Password or SMTP Password
    },
    tls: {
        rejectUnauthorized: false, // Allows self-signed certificates (optional)
    },
    pool: true, // Enables connection pooling
    maxConnections: 5, // Limits simultaneous connections
    maxMessages: 100, // Max messages per connection
});

// ✅ Check SMTP Connection on Startup
const checkEmailConnection = async (retries = 3) => {
    while (retries > 0) {
        try {
            await transporter.verify();
            logger.info('✅ SMTP Server is ready to send emails.');
            return true;
        } catch (error) {
            logger.error(`❌ SMTP Connection Failed: ${error.message}`);
            retries--;
            if (retries > 0) {
                logger.warn(`🔄 Retrying SMTP connection in 5 seconds... (${retries} attempts left)`);
                await setTimeout(5000); // Wait 5 seconds before retrying
            } else {
                logger.error('❌ All SMTP connection attempts failed.');
                throw new Error('SMTP connection failed after multiple retries.');
            }
        }
    }
};

// ✅ Function to Send Email with Automatic Retry
const sendEmail = async (mailOptions, retries = 3) => {
    while (retries > 0) {
        try {
            const info = await transporter.sendMail(mailOptions);
            logger.info(`📧 Email Sent: ${info.messageId} to ${mailOptions.to}`);
            return info;
        } catch (error) {
            logger.error(`⚠️ Email Sending Failed: ${error.message}`);
            retries--;
            if (retries > 0) {
                logger.warn(`🔄 Retrying email in 5 seconds... (${retries} attempts left)`);
                await setTimeout(5000); // Wait before retrying
            } else {
                logger.error('❌ Email sending failed after multiple retries.');
                throw new Error('Email sending failed after multiple retries.');
            }
        }
    }
};

// ✅ Initialize SMTP Connection Check
checkEmailConnection();

module.exports = { transporter, sendEmail };
