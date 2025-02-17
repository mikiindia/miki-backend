const jwt = require('jsonwebtoken');
const { refreshAccessToken } = require('../controllers/authController');

const authMiddleware = async (req, res, next) => {
    try {
        let token = req.cookies.accessToken;

        // If no access token is found, try to refresh
        if (!token) {
            console.log("⚠️ No access token found, attempting refresh...");
            const refreshResult = await refreshAccessToken(req, res, true);  // ✅ Always pass `true`

            if (refreshResult && refreshResult.status === 200) {
                console.log("✅ Token refreshed successfully in middleware.");
                req.cookies.accessToken = refreshResult.newAccessToken; // Attach new token to request
                return authMiddleware(req, res, next);  // 🔄 Retry the original request
            }

            console.log("❌ Token refresh failed, sending unauthorized response.");
            return res.status(401).json({ status: 401, message: 'Unauthorized: No token provided' });
        }

        let decoded;
        try {
            // ✅ Verify Access Token
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                console.log("⚠️ Access token expired, trying to refresh...");
                const refreshResult = await refreshAccessToken(req, res, true);  // ✅ Always pass `true`

                if (refreshResult && refreshResult.status === 200) {
                    console.log("✅ Token refreshed successfully.");
                    req.cookies.accessToken = refreshResult.newAccessToken; // Attach new token
                    return authMiddleware(req, res, next);  // 🔄 Retry the original request
                }

                console.log("❌ Token refresh failed, forcing logout.");
                return res.status(401).json({ status: 401, message: 'Access token expired, and failed to refresh token. Please log in again.' });
            } else {
                return res.status(401).json({ status: 401, message: 'Invalid or Expired Token' });
            }
        }

        // ✅ Attach user details to `req.user`
        req.user = {
            userId: decoded.userId || null,
            roleId: decoded.roleId,
            tenantId: decoded.tenantId
        };
        console.log("🔍 User Object from Auth Middleware:", req.user);

        next(); // Proceed to the next middleware ✅

    } catch (error) {
        return res.status(500).json({ status: 500, message: 'Server Error during authentication', details: error.message });
    }
};


module.exports = authMiddleware;
