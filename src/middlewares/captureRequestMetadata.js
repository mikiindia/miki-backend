const captureRequestMetadata = (req, res, next) => {
    console.log("User-Agent:", req.headers['user-agent']);
   
    req.metadata = {
        ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        endpoint: req.originalUrl, // The requested URL
        requestMethod: req.method, // HTTP method (GET, POST, etc.)
        deviceInfo: parseUserAgent(req.headers['user-agent']), // Device information
    };
    next();
};

 
/**
 * Helper function to parse the user-agent header.
 * This function utilizes the `ua-parser-js` library to extract information
 * about the operating system, browser, device type, and device name
 * from the provided user-agent string.
 *
 * @param {string} userAgent - The user-agent string from the request headers.
 * @returns {Object} An object containing parsed details about the user's device.
 */
// Helper function to parse the user-agent header
const parseUserAgent = (userAgent) => {
    // Return an empty object if the user-agent is not provided
    if (!userAgent) return {};

    // Import the ua-parser-js library
    const parser = require('ua-parser-js'); // Ensure to install this library using `npm install ua-parser-js`
    
    // Parse the user-agent string to extract device information
     const ua = parser(userAgent);

    // Return an object with details about the OS, browser, device type, and device name
    return {
        os: ua.os.name || 'Unknown OS',
        browser: ua.browser.name || 'Unknown Browser',
        deviceType: ua.device.type || 'Unknown Device',
        deviceName: ua.device.model || 'Unknown Device',
    };
};
 

module.exports = captureRequestMetadata;
