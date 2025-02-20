const jwt = require('jsonwebtoken');
const MasterUser = require('../models/masterUserSchema');
const { generateAccessToken } = require('../utils/tokenUtils');

const refreshAccessToken = async (req, res, internalCall) => {  
    try {
        const refreshToken = req.headers['x-refresh-token']; // Get Refresh Token from header

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

        const user = await MasterUser.findOne({ userId: refreshDecoded.userId, refreshToken, status: 1 }).lean();

        if (!user) {
            console.log("❌ Refresh token mismatch, forcing logout.");
            return internalCall ? null : res.status(403).json({ status: 403, message: 'Invalid refresh token, please log in again' });
        }

        const newAccessToken = generateAccessToken(user);

        console.log("✅ New access token generated:", newAccessToken);

        return internalCall ? { status: 200, newAccessToken } : res.status(200).json({ status: 200, message: 'Access token refreshed successfully', accessToken: newAccessToken });

    } catch (error) {
        return res.status(500).json({ status: 500, message: 'Server Error while refreshing token' });
    }
};

module.exports = { refreshAccessToken };
