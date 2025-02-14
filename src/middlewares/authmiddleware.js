const jwt = require('jsonwebtoken');
const { refreshAccessToken } = require('../controllers/authController');

 

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
             
            userId: decoded.userId || null,
            roleId: decoded.roleId,
            tenantId: decoded.tenant_ID  
        };

        next(); // Proceed to the next middleware ✅

    } catch (error) {
        return res.status(500).json({ status: 500, message: 'Server Error during authentication' });
    }
};

module.exports = authMiddleware;
