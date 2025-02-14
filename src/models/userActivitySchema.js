const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema for the audit data
const auditSchema = new Schema({
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: String },
    updatedAt: { type: Date, default: '' },
}, { _id: false });

// Function to validate IP addresses
const validateIpAddress = (ip) => {
    // Regex for validating IPv4 and IPv6 addresses
    const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

    // Check if the IP is local for testing purposes (IPv4 and IPv6 loopback addresses)
    if (ip === '127.0.0.1' || ip === '::1') {
        return true;
    }

    // Validate using the regex for both IPv4 and IPv6
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
};

// Define the User Activity Schema
const userActivitySchema = new Schema(
    {
        _id: { type: Number, required: true },
        activityId: {
            type: String,
            required: true
        }, // Custom Activity ID
        userId: {
            type: String,
           
            required: true,
        },
        activityType: {
            type: String,
            required: true,
        },
        activityDetails: {
            type: String,
            required: false,  // Optional field to store details for the activity type
        },
        ipAddress: {
            type: String,
            validate: {
                validator: function (v) {
                    return validateIpAddress(v); // Validate the IP address
                },
                message: 'Invalid IP address format',
            },
            required: true,
        },
        deviceInfo: {
            os: { type: String },
            browser: { type: String },
            deviceType: { type: String },
            deviceName: { type: String },
        },
        endpoint: { type: String }, // API endpoint accessed
        requestMethod: { type: String },
        
        timestamp: {
            type: Date,
            default: Date.now,  // Automatically capture the timestamp of the activity
        },
        activityStatus: {
            type: String,
            enum: ['success', 'failed'],
            default: 'success',  // Track if the activity was successful or failed
        },
        // Audit fields
        audit: auditSchema,
        status: { type: Number, default: 1 } // 1-active, 0 - inactive
    },
    { timestamps: true }
);

// Add a TTL index on the timestamp field to auto-delete documents after 30 days
userActivitySchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('UserActivity', userActivitySchema);
