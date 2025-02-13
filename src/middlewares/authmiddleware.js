const jwt = require('jsonwebtoken');
const { refreshAccessToken } = require('../controllers/authController');

// Secure Cookie Options
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict'
};

const authMiddleware = async (req, res, next) => {
    try {
        let token = req.cookies.accessToken;

        // ❌ If no access token found, return Unauthorized
        if (!token) {
            return res.status(401).json({ status: 401, message: 'Unauthorized: No token provided' });
        }

        let decoded;
        try {
            // ✅ Verify Access Token
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            // 🔄 If access token is expired, call refreshAccessToken
            if (error.name === 'TokenExpiredError') {
                return refreshAccessToken(req, res); // Call the function directly
            } else {
                return res.status(401).json({ status: 401, message: 'Invalid or Expired Token' });
            }
        }

        // ✅ Attach user details to `req.user`
        req.user = {
            supId: decoded.supId || null,
            tenantId: decoded.tenantId || null,
            bdmId: decoded.bdmId || null,
            userId: decoded.userId || null,
            roleId: decoded.roleId
        };

        next(); // Proceed to the next middleware ✅

    } catch (error) {
        return res.status(500).json({ status: 500, message: 'Server Error during authentication' });
    }
};

module.exports = authMiddleware;
