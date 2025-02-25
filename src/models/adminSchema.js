const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;
const getNextSequenceId = require('../utils/nextSequenceId'); 

// Audit Schema for tracking changes
const auditSchema = new Schema({
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: String },
    updatedAt: { type: Date },
    updatedBy: { type: String }
}, { _id: false });

// Admin Schema
const adminSchema = new Schema({
    _id: { type: Number, auto: true },
    adminId: { type: String, required: true, trim: true }, // Unique Admin Identifier
    companyId: { type: String, required: true, trim: true }, // Associated Company ID
    fullName: { type: String, required: true, trim: true }, // Admin Full Name
    email_id: { type: String, required: true, lowercase: true, trim: true }, // Unique Email
    phone_Number: { type: String, required: true, trim: true }, // Contact Number
    alternatePhone_Number: { type: String, trim: true, default: null }, // Alternate Contact Number
    password_hash: { type: String, required: true }, // Encrypted Password
    roleId: { type: String, required: true, trim: true }, // Role ID

    address: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        zip: { type: String, trim: true },
        country: { type: String, trim: true }
    },

    isVerified: { type: Boolean, default: true }, // Email/Phone Verification
    status: { type: Number, default: 1 }, // 1 = Active, 0 = Inactive

    audit: auditSchema // Audit Information
});

// **Middleware to Auto-Increment `_id` Before Saving**
adminSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            this._id = await getNextSequenceId('adminId'); // Get Next ID
        } catch (error) {
            return next(error);
        }
    }
    next();
});

// **Middleware to Hash Password Before Saving**
adminSchema.pre('save', async function (next) {
    if (!this.isModified('password_hash')) return next(); // Hash only if changed
    try {
        const saltRounds = 10; // Recommended: 10-12 rounds
        this.password_hash = await bcrypt.hash(this.password_hash, saltRounds);
        next();
    } catch (error) {
        return next(error);
    }
});

module.exports = mongoose.model('Admin', adminSchema);
