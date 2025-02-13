const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;
const getNextSequenceId = require('../utils/nextSequenceId'); 
//   Audit Schema for tracking changes
const auditSchema = new Schema({
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: String },
    updatedAt: { type: Date },
    updatedBy: { type: String }
}, { _id: false });

//   SuperAdmin Schema (Company Information)
const superAdminSchema = new Schema({
    _id: { type:  Number, auto: true },
    supId: { type: String, required: true,  trim: true }, // Unique SuperAdmin Identifier
    companyId: { type: String, required: true,   trim: true }, // Unique Company Identifier
    companyName: { type: String, required: true,  trim: true }, // Name of the Company
    companySize: { type: Number, required: true,  min: 1 }, // Number of employees
    registrationNumber: { type: String, required: true,   trim: true }, // Govt. Registration No.
    companyLogo: { type: String, trim: true }, // Company Logo
    domain: { type: String, required: true,   lowercase: true, trim: true }, // Company Website Domain
    country: { type: String, required: true, trim: true }, // Country of Registration

    ownerName: { type: String, required: true, trim: true }, // Owner/CEO Name
    email_id: { type: String, required: true,   lowercase: true, trim: true }, // Unique email
    phone_Number: { type: String, required: true,   trim: true }, // Contact number
    password_hash: { type: String, required: true }, // Encrypted Password

    roleId: {  String  }, // Linking Role

    address: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        zip: { type: String, trim: true },
        country: { type: String, trim: true }
    },

    
    isVerified: { type: Boolean, default: false }, // Email/Phone Verification
    status: { type: Number, default: 1 }, // 1 = Active, 0 = Inactive

    audit: auditSchema // Audit Information
});
// **Middleware to Auto-Increment `_id` Before Saving**
superAdminSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            this._id = await getNextSequenceId('superadminId'); // Get Next ID
        } catch (error) {
            return next(error);
        }
    }
    next();
});

// **Middleware to Hash Password Before Saving**
superAdminSchema.pre('save', async function (next) {
    if (!this.isModified('password_hash')) return next(); // Hash only if changed
    try {
        const saltRounds = 10; // Recommended: 10-12 rounds
        this.password_hash = await bcrypt.hash(this.password_hash, saltRounds);
        next();
    } catch (error) {
        return next(error);
    }
});

 
 

module.exports = mongoose.model('SuperAdmin', superAdminSchema);
