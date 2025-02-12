const Role = require('../models/roleSchema'); // Import the Role model
const { getNextRoleID } = require('../utils/sequenceRoleID'); // Function to get next role ID
const getNextSequenceId = require('../utils/nextSequenceId'); // Function to get next sequence ID
const dotenv = require('dotenv');
const { logUserActivity } = require('../utils/activityLogger'); // Import activity logger

// Load environment variables
dotenv.config();

const listRoles = async (req, res) => {
    if (!req.user) return res.status(401).json({ status: 'error', message: 'Unauthorized: No token or invalid token' });

    const { userId } = req.user.userId, { ipAddress, requestMethod, deviceInfo } = req.metadata || {}, endpoint = req.originalUrl;
    const { page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page, 10), pageSize = parseInt(limit, 10);

    // Validate pagination params
    if (isNaN(pageNumber) || isNaN(pageSize) || pageNumber <= 0 || pageSize <= 0) {
        return res.status(400).json({ status: 'error', message: 'page and limit must be valid positive numbers' });
    }

    try {
        const skip = (pageNumber - 1) * pageSize, totalRecords = await Role.countDocuments({ status: 1 });
        const roles = await Role.find({ status: 1 }).sort({ 'audit.createdAt': -1 }).skip(skip).limit(pageSize).lean();

        if (!roles.length) return res.status(404).json({ status: 'error', message: 'No active roles found', meta: { page: pageNumber, limit: pageSize, totalRecords, totalPages: Math.ceil(totalRecords / pageSize) }, data: [] });

        res.status(200).json({
            status: 'success',
            meta: { page: pageNumber, limit: pageSize, totalRecords, totalPages: Math.ceil(totalRecords / pageSize) },
            data: roles.map(({ roleId, name, description, permissions, audit }) => ({
                roleId, name, description, permissions, audit: { createdAt: audit.createdAt, createdBy: audit.createdBy }, status


            }))
        });

        // Log activity after success
        await logUserActivity({
            userId, activityType: 'GET_ROLES', activityDetails: `Fetched all active roles`, ipAddress, deviceInfo, endpoint, method: requestMethod || req.method, activityStatus: 'success'
        });
    } catch (err) {
        // Log error activity
        await logUserActivity({
            userId, activityType: 'GET_ROLES', activityDetails: 'Error occurred while fetching roles', ipAddress, deviceInfo, endpoint, method: requestMethod || req.method, activityStatus: 'failed', errorMessage: err.message
        });

        res.status(500).json({ status: 'error', message: 'An error occurred while fetching roles', details: err.message });
    }
};


// Get Role by RoleId
const getRoleById = async (req, res) => {
    if (!req.user) return res.status(401).json({ status: 'error', message: 'Unauthorized: No token or invalid token' });

    const { roleId } = req.params, { ipAddress, requestMethod, deviceInfo } = req.metadata || {}, endpoint = req.originalUrl;
    const loggedInUserId = req.user.userId;

    try {
        // Fetch role by roleId with active status
        const role = await Role.findOne({ roleId, status: 1 }, { roleId: 1, name: 1, description: 1, permissions: 1, audit: 1 });

        if (!role) return res.status(404).json({ status: 'error', message: 'Role not found or inactive' });

        res.status(200).json({
            status: 'success',
            data: {
                roleId: role.roleId,
                name: role.name,
                description: role.description,
                permissions: role.permissions,
                audit: { createdAt: role.audit.createdAt, updatedAt: role.audit.updatedAt, createdBy: role.audit.createdBy },
                status: role.status
            }
        });

        // Log activity after successful fetch
        await logUserActivity({
            userId: loggedInUserId, activityType: 'GET_ROLE_BY_ID', activityDetails: `Fetched role with roleId: ${roleId}`, ipAddress, deviceInfo, endpoint, method: requestMethod || req.method, activityStatus: 'success'
        });
    } catch (err) {
        // Log error activity
        await logUserActivity({
            userId: loggedInUserId, activityType: 'GET_ROLE_BY_ID', activityDetails: `Error fetching role with roleId: ${roleId}`, ipAddress, deviceInfo, endpoint, method: requestMethod || req.method, activityStatus: 'failed', errorMessage: err.message
        });

        res.status(500).json({ status: 'error', message: 'An error occurred while fetching role', details: err.message });
    }
};

