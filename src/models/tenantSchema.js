const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Audit Schema
const auditSchema = new Schema({
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: String },
    updatedAt: { type: Date },
    updatedBy: { type: String }
}, { _id: false });

// Tenant Schema
const tenantSchema = new Schema({
    _id: { type: String, auto: true }, // Auto-generated unique ID used fore creating database
    tenantId: { type: String, required: true  }, // Unique Tenant Identifier
    tenantName: { type: String, required: true }, // Tenant's Name
    companyName: { type: String, required: true }, // Tenant's Company Name
    companySize: { type: String, enum: ['Small', 'Medium', 'Large'], required: true }, // Size of the Company
    registrationNumber: { type: String   }, // Business Registration Number
    country: { type: String, required: true }, // Country of Operation
    domain: { type: String  }, // Unique domain for the company
    industryType: { type: String, required: true }, // Industry Type (Finance, Healthcare, etc.)
    companyLogo: { type: String, default: 'https://placehold.co/360' }, // Company Logo
    email_id: { type: String, required: true, unique: true, sparse: true  }, // Official Email ID
    phone_number: { type: String, required: true  }, // Contact Phone Number
    alternatePhone_Number: { type: String, trim: true, default: null }, // Alternate Contact Number
    password_hash: { type: String, required: true }, // Encrypted Password
    address: { type: String, required: true }, // Office Address

    roleId: { type: String, ref: 'Role', required: true }, // Assigned Role

    isVerified: { type: Boolean, default: false }, // tenant Verification
    status: { type: Number, default: 1, enum: [0, 1] }, // 1 = Active, 0 = Inactive
    // subscriptionPlan: { type: String, enum: ['Free', 'Basic', 'Premium', 'Enterprise'], required: true }, // Plan Type
    // subscriptionExpiry: { type: Date }, // Subscription Expiry Date
    // paymentStatus: { type: String, enum: ['Paid', 'Pending', 'Overdue'], default: 'Pending' }, // Payment Status

     

    audit: auditSchema // Audit Fields for Tracking Changes
});

 

module.exports = mongoose.model('Tenant', tenantSchema);
