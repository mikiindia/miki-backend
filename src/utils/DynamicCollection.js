const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const defaultDocuments = require("../utils/defaultDocuments"); // Import default documents
const getNextSequenceId = require("../utils/nextSequenceId"); // Sequential ID

const createTenantCollections = async (tenantName) => {
  try {
    const tenantDbName = `${tenantName}`;
    console.log(`Starting tenant collection creation process for: ${tenantDbName}`);

    // Establish a database connection with timeout configurations
    const tenantDb = mongoose.connection.useDb(tenantDbName, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 30000,
    });

    console.log(`Database connection established for tenant: '${tenantDbName}'`);

    // Fetch existing collections in the database
    const existingCollections = await tenantDb.db.listCollections().toArray();

    // Dynamically load schema files from the models directory
    const modelsPath = path.join(__dirname, "../models");
    const schemaFiles = fs
      .readdirSync(modelsPath)
      .filter(
        (file) =>
          file.endsWith(".js") &&
          !["tenantSchema.js", "masterUserSchema.js", "moduleNameSchema.js, 'superAdminSchema.js"].includes(file) // Exclude specific files
      );

    for (const file of schemaFiles) {
      const schemaFilePath = path.join(modelsPath, file);

      // Require the schema module dynamically
      const schemaModule = require(schemaFilePath);

      if (schemaModule && schemaModule.modelName) {
        const collectionName = schemaModule.collection.collectionName;

        console.log(`Processing collection: '${collectionName}'`);

        // Check if the collection already exists
        const collectionExists = existingCollections.some(
          (col) => col.name === collectionName
        );

        if (collectionExists) {
          console.log(`Collection '${collectionName}' already exists.`);
        } else {
          const tenantCollection = tenantDb.collection(collectionName);

          console.log(`Initializing collection '${collectionName}' in tenant database.`);

          // Fetch the default documents for the collection
          const defaultDocument = defaultDocuments[schemaModule.modelName];

          if (defaultDocument && Array.isArray(defaultDocument)) {
            // Insert each default document into the collection
            for (const doc of defaultDocument) {
              const id = await getNextSequenceId(`${schemaModule.modelName}Id`);
              await tenantCollection.insertOne({
                _id: id,
                ...doc,
                initializedAt: new Date(), // Add timestamp for initialization
              });
            }

            console.log(
              `Default documents created for collection: ${tenantDbName}.${collectionName}`
            );
          } else {
            // Insert a dummy document if no default document is found
            await tenantCollection.insertOne({ initializedAt: new Date() });

            console.log(
              `Initialized collection: ${tenantDbName}.${collectionName}`
            );
          }
        }
      } else {
        console.warn(`Skipped file: ${file} - No valid model exported.`);
      }
    }

    console.log(`Tenant database '${tenantDbName}' initialized successfully.`);
    return { success: true };
  } catch (error) {
    console.error(`Error creating collections for tenant '${tenantName}':`, error);
    throw error;
  }
};

module.exports = { createTenantCollections };
