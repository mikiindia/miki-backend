const mongoose = require('mongoose');

// Define the schema for storing the sequence value for tenant IDs
const SequenceTenantIDSchema = new mongoose.Schema({
    seq: { type: Number, required: true, default: 0 } // Ensure a default value
});

// Create the model for Tenant ID sequence
const SequenceTenantID = mongoose.model('SequenceTenantID', SequenceTenantIDSchema);

// Function to get the next tenant ID in sequence
const getNextTenantID = async () => {
    try {
        const sequenceDocument = await SequenceTenantID.findOneAndUpdate(
            {}, // Query to find the document (upsert to create if not found)
            { $inc: { seq: 1 } }, // Increment the sequence value by 1
            { new: true, upsert: true } // Return updated document, create if not found
        );

        const sequenceNumber = sequenceDocument.seq;
        const paddedSequenceNumber = String(sequenceNumber).padStart(3, '0'); // Pad with leading zeros to 3 digits
        return `tenant_${paddedSequenceNumber}`; // Return formatted tenant ID
    } catch (error) {
        console.error('Error generating next tenant ID:', error.message);
        throw new Error('Failed to generate tenant ID');
    }
};

module.exports = {
    SequenceTenantID,
    getNextTenantID,
};
