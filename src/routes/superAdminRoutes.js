const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware'); 
const { checkPermission, PERMISSIONS } = require('../middlewares/checkPermission');
const { 
    listSuperadmins, 
    getSuperadminsById, 
    deleteSuperadmins, 
    loginSuperadmins, 
    logoutSuperadmins, 
    updateSuperadmins

} = require('../controllers/superAdminController');

const MODULE_NAMES = ['SUPER_ADMIN', 'ALL_MODULE']; // Module defined for permission checking

// List Users (requires "view_users" or "manage_users" permission)
router.get('/get-superadmin-details',
    // auth, checkPermission(PERMISSIONS.VIEW, MODULE_NAMES),
      listSuperadmins);

// Get User by ID (requires "view_users" or "manage_users" permission)
router.get('/get/superadminId/:superadminId', 
   // auth, checkPermission(PERMISSIONS.VIEW, MODULE_NAMES),
     getSuperadminsById);

 // register of super admin
router.post('/register-superadmin', loginSuperadmins);

// User Login (open to all, no permission needed)
router.post('/login-superadmin', loginSuperadmins);

// Update User profile details
router.put('/superadmin/superadminId/:superadminId',
    // auth, checkPermission(PERMISSIONS.EDIT, MODULE_NAMES), 
     updateSuperadmins);

// Delete User (requires "delete_users" or "manage_users" permission)
router.delete('/deletesuperadmin/:superadminId',
   //  auth, checkPermission(PERMISSIONS.DELETE, MODULE_NAMES), 
     deleteSuperadmins);

// Logout User
router.post('/logout-superadmin', auth, logoutSuperadmins);

module.exports = router;
