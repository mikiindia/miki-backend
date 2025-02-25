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

// Business Development Manager Schema
const bdmSchema = new Schema({
    _id: { type: Number, auto: true },
    bdmId: { type: String, required: true, trim: true }, // Unique BDM Identifier
    companyId: { type: String, required: true, trim: true }, // Associated Company ID
    fullName: { type: String, required: true, trim: true }, // Full Name
    email_id: { type: String, required: true, lowercase: true, trim: true, unique: true }, // Unique Email
    phone_Number: { type: String, required: true, trim: true }, // Contact Number
    alternatePhone_Number: { type: String, trim: true, default: null }, // Alternate Contact Number
    password_hash: { type: String, required: true }, // Encrypted Password
    roleId: { type: String, required: true, trim: true }, // Role ID
    department: { type: String, default: 'Business Development', trim: true }, // Default Department Name
    experienceYears: { type: Number, min: 0, required: true }, // Experience in Years
    skills: [{ type: String, trim: true }], // Array of Skills

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
bdmSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            this._id = await getNextSequenceId('bdmId'); // Get Next ID
        } catch (error) {
            return next(error);
        }
    }
    next();
});

// **Middleware to Hash Password Before Saving**
bdmSchema.pre('save', async function (next) {
    if (!this.isModified('password_hash')) return next(); // Hash only if changed
    try {
        const saltRounds = 10; // Recommended: 10-12 rounds
        this.password_hash = await bcrypt.hash(this.password_hash, saltRounds);
        next();
    } catch (error) {
        return next(error);
    }
});

module.exports = mongoose.model('BDM', bdmSchema);
