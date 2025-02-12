const mongoose = require('mongoose');

// Define the schema for storing the sequence value for user IDs
const SequenceUserIDSchema = new mongoose.Schema({
    seq: {
        type: Number,
        required: true,
        default: 0, // Ensure a default value
    },
});

// Create the model for User ID sequence
const SequenceUserID = mongoose.model('SequenceUserID', SequenceUserIDSchema);

// Function to get the next user ID in sequence
const getNextUserID = async () => {
    try {
        const sequenceDocument = await SequenceUserID.findOneAndUpdate(
            {}, // Query to find the document (upsert to create if not found)
            { $inc: { seq: 1 } }, // Increment the sequence value by 1
            { new: true, upsert: true } // Return the updated document, create if not found
        );

        const sequenceNumber = sequenceDocument.seq;
        const paddedSequenceNumber = String(sequenceNumber).padStart(3, '0'); // Pad with leading zeros to 3 digits
        return `user_${paddedSequenceNumber}`; // Return formatted user ID
    } catch (error) {
        console.error('Error generating next user ID:', error.message);
        throw new Error('Failed to generate user ID');
    }
};

module.exports = {
    SequenceUserID,
    getNextUserID,
};
