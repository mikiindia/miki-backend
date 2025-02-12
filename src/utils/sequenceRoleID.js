const mongoose = require('mongoose');

// Define the schema for storing the sequence value for role IDs
const SequenceRoleIDSchema = new mongoose.Schema({
    seq: {
        type: Number,
        required: true
    }
});

const SequenceRoleID = mongoose.model('SequenceRoleID', SequenceRoleIDSchema);

// Function to get the next role ID in sequence
const getNextRoleID = async () => {
    const sequenceDocument = await SequenceRoleID.findOneAndUpdate(
        {}, // Query to find the document (upsert to create if not found)
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );

    const sequenceNumber = sequenceDocument.seq;
    const paddedSequenceNumber = String(sequenceNumber).padStart(3, '0'); // Pad with leading zeros to 3 digits
    return `role_${paddedSequenceNumber}`; // Return formatted role ID
};

module.exports = {
    SequenceRoleID,
    getNextRoleID
};
