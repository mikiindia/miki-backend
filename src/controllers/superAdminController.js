const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const MasterUser = require('../models/masterUserSchema');
const { generateAccessToken, generateRefreshToken } = require('../utils/tokenUtils');

dotenv.config();

// // Secure Cookie Options
// const cookieOptions = {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//     sameSite: 'Strict',
//     maxAge: 30 * 60 * 1000 // 30 minutes
// };


const loginSuperAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await MasterUser.findOne({ email, roleId: 'superadmin', status: 1 });

        if (!user || !(await bcrypt.compare(password, user.password))) {
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
            sameSite: 'Strict' 
        });

        res.cookie('refreshToken', refreshToken, { 
            httpOnly: true, 
            secure: process.env.COOKIE_SECURE === 'true',
            sameSite: 'Strict' 
        });

        res.json({ message: 'Login successful', accessToken });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const logoutSuperAdmin = async (req, res) => {
    try {
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');

        res.json({ message: 'Logout successful' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { loginSuperadmin, logoutSuperadmin };
