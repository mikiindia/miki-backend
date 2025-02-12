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

        // Fetch user from database
        const user = await MasterUser.findOne({ 
            userId: decoded.userId, 
            roleId: decoded.roleId, 
            status: 1 
        }).lean();

        if (!user) {
            return res.status(403).json({ status: 403, message: 'Access Denied: User not active or role mismatch' });
        }

        // Attach user details to the request object
        req.user = decoded;

        // Send response with userId and roleId before calling next middleware
        res.status(200).json({ 
            status: 200, 
            message: 'User authenticated successfully', 
            userId: decoded.userId, 
            roleId: decoded.roleId 
        });

        next(); // Proceed to the next middleware
    } catch (error) {
        return res.status(500).json({ status: 500, message: 'Server Error during authentication' });
    }
};

module.exports = authMiddleware;
