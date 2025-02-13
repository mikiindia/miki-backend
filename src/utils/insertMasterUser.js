const mongoose = require('mongoose');
const MasterUser = require('../models/masterUserSchema'); // Import MasterUser Model

const MONGO_URI = "mongodb+srv://<username>:<password>@cluster0.mongodb.net/<dbname>?retryWrites=true&w=majority";

// 🔗 Connect to MongoDB Atlas
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ Connected to MongoDB Atlas"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// 🔢 Function to Get Next Sequence for _id
const getNextSequenceValue = async (sequenceName) => {
    const sequenceDoc = await mongoose.connection.collection("counters").findOneAndUpdate(
        { _id: sequenceName },
        { $inc: { sequence_value: 1 } },
        { returnDocument: "after", upsert: true }
    );
    return sequenceDoc.value.sequence_value;
};

// 🔹 Function to Insert Default MasterUser
const insertMasterUser = async () => {
    try {
        // ✅ Check if MasterUser already exists
        const existingUser = await MasterUser.findOne({ supId: "sup_001" });

        if (existingUser) {
            console.log("⚠️ MasterUser already exists, skipping insertion.");
            return;
        }

        // 🔢 Get Next Auto-Incremented ID
        const nextId = await getNextSequenceValue("MasterUser");

        // ✅ Create new MasterUser
        const newUser = new MasterUser({
            _id: nextId,
            supId: "sup_001",
            tenantId: null,
            bdmId: null,
            userId: null,
            phone_Number: "9876543210",
            email_id: "admin@example.com",
            password_hash: "hashed_password", // Replace with a hashed password
            roleId: "role_001", // Replace with an actual role ID
            tenant_ID: "1",
            isSuperAdmin: 1, // Mark as super admin
            status: 1 // Active
        });

        const result = await newUser.save();
        console.log("✅ MasterUser Added Successfully:", result);
    } catch (error) {
        console.error("❌ Error adding MasterUser:", error.message);
    } finally {
        mongoose.connection.close();
    }
};

// ✅ Run the function only once when needed
insertMasterUser();
