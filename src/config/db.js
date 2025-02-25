const mongoose = require("mongoose");
require("dotenv").config();

const tenantConnections = {}; // Cache for tenant DB connections
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// Get main database URI from environment variables
const MAIN_DB_URI = IS_PRODUCTION ? process.env.MIKIINDIA_MONGODB_URI : process.env.MONGO_URI_LOCAL;

if (!MAIN_DB_URI) {
    console.error("❌ ERROR: Main database URI is missing in .env");
    process.exit(1);
}

// Connect to the Main Database (mikiapidb)
const connectMainDB = async () => {
    try {
        console.log("🔗 Connecting to Main Database...");
        await mongoose.connect(MAIN_DB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("✅ Connected to Main Database (mikiapidb)");
    } catch (error) {
        console.error("❌ Error connecting to Main Database:", error.message);
        process.exit(1);
    }
};

// Function to connect to a Tenant Database
const connectTenantDB = async (tenantId) => {
    try {
        if (tenantId === "1") {
            console.log("🔗 Tenant ID is 1. Using main database.");
            return mongoose.connection;
        }

        const TENANT_DB_URI_PREFIX = IS_PRODUCTION
            ? process.env.TENANT_DB_URI_PREFIX_PROD
            : process.env.TENANT_DB_URI_PREFIX_LOCAL;

        if (!TENANT_DB_URI_PREFIX) {
            throw new Error("❌ Tenant DB URI prefix is missing in .env");
        }

        const tenantDBURI = `${TENANT_DB_URI_PREFIX}${tenantId}`;
        console.log(`🔗 Connecting to Tenant DB: ${tenantDBURI}`);

        if (tenantConnections[tenantId]) {
            console.log(`🔄 Using cached connection for Tenant ID: ${tenantId}`);
            return tenantConnections[tenantId];
        }

        const tenantDB = mongoose.createConnection(tenantDBURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        tenantDB.on("connected", () => console.log(`✅ Connected to Tenant DB: ${tenantId}`));
        tenantDB.on("error", (err) => console.error(`⚠️ Error in Tenant DB connection: ${err.message}`));

        await new Promise((resolve, reject) => {
            tenantDB.once("connected", resolve);
            tenantDB.once("error", reject);
        });

        if (tenantDB.readyState === 1) {
            tenantConnections[tenantId] = tenantDB;
            return tenantDB;
        } else {
            throw new Error(`Tenant DB not connected. ReadyState: ${tenantDB.readyState}`);
        }
    } catch (err) {
        console.error(`❌ Error connecting to Tenant DB: ${err.message}`);
        throw err;
    }
};

module.exports = { connectMainDB, connectTenantDB };
