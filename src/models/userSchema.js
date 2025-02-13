const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // For password hashing
const validator = require('validator'); // For input validation
const Schema = mongoose.Schema;

// Audit Schema
const auditSchema = new Schema({
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: String },
    updatedAt: { type: Date },
    updatedBy: { type: String }
}, { _id: false });

// User Schema
const userSchema = new Schema({
    _id: { type: Number, auto: true }, // Auto-generated unique ID


    userId: { type: String, required: true },

    // Basic Information ----------------------------------------------
    name: { type: String, required: true, trim: true, },
    email_id: { type: String, required: true, lowercase: true, trim: true },
    phone_Number: { type: String, required: true,  },
    address: { street: { type: String }, city: { type: String }, state: { type: String }, zip: { type: String }, country: { type: String }, },

    // Role Information ---------------------------------------------- 
    roleId: { type:  String, ref: 'Role', required: true }, // Role association


    // Security Information ----------------------------------------------
    password_hash: { type: String, required: true, select: false },
    passwordChangedAt: { type: Date },
    failedLoginAttempts: { type: Number, default: 0 }, // Brute-force attack protection
    accountLocked: { type: Boolean, default: false }, // Lock account after multiple failed attempts
     

 

    audit: auditSchema, // Audit Fields for tracking changes
    status: { type: Number, default: 1 }, // 1 = Active, 0 = Inactive
});

//   Password Hashing (Before Save)--------------
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next(); // If password is not modified, skip hashing

    const salt = await bcrypt.genSalt(10); // Generate salt
    this.password = await bcrypt.hash(this.password, salt); // Hash password
    next();
});

//   Password Verification Method----------------
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

//   Lock Account After Failed Attempts-----------------
userSchema.methods.failedLogin = async function () {
    this.security.failedLoginAttempts += 1;
    if (this.security.failedLoginAttempts >= 5) {
        this.security.accountLocked = true; // Lock account after 5 failed attempts
    }
    await this.save();
};

 

 

module.exports = mongoose.model('User', userSchema);
