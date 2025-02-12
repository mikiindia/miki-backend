const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware'); // Authentication Middleware
const { checkPermission, PERMISSIONS } = require('../middlewares/checkPermission');

const {
    listRoles,
    saveRole,
    deleteRole,
    getRoleById,
    updateRole
} = require('../controllers/rolesController'); // Import Role Controller

// Define Module Names for Permission Checks
const MODULE_NAMES = ['ROLES', 'ALL_MODULE'];

// List All Roles (Requires "view" or "all" permission)
router.get(
    '/get-roles',
   // auth,
   // checkPermission(MODULE_NAMES, [PERMISSIONS.VIEW, PERMISSIONS.ALL]),
    listRoles
);

// Create a New Role (Requires "add" or "all" permission)
router.post(
    '/create-role',
   // auth,
   // checkPermission(MODULE_NAMES, [PERMISSIONS.ADD, PERMISSIONS.ALL]),
    saveRole
);

// Get Role by ID (Requires "view" or "all" permission)
router.get(
    '/get-role/:roleId',
   // auth,
   // checkPermission(MODULE_NAMES, [PERMISSIONS.VIEW, PERMISSIONS.ALL]),
    getRoleById
);

// Update Role by ID (Requires "edit" or "all" permission)
router.put(
    '/update-role/:roleId',
   // auth,
    //checkPermission(MODULE_NAMES, [PERMISSIONS.EDIT, PERMISSIONS.ALL]),
    updateRole
);

// Delete Role (Requires "delete" or "all" permission)
router.delete(
    '/delete-role/:roleId',
   // auth,
   // checkPermission(MODULE_NAMES, [PERMISSIONS.DELETE, PERMISSIONS.ALL]),
    deleteRole
);

module.exports = router;
