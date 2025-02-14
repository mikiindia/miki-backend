const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware'); // Authentication Middleware
const { checkPermission, PERMISSIONS } = require('../middlewares/checkPermission');

const {
    listModules,
    saveModule,
    getModuleById,
    //updateModule,
    deleteModule
} = require('../controllers/moduleNameController'); // Import Module Controller

// Define Module Names for Permission Checks
const MODULE_NAMES = ['MODULES', 'ALL_MODULE'];

// List All Modules (Requires "view" or "all" permission)
router.get(
    '/get-modules',
    // auth,
    // checkPermission(MODULE_NAMES, [PERMISSIONS.VIEW, PERMISSIONS.ALL]),
    listModules
);

// Create a New Module (Requires "add" or "all" permission)
router.post(
    '/create-module',
    // auth,
    // checkPermission(MODULE_NAMES, [PERMISSIONS.ADD, PERMISSIONS.ALL]),
    saveModule
);

// Get Module by ID (Requires "view" or "all" permission)
router.get(
    '/get-module/:moduleId',
    // auth,
    // checkPermission(MODULE_NAMES, [PERMISSIONS.VIEW, PERMISSIONS.ALL]),
    getModuleById
);

// // Update Module by ID (Requires "edit" or "all" permission)
// router.put(
//     '/update-module/:moduleId',
//     // auth,
//     // checkPermission(MODULE_NAMES, [PERMISSIONS.EDIT, PERMISSIONS.ALL]),
//     updateModule
// );

// Delete Module (Requires "delete" or "all" permission)
router.delete(
    '/delete-module/:moduleId',
    // auth,
    // checkPermission(MODULE_NAMES, [PERMISSIONS.DELETE, PERMISSIONS.ALL]),
    deleteModule
);

module.exports = router;
