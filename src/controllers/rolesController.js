const Role = require('../models/roleSchema'); // Import the Role model
const { getNextRoleID } = require('../utils/sequenceRoleID'); // Function to get next role ID
const getNextSequenceId = require('../utils/nextSequenceId'); // Function to get next sequence ID
const dotenv = require('dotenv');
const logUserActivity = require('../utils/activityLogger'); // ✅ Ensure correct import
const ModuleName = require('../models/moduleNameSchema'); // Module model

// Load environment variables
dotenv.config();
const listRoles = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ status: 401, message: 'Unauthorized: No token or invalid token' });
    }

    const { userId } = req.user;
    const { ipAddress, requestMethod, deviceInfo } = req.metadata || {};
    const endpoint = req.originalUrl;
    const { page = 1, limit = 10 } = req.query;

    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);

    if (isNaN(pageNumber) || isNaN(pageSize) || pageNumber <= 0 || pageSize <= 0) {
        return res.status(400).json({ status: 400, message: 'page and limit must be valid positive numbers' });
    }

    try {
        const skip = (pageNumber - 1) * pageSize;
        const totalRecords = await Role.countDocuments({ status: 1 });
        const roles = await Role.find({ status: 1 }).sort({ 'audit.createdAt': -1 }).skip(skip).limit(pageSize).lean();

        if (!roles.length) {
            return res.status(404).json({ status: 404, message: 'No active roles found', meta: { page: pageNumber, limit: pageSize, totalRecords, totalPages: Math.ceil(totalRecords / pageSize) }, data: [] });
        }

        res.status(200).json({ status: 200, meta: { page: pageNumber, limit: pageSize, totalRecords, totalPages: Math.ceil(totalRecords / pageSize) }, data: roles });

        await logUserActivity({ userId, activityType: 'GET_ROLES', activityDetails: 'Fetched all active roles', ipAddress, deviceInfo, endpoint, method: requestMethod || req.method, activityStatus: 'success' });
    }  catch (err) {
        await logUserActivity({ userId, activityType: 'GET_ROLES', activityDetails: 'Error fetching roles', ipAddress, deviceInfo, endpoint, method: requestMethod || req.method, activityStatus: 'failed', errorMessage: err.message });

        res.status(500).json({ status: 500, message: 'An error occurred while fetching roles', details: err.message });
    }
};

const getRoleById = async (req, res) => {
    if (!req.user) return res.status(401).json({ status: 401, message: 'Unauthorized: No token or invalid token' });

    const { roleId } = req.body;
    const { ipAddress, requestMethod, deviceInfo } = req.metadata || {};
    const endpoint = req.originalUrl;
    const loggedInUserId = req.user.userId;

    if (!roleId) {
        return res.status(400).json({ status: 400, message: 'roleId is required' });
    }

    try {
        const role = await Role.findOne({ roleId, status: 1 }).lean();
        if (!role) return res.status(404).json({ status: 404, message: 'Role not found or inactive' });

        res.status(200).json({ status: 200, data: role });

        await logUserActivity({ userId: loggedInUserId, activityType: 'GET_ROLE', activityDetails: `Fetched role ${roleId}`, ipAddress, deviceInfo, endpoint, method: requestMethod || req.method, activityStatus: 'success' });
    } catch (err) {
        await logUserActivity({ userId: loggedInUserId, activityType: 'GET_ROLE', activityDetails: `Error fetching role ${roleId}`, ipAddress, deviceInfo, endpoint, method: requestMethod || req.method, activityStatus: 'failed', errorMessage: err.message });

        res.status(500).json({ status: 500, message: 'An error occurred while fetching role', details: err.message });
    }
};

const saveRole = async (req, res) => {
    const { roleName, roleType, permissions } = req.body;
    const { ipAddress, requestMethod, deviceInfo } = req.metadata || {};
    const endpoint = req.originalUrl;

    if (!roleName || !roleType || !permissions || !Array.isArray(permissions) || permissions.length === 0) {
        return res.status(400).json({ status: 400, message: 'roleName, roleType, and permissions are required' });
    }

    try {
        if (!/^[A-Z\s]+$/.test(roleName)) {
            return res.status(400).json({ status: 400, message: 'roleName must contain only uppercase letters and no numbers.' });
        }

        const existingRole = await Role.findOne({ roleName: roleName.trim(), status: 1 });
        if (existingRole) {
            return res.status(400).json({ status: 400, message: 'A role with this name already exists.' });
        }

        const moduleIds = permissions.map(detail => detail.moduleId);
        const validModules = await ModuleName.find({ moduleId: { $in: moduleIds }, status: 1 }, { moduleId: 1 }).lean();
        const validModuleIds = validModules.map(module => module.moduleId);
        const invalidModuleIds = moduleIds.filter(id => !validModuleIds.includes(id));

        if (invalidModuleIds.length > 0) return res.status(400).json({ status: 400, message: `Invalid moduleId(s): ${invalidModuleIds.join(', ')}` });

        const _id = await getNextSequenceId('role');
        const roleId = await getNextRoleID();

        await new Role({ _id, roleId, roleName: roleName.trim(), roleType: roleType || 'Team', permissions, status: 1, audit: { createdAt: new Date(), createdBy: req.user?.userId || 'system' } }).save();

        await logUserActivity({ userId: req.user?.userId || 'unknown', activityType: 'CREATE_ROLE', activityDetails: `Created role: ${roleName}`, ipAddress, deviceInfo, endpoint, method: requestMethod || req.method, activityStatus: 'success' });

        return res.status(201).json({ status: 201, message: 'Role created successfully', data: { roleId } });

    } catch (err) {
        await logUserActivity({ userId: req.user?.userId || 'unknown', activityType: 'CREATE_ROLE', activityDetails: `Error creating role: ${roleName}`, ipAddress, deviceInfo, endpoint, method: requestMethod || req.method, activityStatus: 'failed', errorMessage: err.message });

        return res.status(500).json({ status: 500, message: 'An error occurred while saving the role', details: err.message });
    }
};

