const mongoose = require('mongoose');

// Define the schema for storing the sequence value for admin IDs
const SequenceAdminIDSchema = new mongoose.Schema({
    seq: { type: Number, required: true, default: 0 } // Ensure a default value
});

// Create the model for Admin ID sequence
const SequenceAdminID = mongoose.model('SequenceAdminID', SequenceAdminIDSchema);

// Function to get the next admin ID in sequence
const getNextAdminID = async () => {
    try {
        const sequenceDocument = await SequenceAdminID.findOneAndUpdate(
            {}, // Query to find the document (upsert to create if not found)
            { $inc: { seq: 1 } }, // Increment the sequence value by 1
            { new: true, upsert: true } // Return updated document, create if not found
        );

        const sequenceNumber = sequenceDocument.seq;
        const paddedSequenceNumber = String(sequenceNumber).padStart(3, '0'); // Pad with leading zeros to 3 digits
        return `admin_${paddedSequenceNumber}`; // Return formatted admin ID
    } catch (error) {
        console.error('Error generating next admin ID:', error.message);
        throw new Error('Failed to generate admin ID');
    }
};

module.exports = {
    SequenceAdminID,
    getNextAdminID,
};
