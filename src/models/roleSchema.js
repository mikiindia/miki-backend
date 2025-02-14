const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Audit Schema
const auditSchema = new Schema({
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: String },
    updatedAt: { type: Date },
    updatedBy: { type: String }
}, { _id: false });

// Role Schema
const roleSchema = new Schema({
    _id: { type: Number, auto: true },
    roleId: { type: Number, required: true, unique: true }, // Role Identifier
    roleName: { type: String, required: true }, // Role Name (e.g., "Admin", "User", "Manager")

    permissions: [{
        moduleName: { type: String, required: true, uppercase: true }, // e.g., "USERS", "ORDERS"
        accessType: { type: String, required: true, enum: ['view', 'add', 'edit', 'delete', 'all'] }, // Action type
        canAccess: { type: Number, default: 0 } // 1 = Allowed, 0 = Denied
    }],

    status: { type: Number, default: 1 }, // 1 = Active, 0 = Inactive

    audit: auditSchema // Audit tracking
});

module.exports = mongoose.model('Role', roleSchema);
