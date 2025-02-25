const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware'); // Authentication Middleware
const { checkPermission, PERMISSIONS } = require('../middlewares/checkPermission');
const {
    tenantRegister,
    tenantLogin,
    getTenantDetails,
    getTenantById,
    updateTenant,
    deleteTenant
} = require('../controllers/tenantController'); // Import Tenant Controller

// Define Module Names for Permission Checks
const MODULE_NAMES = ['TENANTS', 'ALL_MODULE'];

// Tenant Registration (Public Route)
router.post('/tenant-register', tenantRegister);

// Tenant Login (Public Route)
router.post('/tenant-login', tenantLogin);

// Get Tenant Details (Requires "view" or "all" permission)
router.get(
    '/get-tenant-details',
    auth,
    checkPermission(MODULE_NAMES, [PERMISSIONS.VIEW, PERMISSIONS.ALL]),
    getTenantDetails
);

// Get Tenant by Tenant ID (Requires "view" or "all" permission)
router.get(
    '/get-tenant-by-tenantId/:tenantId',
    auth,
    checkPermission(MODULE_NAMES, [PERMISSIONS.VIEW, PERMISSIONS.ALL]),
    getTenantById
);

// Update Tenant (Requires "edit" or "all" permission)
router.put(
    '/update-tenant/:tenantId',
    auth,
    checkPermission(MODULE_NAMES, [PERMISSIONS.EDIT, PERMISSIONS.ALL]),
    updateTenant
);

// Delete Tenant (Requires "delete" or "all" permission)
router.delete(
    '/delete-tenant/:tenantId',
    auth,
    checkPermission(MODULE_NAMES, [PERMISSIONS.DELETE, PERMISSIONS.ALL]),
    deleteTenant
);

module.exports = router;
