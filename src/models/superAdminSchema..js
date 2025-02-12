const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;

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
    password: { type: String, required: true }, // Encrypted Password

    roleId: {  String, ref: 'Role', required: true }, // Linking Role

    address: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        zip: { type: String, trim: true },
        country: { type: String, trim: true }
    },

    password: { type: String, required: true }, // Hashed Password
    isVerified: { type: Boolean, default: false }, // Email/Phone Verification
    status: { type: Number, default: 1 }, // 1 = Active, 0 = Inactive

    audit: auditSchema // Audit Information
});
// **Middleware to Auto-Increment `_id` Before Saving**
superAdminSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            this._id = await getNextSequenceId('superAdminId'); // Get Next ID
        } catch (error) {
            return next(error);
        }
    }
    next();
});
//   Password Hashing before saving
superAdminSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10); // Generate salt
    this.password = await bcrypt.hash(this.password, salt); // Hash password
    next();
});

//   Password Verification Method
superAdminSchema.methods.verifyPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('SuperAdmin', superAdminSchema);
