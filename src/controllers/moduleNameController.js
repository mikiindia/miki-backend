const validator = require('validator');const ModuleName = require('../models/moduleNameSchema'); // Module model
const { getNextSequenceId } = require('../utils/nextSequenceId'); // Auto-increment helper
const { logUserActivity } = require('../utils/activityLogger'); // Logging utility
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

 /**
 * ✅ Create a New Module
 */
const saveModule = async (req, res) => {
    const { moduleName, description } = req.body;
    const { ipAddress, requestMethod, deviceInfo } = req.metadata || {}, endpoint = req.originalUrl;

    try {
        // ✅ Validate moduleName: Only letters, underscore, and hyphen allowed
        if (!/^[A-Za-z_-]+$/.test(moduleName.trim())) {
            return res.status(400).json({ status: 'error', message: 'Module name can only contain letters, underscores (_), and hyphens (-).' });
        }

        // ✅ Check if module already exists
        const existingModule = await ModuleName.findOne({ moduleName: moduleName.trim(), status: 1 });
        if (existingModule) {
            return res.status(400).json({ status: 'error', message: 'A module with this name already exists.' });
        }

        const _id = await getNextSequenceId('module');

        // ✅ Save new module
        const newModule = new ModuleName({
            _id,
            moduleName: moduleName.trim(),
            description: description || '',
            status: 1,
            audit: { createdAt: new Date(), createdBy: req.user?.username || 'system' }
        });

        await newModule.save();

        // ✅ Log success activity
        await logUserActivity({
            userId: req.user?.userId || 'unknown',
            activityType: 'CREATE_MODULE',
            activityDetails: `Created new module: ${moduleName}`,
            ipAddress,
            deviceInfo,
            endpoint,
            method: requestMethod || req.method,
            activityStatus: 'success'
        });

        return res.status(201).json({ status: 'success', message: 'Module created successfully', data: { moduleName: newModule.moduleName } });

    } catch (err) {
        // ✅ Log failure activity
        await logUserActivity({
            userId: req.user?.userId || 'unknown',
            activityType: 'CREATE_MODULE',
            activityDetails: `Error creating module: ${moduleName}`,
            ipAddress,
            deviceInfo,
            endpoint,
            method: requestMethod || req.method,
            activityStatus: 'failed',
            errorMessage: err.message
        });

        return res.status(500).json({ status: 'error', message: 'An error occurred while saving the module', details: err.message });
    }
};

/**
 * ✅ List All Active Modules with Pagination
 */
const listModules = async (req, res) => {
    if (!req.user) return res.status(401).json({ status: 'error', message: 'Unauthorized: No token or invalid token' });

    const { userId } = req.user, { ipAddress, requestMethod, deviceInfo } = req.metadata || {}, endpoint = req.originalUrl;
    const { page = 1, limit = 10 } = req.query;

    const pageNumber = parseInt(page, 10), pageSize = parseInt(limit, 10);
    if (isNaN(pageNumber) || isNaN(pageSize) || pageNumber <= 0 || pageSize <= 0) {
        return res.status(400).json({ status: 'error', message: 'Page and limit must be valid positive numbers' });
    }

    try {
        const skip = (pageNumber - 1) * pageSize;
        const totalRecords = await ModuleName.countDocuments({ status: 1 });

        const modules = await ModuleName.find({ status: 1 })
            .sort({ 'audit.createdAt': -1 })
            .skip(skip)
            .limit(pageSize)
            .lean();

        if (!modules.length) {
            return res.status(404).json({ status: 'error', message: 'No active modules found', meta: { page: pageNumber, limit: pageSize, totalRecords, totalPages: Math.ceil(totalRecords / pageSize) }, data: [] });
        }

        res.status(200).json({
            status: 'success',
            meta: { page: pageNumber, limit: pageSize, totalRecords, totalPages: Math.ceil(totalRecords / pageSize) },
            data: modules.map(({ moduleName, description, audit }) => ({
                moduleName, description, audit: { createdAt: audit.createdAt, createdBy: audit.createdBy }, status: 1
            }))
        });

        await logUserActivity({ userId, activityType: 'GET_MODULES', activityDetails: 'Fetched all active modules', ipAddress, deviceInfo, endpoint, method: requestMethod || req.method, activityStatus: 'success' });
    } catch (err) {
        await logUserActivity({ userId, activityType: 'GET_MODULES', activityDetails: 'Error occurred while fetching modules', ipAddress, deviceInfo, endpoint, method: requestMethod || req.method, activityStatus: 'failed', errorMessage: err.message });
        res.status(500).json({ status: 'error', message: 'An error occurred while fetching modules', details: err.message });
    }
};

/**
 * ✅ Get a Module by ID
 */
const getModuleById = async (req, res) => {
    if (!req.user) return res.status(401).json({ status: 'error', message: 'Unauthorized: No token or invalid token' });

    const { moduleId } = req.params, { ipAddress, requestMethod, deviceInfo } = req.metadata || {}, endpoint = req.originalUrl;
    const loggedInUserId = req.user.userId;

    try {
        const module = await ModuleName.findOne({ _id: moduleId, status: 1 }, { moduleName: 1, description: 1, audit: 1 });

        if (!module) return res.status(404).json({ status: 'error', message: 'Module not found or inactive' });

        res.status(200).json({
            status: 'success',
            data: { moduleName: module.moduleName, description: module.description, audit: module.audit, status: module.status }
        });

        await logUserActivity({ userId: loggedInUserId, activityType: 'GET_MODULE_BY_ID', activityDetails: `Fetched module with ID: ${moduleId}`, ipAddress, deviceInfo, endpoint, method: requestMethod || req.method, activityStatus: 'success' });
    } catch (err) {
        await logUserActivity({ userId: loggedInUserId, activityType: 'GET_MODULE_BY_ID', activityDetails: `Error fetching module with ID: ${moduleId}`, ipAddress, deviceInfo, endpoint, method: requestMethod || req.method, activityStatus: 'failed', errorMessage: err.message });
        res.status(500).json({ status: 'error', message: 'An error occurred while fetching module', details: err.message });
    }
};



/**
 * ✅ Delete a Module (Soft Delete)
 */
const deleteModule = async (req, res) => {
    if (!req.user) return res.status(401).json({ status: 'error', message: 'Unauthorized: No token or invalid token' });

    const { moduleId } = req.params, { ipAddress, requestMethod, deviceInfo } = req.metadata || {}, endpoint = req.originalUrl;
    const userId = req.user.userId;

    try {
        const module = await ModuleName.findOne({ _id: moduleId, status: 1 });

        if (!module) return res.status(404).json({ status: 'error', message: 'Module not found or already inactive' });

        module.status = 0;
        await module.save();

        await logUserActivity({ userId, activityType: 'DELETE_MODULE', activityDetails: `Deleted module: ${module.moduleName}`, ipAddress, deviceInfo, endpoint, method: requestMethod || req.method, activityStatus: 'success' });

        res.json({ status: 'success', message: 'Module deleted successfully' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'An error occurred while deleting the module' });
    }
};

/**
 * ✅ Export all functions
 */
module.exports = {
     
    listModules,
    getModuleById,
    saveModule,
    deleteModule
};
