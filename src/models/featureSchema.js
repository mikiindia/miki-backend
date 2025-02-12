const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Audit Schema
const auditSchema = new Schema({
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: String },
    updatedAt: { type: Date },
    updatedBy: { type: String }
}, { _id: false });

const featureSchema = new Schema({
    _id:{type: Number, required: true},
    featureId: { type: String, required: true , unique: true },
    featureName: { type: String, required: true  },
    description: { type: String },
    status: { type: Number, default: 1 }, 
    audit: auditSchema
});

module.exports = mongoose.model('Feature',  featureSchema); 