const mongoose = require('mongoose');

// Define the schema for storing the sequence value for supplier IDs
const SequenceSupIDSchema = new mongoose.Schema({
    seq: {
        type: Number,
        required: true,
        default: 0, // Ensure a default value
    },
});

// Create the model for Supplier ID sequence
const SequenceSupID = mongoose.model('SequenceSupID', SequenceSupIDSchema);

// Function to get the next supplier ID in sequence
const getNextSupID = async () => {
    try {
        const sequenceDocument = await SequenceSupID.findOneAndUpdate(
            {}, // Query to find the document (upsert to create if not found)
            { $inc: { seq: 1 } }, // Increment the sequence value by 1
            { new: true, upsert: true } // Return the updated document, create if not found
        );

        const sequenceNumber = sequenceDocument.seq;
        const paddedSequenceNumber = String(sequenceNumber).padStart(3, '0'); // Pad with leading zeros to 3 digits
        return `sup_${paddedSequenceNumber}`; // Return formatted supplier ID
    } catch (error) {
        console.error('Error generating next supplier ID:', error.message);
        throw new Error('Failed to generate supplier ID');
    }
};

module.exports = {
    SequenceSupID,
    getNextSupID,
};
