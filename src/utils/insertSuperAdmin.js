const mongoose = require('mongoose');
const connectDB = require('../config/db'); // Import the existing connection setup
const SuperAdmin = require('../models/superAdminSchema'); // Import SuperAdmin Model
const Role = require('../models/roleSchema'); // Import SuperAdmin Model

const addSuperAdmin = async () => {
    try {
        // ✅ Ensure MongoDB is connected before inserting data
        await connectDB();

        // ✅ Check if SuperAdmin already exists
        const existingAdmin = await SuperAdmin.findOne({ email_id: "admin@techcorp.com" });

        if (existingAdmin) {
            console.log("SuperAdmin already exists, skipping insertion.");
            return;
        }

        // ✅ Create new SuperAdmin only if not found
        const newSuperAdmin = new SuperAdmin({
           
            supId: "sup_001",
            companyId: "comp_001",
            companyName: "Lexmetech Systems pvt.ltd.",
            companySize: 50,
            registrationNumber: "REG123456",
            companyLogo: "https://example.com/logo.png",
            domain: "techcorp.com",
            country: "India",
            ownerName: "lexmetech",
            email_id: "",
            phone_Number: "",
            password_hash: "",
            roleId: "role_001",
            address: {
                street: "123 Main St",
                city: "Bhubaneswar",
                state: "Odisha",
                zip: "751021",
                country: "India"
            },
            isVerified: true,
            status: 1,
            audit: {
                createdBy: "System",
                updatedBy: "System"
            }
        });

        const result = await newSuperAdmin.save();
        console.log("✅ SuperAdmin Added Successfully:", result);
    } catch (error) {
        console.error("❌ Error adding SuperAdmin:", error.message);
    } finally {
        // ✅ Close connection when script completes
        mongoose.connection.close();
        console.log("🔌 MongoDB connection closed.");
    }
};

// ✅ Run the function only once
addSuperAdmin();
