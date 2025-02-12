const mongoose = require('mongoose');
const SuperAdmin = require('../models/superAdminModel'); // Import SuperAdmin Model

const MONGO_URI = "mongodb+srv://<username>:<password>@cluster0.mongodb.net/<dbname>?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connected to MongoDB Atlas"))
    .catch(err => console.error("MongoDB Connection Error:", err));

const addSuperAdmin = async () => {
    try {
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
            country: "USA",
            ownerName: "John Doe",
            email_id: "admin@techcorp.com",
            phone_Number: "+1234567890",
            password: "SuperAdmin123",
            roleId: "role_001",
            address: {
                street: "123 Main St",
                city: "New York",
                state: "NY",
                zip: "10001",
                country: "USA"
            },
            isVerified: true,
            status: 1,
            audit: {
                createdBy: "System",
                updatedBy: "System"
            }
        });

        const result = await newSuperAdmin.save();
        console.log("SuperAdmin Added Successfully:", result);
    } catch (error) {
        console.error("Error adding SuperAdmin:", error.message);
    } finally {
        mongoose.connection.close();
    }
};

// ✅ Run the function only once when needed
addSuperAdmin();
