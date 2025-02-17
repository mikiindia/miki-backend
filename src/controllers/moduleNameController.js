const validator = require('validator');
const ModuleName = require('../models/moduleNameSchema'); // Module model
const getNextSequenceId = require('../utils/nextSequenceId'); // Auto-increment helper
const logUserActivity = require('../utils/activityLogger'); // ✅ Ensure correct import
const dotenv = require('dotenv');
const { getNextModuleID } = require('../utils/sequenceModuleID'); // Function to get next module ID
const mongoose = require('mongoose'); // ✅ Import to check connection

// Load environment variables
dotenv.config();

/**
 * ✅ Create a New Module
 */
const saveModule = async (req, res) => {
    console.log('🔹 Received request to create module'); // ✅ Debugging Step 1

    const { moduleName, description } = req.body;
    const { ipAddress, requestMethod, deviceInfo } = req.metadata || {}, endpoint = req.originalUrl;
    const createdBy = req.user?.userId || 'system'; // ✅ Ensure `createdBy` is always defined

     

    // ✅ Check MongoDB Connection Status
    console.log('🔹 MongoDB Connection State:', mongoose.connection.readyState); 
    // (0: Disconnected, 1: Connected, 2: Connecting, 3: Disconnecting)

    try {
        if (!/^[A-Za-z _-]+$/.test(moduleName.trim())) {
            console.warn('❌ Invalid Module Name:', moduleName); // ✅ Debugging Step 2
            return res.status(400).json({ 
                status: 400, 
                message: 'Module name can only contain letters, spaces, underscores (_), and hyphens (-).' 
            });
        }

        // ✅ Check if module already exists
        const existingModule = await ModuleName.findOne({ moduleName: moduleName.trim(), status: 1 });
        if (existingModule) {
            console.warn('⚠️ Module already exists:', moduleName);
            return res.status(400).json({ status: 400, message: 'A module with this name already exists.' });
        }

        const _id = await getNextSequenceId('module');
        const moduleId = await getNextModuleID(); // Custom moduleId (e.g., module-001)

        // ✅ Save new module
        const newModule = new ModuleName({
            _id,
            moduleId,
            moduleName: moduleName.trim(),
            description: description || '',
            status: 1,
            audit: { createdAt: new Date(), createdBy }
        });

        await newModule.save();
        console.log('✅ Module created successfully:', moduleName);

        // ✅ Log success activity
        console.log('📌 Logging user activity for:', createdBy);
        await logUserActivity({
            userId: createdBy,
            activityType: 'CREATE_MODULE',
            activityDetails: `Created new module: ${moduleName}`,
            ipAddress,
            deviceInfo,
            endpoint,
            method: requestMethod || req.method,
            activityStatus: 'success'
        });

        console.log('✅ User activity logged successfully'); // ✅ Debugging Step 3
        return res.status(201).json({ status: 'success', message: 'Module created successfully', data: { moduleName: newModule.moduleName } });

    } catch (err) {
        console.error('❌ Error saving module:', err);

        // ✅ Log failure activity
        console.log('📌 Logging failed activity for:', createdBy);
        try {
            await logUserActivity({
                userId: createdBy,
                activityType: 'CREATE_MODULE',
                activityDetails: `Error creating module: ${moduleName}`,
                ipAddress,
                deviceInfo,
                endpoint,
                method: requestMethod || req.method,
                activityStatus: 'failed',
                errorMessage: err.message
            });
            console.log('✅ Failure activity logged successfully');
        } catch (logErr) {
            console.error('❌ Failed to log error activity:', logErr); // ✅ Debugging Step 4
        }

        return res.status(500).json({ status: 'error', message: 'An error occurred while saving the module', details: err.message });
    }
};





/**
 * ✅ List All Active Modules with Pagination
 */
const listModules = async (req, res) => {
    

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
        const module = await ModuleName.findOne({  moduleId, status: 1 });

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
