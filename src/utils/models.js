
const path = require('path');
const fs = require('fs');

/**
 * Dynamically load a model from the models folder
 * @param {string} modelName - Name of the model
 * @param {Object} schema - Mongoose schema (optional)
 * @param {Object} connection - Mongoose connection instance
 * @returns {Object} - Mongoose model instance
 */
const getModel = (modelName, schema = null, connection = null) => {
  try {
    // Resolve the path to the models folder
    const modelsPath = path.join(__dirname, '../models');

    // Dynamically require the model file
    const modelFilePath = path.join(modelsPath, `${modelName}Schema.js`);
    if (!fs.existsSync(modelFilePath)) {
      throw new Error(`Model file ${modelName}Schema.js does not exist`);
    }

    const modelSchema = schema || require(modelFilePath); // Load the schema dynamically

    // If no connection is provided, use the default mongoose connection
    const mongooseConnection = connection || require('mongoose').connection;

    // Register the model dynamically
    return mongooseConnection.model(modelName, modelSchema);
  } catch (error) {
    console.error(`[ERROR]: Failed to load model ${modelName} - ${error.message}`);
    return null;
  }
};

module.exports = { getModel };