//   Create Role
const saveRole = async (req, res) => {
    const { roleName, roleType, accessDetails } = req.body;
    const { ipAddress, requestMethod, deviceInfo } = req.metadata || {};
    const endpoint = req.originalUrl;

    try {
        //   Validate roleName: No numbers allowed
        if (!roleName || /\d/.test(roleName)) {
            return res.status(400).json({ status: 'error', message: 'The roleName cannot contain numbers or be empty.' });
        }

        //   Check if a role with the same name already exists
        const existingRole = await Role.findOne({ roleName: roleName.trim(), status: 1 });
        if (existingRole) {
            return res.status(400).json({ status: 'error', message: 'A role with this name already exists.' });
        }

        //   Generate IDs
        const _id = await getNextSequenceId('role'); // Auto-incremented _id
        const roleId = await getNextRoleID(); // Custom roleId (e.g., role-001)

        //   Validate & Format Access Details
        if (!Array.isArray(accessDetails) || accessDetails.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Access details must be a valid array.' });
        }

        const formattedAccessDetails = accessDetails.map(detail => ({
            moduleName: detail.moduleName.trim(),
            permissions: detail.permissions.trim()
        }));

        //   Create New Role Object
        const newRole = new Role({
            _id,
            roleId,
            roleName: roleName.trim(),
            roleType: roleType || 'Team',
            accessDetails: formattedAccessDetails,
            status: 1, // Active by default
            audit: {
                createdAt: new Date(),
                createdBy: req.user?.username || 'system',
            }
        });

        //   Save to DB
        await newRole.save();

        //   Log Activity
        await logUserActivity({
            userId: req.user?.userId || 'unknown',
            activityType: 'CREATE_ROLE',
            activityDetails: `Created new role: ${roleName}`,
            ipAddress,
            deviceInfo,
            endpoint,
            method: requestMethod || req.method,
            activityStatus: 'success',
        });

        //   Send Response
        return res.status(201).json({
            status: 'success',
            message: 'Role created successfully',
            data: { roleId: newRole.roleId },
        });

    } catch (err) {
        //   Log Error
        await logUserActivity({
            userId: req.user?.userId || 'unknown',
            activityType: 'CREATE_ROLE',
            activityDetails: `Error while creating role: ${roleName}`,
            ipAddress,
            deviceInfo,
            endpoint,
            method: requestMethod || req.method,
            activityStatus: 'failed',
            errorMessage: err.message,
        });

        return res.status(500).json({
            status: 'error',
            message: 'An error occurred while saving the role',
            details: err.message,
        });
    }
};


const updateRole = async (req, res) => {
    if (!req.user) return res.status(401).json({ status: 'error', message: 'Unauthorized: No token or invalid token' });
    const { ipAddress, requestMethod, deviceInfo } = req.metadata || {};
    const endpoint = req.originalUrl;
    const { roleId } = req.params;
    const { userId } = req.user.userId;
    const { name: roleName, description, permissions } = req.body;

    // Validation checks
    if (!roleName || !description || !permissions || !Array.isArray(permissions) || permissions.length === 0) {
        return res.status(400).json({
            status: 'error',
            message: 'roleName, description, and permissions are mandatory fields. Permissions should be an array containing at least one object.',
        });
    }

    // Ensure roleName does not contain any numbers
    if (/\d/.test(roleName)) {
        return res.status(400).json({
            status: 'error',
            message: 'roleName cannot contain any numbers',
        });
    }

    try {
        // First, check if the role with the given ID exists and has status 1
        const role = await Role.findOne({ roleId, status: 1 });

        if (!role) {
            // If the role does not exist
            return res.status(404).json({ status: 'error', message: 'Role with the given ID does not exist' });
        }

        // Update the role
        role.name = roleName;
        role.description = description;
        role.permissions = permissions;
        role.audit.updatedAt = new Date();
        role.audit.updatedBy = req.validRoleName || 'system';
        await role.save();

        // Log activity after success
        await logUserActivity({
            userId, activityType: 'UPDATE_ROLE', activityDetails: `Updated role with roleId: ${roleId}`, ipAddress, deviceInfo, endpoint, method: requestMethod || req.method,
            activityStatus: 'success',
        });

        return res.status(200).json({ status: 'success', message: 'Role updated successfully' });
    } catch (err) {
        // Log error activity    
        await logUserActivity({
            userId, activityType: 'UPDATE_ROLE', activityDetails: `Error occurred while updating role with roleId: ${roleId}`, ipAddress, deviceInfo, endpoint, method: requestMethod || req.method,
            activityStatus: 'failed',
            errorMessage: err.message,
        });

        res.status(500).json({ status: 'error', message: 'An error occurred while updating the role', details: err.message });

    }
};



// Soft Delete Role by setting status to 0
const deleteRole = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            status: 'error',
            message: 'Unauthorized: No token or invalid token',
        });
    }
    const { ipAddress, requestMethod, deviceInfo } = req.metadata || {};
    const endpoint = req.originalUrl;
    const userId = req.user.userId;


    const { roleId } = req.params;

    try {
        // First, check if the role with the given ID exists and has status 1
        const role = await Role.findOne({ roleId, status: 1 });

        if (!role) {
            // If the role does not exist
            return res.status(404).json({ status: 'error', message: 'Role with the given ID does not exist' });
        }

        if (role.status === 0) {
            // If the role is already inactive
            return res.status(400).json({ status: 'error', message: 'Role is already inactive' });
        }

        // If the role exists and is active, perform a soft delete (set status to 0)
        role.status = 0;
        await role.save();
        // Log activity after success
        await logUserActivity({
            userId, activityType: 'DELETE_ROLE', activityDetails: `deleted new role: ${roleName}`, ipAddress, deviceInfo, endpoint, method: requestMethod || req.method, activityStatus: 'success',
        });
        res.json({ status: 'success', message: 'Role  deleted successfully' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'An error occurred while deleting the role' });
    }
};


module.exports = {
    listRoles,
    saveRole,
    deleteRole,
    getRoleById,
    updateRole
};
