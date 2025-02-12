const VALID_ACTIVITY_TYPES = require('../config/activityType');
const UserActivity = require('../models/userActivitySchema');
const getNextSequenceId = require('../utils/nextSequenceId');
const { getNextActivityID } = require('../utils/sequenceActivityID'); // Function to get next role ID

const logUserActivity = async ({ userId, activityType, activityDetails, ipAddress, deviceInfo, endpoint, method, activityStatus }) => {
    try {
        // Validate activity type
        if (!VALID_ACTIVITY_TYPES.includes(activityType)) {
            console.warn(`Invalid activity type: ${activityType}`);
            activityType = 'UNKNOWN';
        }
        const activityId = await getNextActivityID();

        // Create a new activity log
        const activityLog = new UserActivity({
            _id: await getNextSequenceId('activity'),
            activityId,
            userId,
            activityType,
            activityDetails,
            ipAddress,
            deviceInfo,
            endpoint,
            method,
            timestamp: new Date(),
            activityStatus,
            audit: {
                createdAt: new Date(),
                createdBy: userId,
            },
            status: 1, // Active
        });

        await activityLog.save();
        console.log(`Activity logged: ${activityType} for User: ${userId}`);
    } catch (err) {
        console.error(`Failed to log activity for User: ${userId}`, err);
    }
};
 
        
module.exports = logUserActivity;
