const mongoose = require("mongoose");
const Tenant = require("../models/tenantSchema"); // Ensure correct model path
const { createTenantCollections } = require("../utils/DynamicCollection");

const syncTenantDatabases = async () => {
  try {
    // Ensure the connection is ready before proceeding
    if (mongoose.connection.readyState !== 1) {
      console.error("❌ MongoDB is not connected. Aborting tenant sync.");
      return;
    }

    console.log("🔄 Fetching active tenants from the main database...");

    // Fetch active tenants directly from the Tenant model
    const tenants = await Tenant.find({ status: 1 });

    if (!tenants || tenants.length === 0) {
      console.log("✅ No active tenants found. Everything is up-to-date! 🎉");
      return;
    }

    console.log(`🔍 Found ${tenants.length} active tenant(s). Starting synchronization...`);

    // Convert _id to strings
    const tenantIds = tenants
      .map((tenant) => {
        if (!tenant._id) {
          console.error("⚠️ Missing _id for tenant:", tenant);
          return null;
        }
        return String(tenant._id); // Ensure conversion to string
      })
      .filter(Boolean); // Remove any null values

    // Synchronize collections for each tenant's database
    for (const tenantId of tenantIds) {
      console.log(`🔄 Synchronizing collections for tenant database: ${tenantId}`);
      try {
        await createTenantCollections(tenantId); // Pass the tenant _id as the database name
        console.log(`✅ Successfully synchronized collections for tenant: ${tenantId}`);
      } catch (err) {
        console.error(`❌ Error synchronizing collections for tenant: ${tenantId}`, err);
      }
    }
  } catch (error) {
    console.error("❌ Error synchronizing tenant databases:", error);
  }
};

module.exports = { syncTenantDatabases };
