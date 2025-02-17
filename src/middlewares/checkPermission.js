const Role = require('../models/roleSchema');
const ModuleName = require('../models/moduleNameSchema'); // Assuming this is your model for the moduleName

// Define permission actions
const PERMISSIONS = {
    ADD: 'add',
    VIEW: 'view',
    EDIT: 'edit',
    DELETE: 'delete',
    ALL: 'all'  // Represents full permissions
};
const checkPermission = (moduleNames, requiredPermissions) => {
    return async (req, res, next) => {
        try {
            console.log("🔹 Received req.user:", req.user);

            if (!req.user || !req.user.roleId) {
                console.log("❌ Access Denied: User role not found");
                return res.status(403).json({ status: 403, message: 'Access Denied: User role not found' });
            }

            const { roleId } = req.user;
            const requestedRoute = req.originalUrl.split('?')[0]; // Remove query params
            const method = req.method.toLowerCase(); // Normalize HTTP method

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

            // Fetch Role from DB
            const role = await Role.findOne({ roleId, status: 1 }).lean();
            console.log("🔎 DB Role Query Result:", role);

            if (!role) {
                console.log("❌ Access Denied: Role not found in DB");
                return res.status(403).json({ status: 403, message: 'Access Denied: Invalid role' });
            }

            console.log("✅ User Role Found:", role);

            // Extract all moduleIds from role permissions and normalize to lower case
            const roleModuleIds = role.permissions.map(perm => perm.moduleId.toLowerCase());
            console.log("🔍 Role's Accessible Modules:", roleModuleIds);

            // Fetch the module names from ModuleName model based on role's accessible moduleIds
            const activeModules = await ModuleName.find({ moduleId: { $in: roleModuleIds }, status: 1 }).lean();
            console.log("🔍 Active Modules Found:", activeModules);

            if (activeModules.length === 0) {
                console.log(`❌ Access Denied: No active modules found for user role ${roleId}`);
                return res.status(403).json({ status: 403, message: 'Access Denied: No active modules found for user' });
            }

            // Get moduleName(s) from the route (defined by you as 'MODULES' in the route)
            console.log(`🔍 Route's Module Names: ${moduleNames.join(', ')}`);

            // Find the corresponding moduleName in the activeModules
            const matchingModule = activeModules.find(module => moduleNames.includes(module.moduleName.toUpperCase()));

            if (!matchingModule) {
                console.log(`❌ Access Denied: No matching active module found for ${moduleNames}`);
                return res.status(403).json({ status: 403, message: 'Access Denied: Module not found or inactive' });
            }

            console.log("✅ Matching Module Found:", matchingModule);

            // Now, check if the role has permission for the specific moduleId
            const rolePermission = role.permissions.find(perm => perm.moduleId.toLowerCase() === matchingModule.moduleId.toLowerCase());

            if (!rolePermission) {
                console.log("❌ Access Denied: No permission found for moduleId", matchingModule.moduleId);
                return res.status(403).json({ status: 403, message: 'Access Denied: Permission denied' });
            }

            // If accessType is 'all', simply check if canAccess is 1
            if (rolePermission.accessType === PERMISSIONS.ALL) {
                if (rolePermission.canAccess === 1) {
                    console.log("✅ Access Granted: 'ALL' permission");
                    return next();
                } else {
                    console.log("❌ Access Denied: CanAccess is 0 for 'ALL' permission");
                    return res.status(403).json({ status: 403, message: 'Access Denied: CanAccess is 0 for this module' });
                }
            }

            // For non-'all' permissions, check if the requiredPermission matches
            if (rolePermission.accessType === requiredPermission && rolePermission.canAccess === 1) {
                console.log("✅ Access Granted: Specific permission matched");
                return next();
            } else {
                console.log("❌ Access Denied: Insufficient permission or canAccess is 0");
                return res.status(403).json({ status: 403, message: 'Access Denied: Permission denied' });
            }
        } catch (error) {
            console.error('❌ Permission Check Error:', error);
            return res.status(500).json({ status: 500, message: 'Internal Server Error during permission check' });
        }
    };
};



module.exports = { checkPermission, PERMISSIONS };
