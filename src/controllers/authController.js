const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const MasterUser = require('../models/masterUserSchema');
const { generateAccessToken } = require('../utils/tokenUtils');
dotenv.config();

// Secure Cookie Options
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict'
};

const refreshAccessToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ message: 'Unauthorized: No refresh token provided' });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        const user = await MasterUser.findOne({ userId: decoded.userId, refreshToken, roleId: decoded.roleId, status: 1 }).lean();

        if (!user) {
            return res.status(403).json({ message: 'Invalid or expired refresh token' });
        }

        // Generate new Access Token
        const newAccessToken = generateAccessToken(user);

        // Set the cookie with centralized options
        res.cookie('accessToken', newAccessToken, { 
            ...cookieOptions, 
            maxAge: 30 * 60 * 1000  // Explicitly setting maxAge for accessToken (30 min)
        });

        res.json({ message: 'Token refreshed', accessToken: newAccessToken });
    } catch (error) {
        return res.status(401).json({ message: 'Invalid refresh token' });
    }
};

module.exports = { refreshAccessToken };
