const jwt = require('jsonwebtoken');
const MasterUser = require('../models/masterUserSchema');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.accessToken;
        if (!token) {
            return res.status(401).json({ status: 401, message: 'Unauthorized: No token provided' });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return res.status(401).json({ status: 401, message: 'Invalid or Expired Token' });
        }

        // Fetch user from database (checking multiple possible IDs with roleId)
        const user = await MasterUser.findOne({
            $or: [
                { supId: decoded.supId, roleId: decoded.roleId, status: 1 },
                { tenantId: decoded.tenantId, roleId: decoded.roleId, status: 1 },
                { bdmId: decoded.bdmId, roleId: decoded.roleId, status: 1 },
                { userId: decoded.userId, roleId: decoded.roleId, status: 1 }
            ]
        }).lean();

        if (!user) {
            return res.status(403).json({ status: 403, message: 'Access Denied: User not active or role mismatch' });
        }

        // Attach user details to the request object
        req.user = {
            supId: decoded.supId || null,
            tenantId: decoded.tenantId || null,
            bdmId: decoded.bdmId || null,
            userId: decoded.userId || null,
            roleId: decoded.roleId
        };

        next(); // ✅ Proceed to the next middleware
    } catch (error) {
        return res.status(500).json({ status: 500, message: 'Server Error during authentication' });
    }
};

module.exports = authMiddleware;