const updateRole = async (req, res) => {
    if (!req.user) return res.status(401).json({ status: 401, message: 'Unauthorized: No token or invalid token' });

    const { roleId, roleName,   permissions } = req.body;
    const { ipAddress, requestMethod, deviceInfo } = req.metadata || {};
    const endpoint = req.originalUrl;
    const userId = req.user.userId;

    if (!roleId || !roleName   || !permissions || !Array.isArray(permissions)) {
        return res.status(400).json({ status: 400, message: 'roleId, roleName  and permissions are required' });
    }

    try {
        const role = await Role.findOne({ roleId, status: 1 });
        if (!role) return res.status(404).json({ status: 404, message: 'Role not found or inactive' });

        if (!/^[A-Z\s]+$/.test(roleName)) {
            return res.status(400).json({ status: 400, message: 'roleName must contain only uppercase letters and no numbers.' });
        }
        // 🔹 Check if roleName already exists (excluding the current roleId)
        const existingRole = await Role.findOne({ roleName: roleName.trim(), status: 1, roleId: { $ne: roleId } });
        if (existingRole) {
            return res.status(400).json({ status: 400, message: 'A role with this name already exists.' });
        }


             // Extract all moduleIds from accessDetails
             const moduleIds = permissions.map(detail => detail.moduleId);

             // Fetch modules with the provided IDs that are active
             const validModules = await ModuleName.find({ moduleId: { $in: moduleIds }, status: 1 }, { moduleId: 1 }).lean();
             const validModuleIds = validModules.map(module => module.moduleId);
     
             // Check for any invalid moduleId
             const invalidModuleIds = moduleIds.filter(id => !validModuleIds.includes(id));
             if (invalidModuleIds.length > 0) {
                 return res.status(400).json({ 
                     status: 400, 
                     message: `Invalid moduleId(s): ${invalidModuleIds.join(', ')}` 
                 });
             }

        role.roleName = roleName.trim();
        role.permissions = permissions;
        role.audit.updatedAt = new Date();
        role.audit.updatedBy = req.user?.userId || 'system';

        await role.save();

        await logUserActivity({
            userId,
            activityType: 'UPDATE_ROLE',
            activityDetails: `Updated role ${roleId}`,
            ipAddress,
            deviceInfo,
            endpoint,
            method: requestMethod || req.method,
            activityStatus: 'success'
        });

        res.status(200).json({ status: 200, message: 'Role updated successfully', data: role });

    } catch (err) {
        await logUserActivity({
            userId,
            activityType: 'UPDATE_ROLE',
            activityDetails: `Error updating role ${roleId}`,
            ipAddress,
            deviceInfo,
            endpoint,
            method: requestMethod || req.method,
            activityStatus: 'failed',
            errorMessage: err.message
        });

        res.status(500).json({ status: 500, message: 'An error occurred while updating the role', details: err.message });
    }
};

 

const deleteRole = async (req, res) => {
    if (!req.user) return res.status(401).json({ status: 401, message: 'Unauthorized: No token or invalid token' });

    const { roleId } = req.body;
    const { ipAddress, requestMethod, deviceInfo } = req.metadata || {};
    const endpoint = req.originalUrl;
    const userId = req.user.userId;

    if (!roleId) {
        return res.status(400).json({ status: 400, message: 'roleId is required' });
    }
    try {
        const role = await Role.findOne({ roleId, status: 1 });
        if (!role) return res.status(404).json({ status: 404, message: 'Role not found' });

        if (role.status === 0) {
            return res.status(400).json({ status: 400, message: 'Role is already inactive' });
        }

        role.status = 0;
        await role.save();

        await logUserActivity({ userId, activityType: 'DELETE_ROLE', activityDetails: `Deleted role ${roleId}`, ipAddress, deviceInfo, endpoint, method: requestMethod || req.method, activityStatus: 'success' });

        res.json({ status: 200, message: 'Role deleted successfully' });
    } catch (err) {
        res.status(500).json({ status: 500, message: 'An error occurred while deleting the role', details: err.message });
    }
};

module.exports = { listRoles, saveRole, deleteRole, getRoleById, updateRole };