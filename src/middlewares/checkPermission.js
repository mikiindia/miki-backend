const Role = require('../models/roleSchema');

// Define permission actions
const PERMISSIONS = {
    ADD: 'add',
    VIEW: 'view',
    EDIT: 'edit',
    DELETE: 'delete',
    ALL: 'all'  // Represents full permissions
};
const checkPermission = async (req, res, next) => {
    try {
        if (!req.user || !req.user.roleId) {
            console.log("❌ Access Denied: User role not found");
            return res.status(403).json({ status: 403, message: 'Access Denied: User role not found' });
        }

        const { roleId } = req.user;
        const requestedRoute = req.originalUrl.split('?')[0]; // Remove query params
        const method = req.method.toLowerCase(); // Normalize HTTP method

        // Extract module name from route (Assumes /api/module-name/...)
        const moduleName = requestedRoute.split('/')[2]?.toUpperCase();
        if (!moduleName) {
            console.log("❌ Access Denied: Invalid module name extracted from route:", requestedRoute);
            return res.status(403).json({ status: 403, message: 'Access Denied: Invalid module name' });
        }

        console.log(`🔍 Checking permissions for Role ID: ${roleId} | Module: ${moduleName} | Method: ${method}`);

        // Fetch Role & Permissions from DB
        const role = await Role.findOne({ roleId, status: 1 }).lean();
        if (!role) {
            console.log("❌ Access Denied: Role not found in DB");
            return res.status(403).json({ status: 403, message: 'Access Denied: Invalid role' });
        }

        console.log("✅ User Role Found:", role);

        // Determine required permission based on HTTP method
        let requiredPermission;
        switch (method) {
            case 'get':
                requiredPermission = PERMISSIONS.VIEW;
                break;
            case 'post':
                requiredPermission = PERMISSIONS.ADD;
                break;
            case 'put':
            case 'patch':
                requiredPermission = PERMISSIONS.EDIT;
                break;
            case 'delete':
                requiredPermission = PERMISSIONS.DELETE;
                break;
            default:
                console.log("❌ Access Denied: Unknown action", method);
                return res.status(403).json({ status: 403, message: 'Access Denied: Unknown action' });
        }

        console.log(`🛠️ Required Permission: ${requiredPermission}`);

        // 🔹 First Check: Does user have `ALL_MODULE` permission with `ALL`?
        const hasAllAccess = role.permissions.some(perm => {
            console.log("🔎 Checking Global Permission:", perm);
            return perm.moduleName === 'ALL_MODULE' &&
                   perm.accessType === PERMISSIONS.ALL &&
                   perm.canAccess === 1;
        });

        if (hasAllAccess) {
            console.log("✅ Global Access Granted (ALL_MODULE with ALL access)");
            return next();
        }

        // 🔹 Second Check: Does user have permission for the specific module?
        const hasPermission = role.permissions.some(perm => {
            console.log("🔎 Checking Module Permission:", perm);
            return (perm.moduleName === moduleName) &&
                   (perm.accessType === requiredPermission || perm.accessType === PERMISSIONS.ALL) &&
                   perm.canAccess === 1;
        });

        if (!hasPermission) {
            console.log(`❌ Access Denied: No matching permission found for ${moduleName}`);
            return res.status(403).json({ status: 403, message: 'Access Denied: Permission denied' });
        }

        console.log("✅ Access Granted");
        next();
    } catch (error) {
        console.error('❌ Permission Check Error:', error);
        return res.status(500).json({ status: 500, message: 'Internal Server Error during permission check' });
    }
};


module.exports = { checkPermission, PERMISSIONS };
