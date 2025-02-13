const mongoose = require('mongoose');
const MasterUser = require('../models/masterUserSchema'); // Import MasterUser Model
const connectDB = require('../config/db'); // Import the existing connection setup

  
//   Function to Insert Default MasterUser
const insertMasterUser = async () => {
    try {

        // ✅ Ensure MongoDB is connected before inserting data
        await connectDB();

        // ✅ Check if MasterUser already exists
        const existingUser = await MasterUser.findOne({ supId: "sup_001" });

        if (existingUser) {
            console.log("⚠️ MasterUser already exists, skipping insertion.");
            return;
        }

        // // 🔢 Get Next Auto-Incremented ID
        // const nextId = await getNextSequenceValue("MasterUser");

        // ✅ Create new MasterUser
        const newUser = new MasterUser({
            
            supId: "sup_001",
            tenantId: null,
            bdmId: null,
            userId: null,
            phone_Number: "9876543210",
            email_id: "info@lexmetech.com",
            password_hash: "lex123@mind#", // Replace with a hashed password
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
