const jwt = require('jsonwebtoken');
const MasterUser = require('../models/masterUserSchema');
const { generateAccessToken } = require('../utils/tokenUtils');

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict'
};

const refreshAccessToken = async (req, res, internalCall) => {  // ❌ Remove default `false`
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            console.log("❌ No refresh token, session expired.");
            return internalCall ? null : res.status(401).json({ status: 401, message: 'Session expired, please log in again' });
        }

        let refreshDecoded;
        try {
            refreshDecoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        } catch (error) {
            console.log("❌ Invalid refresh token, forcing logout.");
            return internalCall ? null : res.status(401).json({ status: 401, message: 'Session expired, please log in again' });
        }

        // 🔍 Find user in DB
        const user = await MasterUser.findOne({ userId: refreshDecoded.userId, refreshToken, status: 1 }).lean();

        if (!user) {
            console.log("❌ Refresh token mismatch, forcing logout.");
            return internalCall ? null : res.status(403).json({ status: 403, message: 'Invalid refresh token, please log in again' });
        }

        // ✅ Generate New Access Token
        const newAccessToken = generateAccessToken(user);

        // 🍪 Set new Access Token Cookie
        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 30 * 60 * 1000  // 30 minutes
        });

        console.log("✅ New access token generated:", newAccessToken);

        return internalCall ? { status: 200, newAccessToken } : res.status(200).json({ status: 200, message: 'Access token refreshed successfully' });

    } catch (error) {
        return res.status(500).json({ status: 500, message: 'Server Error while refreshing token' });
    }
};


module.exports = { refreshAccessToken };
