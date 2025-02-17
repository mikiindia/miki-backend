const mongoose = require('mongoose');

// Define the schema for storing the sequence value for module IDs
const SequenceModuleIDSchema = new mongoose.Schema({
    seq: {
        type: Number,
        required: true
    }
});

const SequenceModuleID = mongoose.model('SequenceModuleID', SequenceModuleIDSchema);

// Function to get the next module ID in sequence
const getNextModuleID = async () => {
    const sequenceDocument = await SequenceModuleID.findOneAndUpdate(
        {}, // Query to find the document (upsert to create if not found)
        { $inc: { seq: 1 } }, // Increment the sequence number
        { new: true, upsert: true }
    );

    const sequenceNumber = sequenceDocument.seq;
    const paddedSequenceNumber = String(sequenceNumber).padStart(3, '0'); // Format to 3-digit padding
    return `module_${paddedSequenceNumber}`; // Return formatted module ID
};

module.exports = {
    SequenceModuleID,
    getNextModuleID
};
