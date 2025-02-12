const mongoose = require('mongoose');

// Define the schema for storing the sequence value for activity IDs
const SequenceActivityIDSchema = new mongoose.Schema({
    seq: {
        type: Number,
        required: true,
        default: 0, // Ensure a default value
    },
});

// Create the model for Activity ID sequence
const SequenceActivityID = mongoose.model('SequenceActivityID', SequenceActivityIDSchema);

// Function to get the next activity ID in sequence
const getNextActivityID = async () => {
    try {
        const sequenceDocument = await SequenceActivityID.findOneAndUpdate(
            {}, // Query to find the document (upsert to create if not found)
            { $inc: { seq: 1 } }, // Increment the sequence value by 1
            { new: true, upsert: true } // Return the updated document, create if not found
        );

        const sequenceNumber = sequenceDocument.seq;
        const paddedSequenceNumber = String(sequenceNumber).padStart(3, '0'); // Pad with leading zeros to 3 digits
        return `activity_${paddedSequenceNumber}`; // Return formatted activity ID
    } catch (error) {
        console.error('Error generating next activity ID:', error.message);
        throw new Error('Failed to generate activity ID');
    }
};

module.exports = {
    SequenceActivityID,
    getNextActivityID,
};
