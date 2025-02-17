const jwt = require('jsonwebtoken');

const generateAccessToken = (user) => {
    return jwt.sign(
        { userId: user.userId, roleId: user.roleId, phoneNumber: user.phoneNumber, tenantId: user.tenant_ID },
        process.env.JWT_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' }  // Uses .env value
    );
};

const generateRefreshToken = (user) => {
    return jwt.sign(
        { userId: user.userId, roleId: user.roleId, tenantId: user.tenant_ID },
        process.env.JWT_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '15d' }  // Uses .env value
    );
};

module.exports = { generateAccessToken, generateRefreshToken };
