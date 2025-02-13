const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const MasterUser = require('../models/masterUserSchema');
const { generateAccessToken, generateRefreshToken } = require('../utils/tokenUtils');
const { body, validationResult } = require('express-validator');
dotenv.config();
const Role = require('../models/Role');
const bcrypt = require('bcrypt');
const SuperAdmin = require('../models/superAdminSchema');
const { getNextSupID } = require('../utils/sequenceSupID'); // Function to get next role ID
const getNextSequenceId = require('../utils/nextSequenceId');
 
 

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
        const existingSuperadmin = await SuperAdmin.findOne({ email_id });
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
    try {
        const { email, password } = req.body;
        const user = await MasterUser.findOne({ email_id: email, isSuperAdmin: 1, status: 1 });

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate Tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Save refresh token in DB (optional)
        await MasterUser.updateOne({ _id: user._id }, { refreshToken });

        // Set Cookies
        res.cookie('accessToken', accessToken, { 
            httpOnly: true, 
            secure: process.env.COOKIE_SECURE === 'true',
            sameSite: 'Strict' ,
            maxAge: 30 * 60 * 1000 // 30 minutes in milliseconds
        });

        res.cookie('refreshToken', refreshToken, { 
            httpOnly: true, 
            secure: process.env.COOKIE_SECURE === 'true',
            sameSite: 'Strict' ,
            maxAge: 15 * 24 * 60 * 60 * 1000 // 15 days in milliseconds
        });

        res.status(200).json({status: 200,  message: 'Login successful', accessToken });
    } catch (error) {
        res.status(500).json({ status: 500, message: 'Server error', error: error.message });
    }
};

const logoutSuperAdmin = async (req, res) => {
    try {
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');

        res.json({ status: 200, message: 'Logout successful' });
    } catch (error) {
        res.status(500).json({status: 500,  message: 'Server error', error: error.message });
    }
};

module.exports = { registerSuperadmin, loginSuperAdmin, logoutSuperAdmin };
