const mongoose = require('mongoose');
const Tenant = require('../models/tenantSchema'); 
const { connectMainDB, connectTenantDB } = require('../Config/DB'); // Ensure these are correctly imported
const TenantModel = require('../models/tenantSchema'); 

const tenantMiddleware = async (req, res, next) => {
  try {
    console.log('Request URL:', req.originalUrl);

    // Extract tenantId from the URL
    const regex = /\/tenant\/([a-fA-F0-9]{24})/;
    const match = req.originalUrl.match(regex);
    const tenantId = match ? match[1] : null;

    // Check if tenantId is null or undefined
    if (tenantId === null || tenantId === undefined) {
      console.log('Tenant ID is null or undefined. Connecting to the main database.');
      await connectMainDB();  // Connect to the main database
      req.tenantDb = null; // Indicate no tenant DB is being used
      return next(); // Proceed to the next middleware or route
    }

    console.log('Validating tenant in the main database.');
    await connectMainDB(); // Connect to the main database

    const tenantRecord = await Tenant.findOne({ tenant_ID: tenantId, status: 1 });

    // Log the tenantId value for debugging
    console.log(`Provided Tenant ID: ${tenantId}`);
    
    // Fetch all MasterUser records for comparison
    const allMasterUsers = await Tenant.find({ status: 1 });
    console.log("All Active tenants Records:");
    console.table(allMasterUsers.map(user => ({ tenant_ID: user.tenant_ID, status: user.status })));
    
    if (!tenantRecord) {
      console.log(`Tenant with ID ${tenantId} not found or inactive.`);
      return res.status(404).send({ error: 'Tenant not found or inactive.' });
    }
    
    console.log(`Matching Tenant Record Found: ${JSON.stringify(tenantRecord, null, 2)}`);

    console.log(`Tenant ${tenantId} found and active. Connecting to tenant DB.`);
    const tenantDB = await connectTenantDB(tenantId);

    if (tenantDB && tenantDB.readyState === 1) {
      req.tenantDB = tenantDB;
      console.log(`Tenant DB connected successfully for tenantId: ${tenantId}`);
      return next(); // Proceed to the next middleware or route
    }

    console.log(`Failed to connect to tenant DB for tenantId: ${tenantId}`);
    return res.status(500).json({ error: `Failed to connect to tenant database: ${tenantId}` });
  } catch (error) {
    console.error('Error in tenantMiddleware:', error);
    res.status(500).send({ error: 'Internal server error while connecting to the database.' });
  }
};

module.exports = tenantMiddleware;
