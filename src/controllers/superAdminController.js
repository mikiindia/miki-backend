 const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const MasterUser = require('../models/masterUserSchema');
const { generateAccessToken, generateRefreshToken } = require('../utils/tokenUtils');
const { body, validationResult } = require('express-validator');
dotenv.config();
const Role = require('../models/roleSchema');
const bcrypt = require('bcrypt');
const SuperAdmin = require('../models/superAdminSchema');
const { getNextSupID } = require('../utils/sequenceSupID'); // Function to get next role ID
const getNextSequenceId = require('../utils/nextSequenceId'); // Auto-increment helper
const logUserActivity = require('../utils/activityLogger'); // ✅ Ensure correct import
 
 

// ** Register Super Admin **
const registerSuperadmin = async (req, res) => {
    try {
        // ** Validation Rules **
        await body('email_id').isEmail().withMessage('Invalid email format').run(req);
        await body('phone_Number').isNumeric().isLength({ min: 10, max: 15 })
            .withMessage('Phone number must be between 10-15 digits').run(req);
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ status: 400, errors: errors.array() });
        }

        // ** Extract Data from Request **
        const { companyId, companyName, companySize, registrationNumber, companyLogo, 
                domain, country, ownerName, email_id, phone_Number, password, address } = req.body;

        // ** Check if Email already exists **
        const existingSuperadmin = await SuperAdmin.findOne({ email_id, status: 1 });
        if (existingSuperadmin) {
            return res.status(400).json({ status: 400, message: 'Email already registered' });
        }

        // ** Fetch Role ID for "SUPER ADMIN" **
        const superAdminRole = await Role.findOne({ roleName: "SUPER ADMIN", status: 1 });
        if (!superAdminRole) {
            return res.status(400).json({ status: 400, message: 'SUPER ADMIN role not found' });
        }

        // ** Generate next _id for SuperAdmin **
         // Generate custom _id and userId
         const id = await getNextSequenceId('superadmin');
         const superAdminId = await getNextSupID();

        // ** Hash Password **
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // ** Create SuperAdmin Object **
        const newSuperAdmin = new SuperAdmin({
            _id: id,
            superAdminId , // Generate unique ID
            companyId,
            companyName,
            companySize,
            registrationNumber,
            companyLogo,
            domain,
            country,
            ownerName,
            email_id,
            phone_Number,
            password: hashedPassword,
            roleId: superAdminRole.roleId, // Assign fetched Role ID
            address,
            isVerified: false,
            status: 1,
            audit: { createdAt: new Date(), createdBy: "System" }
        });

        // ** Save Super Admin to DB **
        await newSuperAdmin.save();
        return res.status(201).json({ status: 201, message: 'SuperAdmin registered successfully', data: newSuperAdmin });

    } catch (error) {
        console.error("❌ Error in registerSuperadmin:", error);
        return res.status(500).json({ status: 500, message: 'Internal Server Error' });
    }
};

 
const loginSuperAdmin = async (req, res) => {
    const { ipAddress, requestMethod, deviceInfo } = req.metadata || {};
    const endpoint = req.originalUrl;
    try {
        const { email, password } = req.body;
        const user = await MasterUser.findOne({ email_id: email, isSuperAdmin: 1, status: 1 });

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ status: 401, message: 'Invalid credentials' });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // ✅ Update lastLogin and isLoggedIn in the database
        await MasterUser.updateOne(
            { _id: user._id },
            { refreshToken, lastLogin: new Date(), isLoggedIn: true }
        );
        
 // ✅ Log success activity in one line
 await logUserActivity({ userId: user.userId, activityType: 'LOGIN_SUPERADMIN', activityDetails: 'Successful login', ipAddress, deviceInfo, endpoint, method: requestMethod || req.method, activityStatus: 'success' });

 return res.status(200).json({
     status: 200,
     message: 'Login successful',
     accessToken,
     refreshToken
 });

} catch (error) {
 console.error('❌ Error during login:', error);

 // ✅ Log server error activity in one line
 await logUserActivity({ userId: 'unknown', activityType: 'LOGIN_SUPERADMIN', activityDetails: 'Server error during login', ipAddress: req.metadata?.ipAddress, deviceInfo: req.metadata?.deviceInfo, endpoint: req.originalUrl, method: req.metadata?.requestMethod || req.method, activityStatus: 'failed', errorMessage: error.message }).catch(logErr => console.error('❌ Failed to log error activity:', logErr));

 return res.status(500).json({ status: 500, message: 'Server error', error: error.message });
}
};

const logoutSuperAdmin = async (req, res) => {
    try {
        const { userId } = req.user;
        const { ipAddress, requestMethod, deviceInfo } = req.metadata || {};
        const endpoint = req.originalUrl;

        // ✅ Set refreshToken to null & update isLoggedIn to false in the database
        await MasterUser.updateOne(
            { userId, isSuperAdmin: 1 },
            { $unset: { refreshToken: 1 }, isLoggedIn: false }
        );

        // ✅ Log logout activity in one line
        await logUserActivity({ userId, activityType: 'LOGOUT_SUPERADMIN', activityDetails: 'Super Admin logged out successfully', ipAddress, deviceInfo, endpoint, method: requestMethod || req.method, activityStatus: 'success' });

        return res.status(200).json({ status: 200, message: 'Superadmin Logout successful' });

    } catch (error) {
        console.error('❌ Error during logout:', error);

        // ✅ Log logout error activity in one line
        await logUserActivity({ userId: req.user?.userId || 'unknown', activityType: 'LOGOUT_SUPERADMIN', activityDetails: 'Server error during logout', ipAddress: req.metadata?.ipAddress, deviceInfo: req.metadata?.deviceInfo, endpoint: req.originalUrl, method: req.metadata?.requestMethod || req.method, activityStatus: 'failed', errorMessage: error.message }).catch(logErr => console.error('❌ Failed to log error activity:', logErr));

        return res.status(500).json({ status: 500, message: 'Server error', error: error.message });
    }
};



module.exports = { registerSuperadmin, loginSuperAdmin, logoutSuperAdmin };
