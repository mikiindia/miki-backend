const mongoose = require('mongoose');
const MasterUser = require('../models/masterUserSchema'); 
const { connectDB, connectTenantDB } = require('../config/db'); // Ensure these are correctly imported

const tenantMiddleware = async (req, res, next) => {
  try {
    console.log('🌐 Request URL:', req.originalUrl);

    // Extract tenantId from the URL
    const regex = /\/tenant\/([a-fA-F0-9]{24}|1)/; // Allows "1" as a valid tenant ID
    const match = req.originalUrl.match(regex);
    const tenantId = match ? match[1] : null;

    // 🔹 If no tenant ID is provided, return an error
    if (!tenantId) {
      console.log('❌ No tenant ID provided in the request URL.');
      return res.status(400).json({ error: 'No tenant ID provided in the request URL.' });
    }

    // 🔹 If tenantId is "1", connect to the main database
    if (tenantId === "1") {
      console.log(`🏢 Tenant ID is "1". Connecting to the main database.`);
      await connectDB();  // Ensure main DB is connected
      req.tenantDB = null; // Indicate no separate tenant DB is used
      return next(); // Proceed to the next middleware or route
    }

    console.log(`🔍 Validating Tenant ID: ${tenantId}`);

    // Ensure the main database is connected before validating the tenant
    await connectDB();

    // Check if tenant exists and is active
    const tenantRecord = await MasterUser.findOne({ tenant_ID: tenantId, status: 1 });

    if (!tenantRecord) {
      console.log(`❌ Tenant with ID ${tenantId} not found or inactive.`);
      return res.status(404).json({ error: 'Tenant not found or inactive.' });
    }

    console.log(`✅ Tenant ${tenantId} is active. Establishing connection to tenant database.`);

    // Connect to the tenant database
    const tenantDB = await connectTenantDB(tenantId);

    if (tenantDB && tenantDB.readyState === 1) {
      req.tenantDB = tenantDB;
      console.log(`🔗 Tenant DB connection successful for tenantId: ${tenantId}`);
      return next(); // Proceed to the next middleware or route
    }

    console.log(`❌ Failed to connect to tenant DB for tenantId: ${tenantId}`);
    return res.status(500).json({ error: `Failed to connect to tenant database: ${tenantId}` });

  } catch (error) {
    console.error('❗ Error in tenantMiddleware:', error);
    res.status(500).json({ error: 'Internal server error while connecting to the database.' });
  }
};

module.exports = tenantMiddleware;
