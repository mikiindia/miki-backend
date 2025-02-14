// authController.js
const jwt = require('jsonwebtoken');
const MasterUser = require('../models/masterUserSchema');
const { generateAccessToken } = require('../utils/tokenUtils');

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict'
};

const refreshAccessToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        // ❌ If refresh token is missing → Expired session
        if (!refreshToken) {
            return res.clearCookie('accessToken')
                .clearCookie('refreshToken')
                .status(401)
                .json({ status: 401, message: 'Session expired, please log in again' });
        }

        let refreshDecoded;
        try {
            refreshDecoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        } catch (error) {
            // ❌ If refresh token is invalid or expired → Force logout
            return res.clearCookie('accessToken')
                .clearCookie('refreshToken')
                .status(401)
                .json({ status: 401, message: 'Session expired, please log in again' });
        }

        // 🔍 Find user in DB (checking all possible ID fields)
        const user = await MasterUser.findOne({ userId: refreshDecoded.userId,  refreshToken, status: 1 }).lean();

        // ❌ If user is not found or token mismatch → Expire session
        if (!user) {
            return res.clearCookie('accessToken')
                .clearCookie('refreshToken')
                .status(403)
                .json({ status: 403, message: 'Invalid refresh token, please log in again' });
        }

        // ✅ Generate New Access Token
        const newAccessToken = generateAccessToken(user);

        // 🍪 Set new Access Token Cookie
        res.cookie('accessToken', newAccessToken, {
            ...cookieOptions,
            maxAge: 30 * 60 * 1000  // 30 minutes
        });

        return res.status(200).json({ status: 200, message: 'Access token refreshed successfully' });

    } catch (error) {
        return res.status(500).json({ status: 500, message: 'Server Error while refreshing token' });
    }
};

module.exports = { refreshAccessToken };
