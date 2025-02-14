const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Audit Schema (Reused)
const auditSchema = new Schema({
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: String },
    updatedAt: { type: Date },
    updatedBy: { type: String }
}, { _id: false });

// Module Schema
const moduleNameSchema = new Schema({
    _id: { type: Number, required: true },  // Unique Module ID
    moduleId: { type: String, required: true }, // Unique Identifier
    moduleName: { type: String, required: true }, // Module Name
    description: { type: String },  // Optional Description
    status: { type: Number, default: 1 },  // 1 = Active, 0 = Inactive
    audit: auditSchema  // Audit Trail
});

module.exports = mongoose.model('ModuleName', moduleNameSchema);
