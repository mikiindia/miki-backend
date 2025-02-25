const mongoose = require("mongoose");
const Tenant = require("../models/tenantSchema"); // Replace with your Tenant model path
const { createTenantCollections } = require("../utils/DynamicCollection");

const syncTenantDatabases = async () => {
  try {
    // Connect to the main database (if not already connected)
    const mainDB = mongoose.connection.useDb("mikiapidb");

    // Fetch active tenants (status: 1)
    const tenants = await Tenant.find({ status: 1 }); // Assuming `status: 1` means active tenants
    const tenantIds = tenants.map((tenant) => tenant._id.toString()); // Fetch the `_id` field, as it maps to database names

    // Synchronize collections for each tenant's database
    for (const tenantId of tenantIds) {
      console.log(`Synchronizing collections for tenant database: ${tenantId}`);
      await createTenantCollections(tenantId); // Pass the tenant _id as the database name
      console.log(`Synchronized collections successfully for tenant: ${tenantId}`);
    }
  } catch (error) {
    console.error("Error synchronizing tenant databases:", error);
  }
};

module.exports = { syncTenantDatabases };
