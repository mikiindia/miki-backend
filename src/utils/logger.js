const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Create the logger instance
const logger = createLogger({
    level: process.env.LOG_LEVEL || 'info', // Default log level
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Add timestamps
        format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`) // Log format
    ),
    transports: [
        new transports.Console({
            format: format.combine(format.colorize(), format.simple()), // For console output
        }),

        // Daily Rotate File for all logs
        new DailyRotateFile({
            filename: path.join(__dirname, '../logs/combined-%DATE%.log'), // Log file naming pattern
            datePattern: 'YYYY-MM-DD', // Rotate daily
            zippedArchive: true, // Compress old log files
            maxSize: '20m', // Maximum size of a log file ( 20MB)
            maxFiles: '5d', // Retain logs for 5 days
            level: 'info', // Log level for this transport
        }),

        // Daily Rotate File for errors
        new DailyRotateFile({
            filename: path.join(__dirname, '../logs/error-%DATE%.log'), // Separate error logs
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '5d',
            level: 'error', // Only error level logs
        }),
    ],
});

// Add an additional log for server-specific activities (optional)
logger.stream = {
    write: (message) => {
        logger.info(message.trim()); // Log server activities or requests
    },
};


module.exports = logger;
