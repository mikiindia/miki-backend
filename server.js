const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const winston = require("winston");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const { connectMainDB } = require("./src/config/db.js"); // Corrected function name
const logger = require("./src/utils/logger");
const captureRequestMetadata = require("./src/middlewares/captureRequestMetadata");
const tenantMiddleware = require("./src/middlewares/tenantMiddleware");
const { syncTenantDatabases } = require("./src/utils/syncTenants"); 

require("./src/utils/modelWatcher"); // Watch for schema changes

// Load environment variables
dotenv.config();

const app = express(); 

// Middleware Setup
app.set("trust proxy", true); // Enable trusting proxy headers (for real IPs)
app.use(helmet()); // Security headers
app.use(cors()); // CORS for all origins
app.use(express.json()); // Parse incoming JSON
app.use(captureRequestMetadata); // Capture request metadata globally

// Logging middleware using Winston
app.use((req, res, next) => {
  logger.info(`Request - ${req.method} ${req.url}`);
  next();
});

// Define custom token for Morgan
morgan.token("endpoint", (req) => req.originalUrl.split("?")[0]);
app.use(morgan(":method :endpoint :status :res[content-length] - :response-time ms"));

// Apply Tenant Middleware BEFORE defining tenant routes
app.use(tenantMiddleware);

// Routes Setup
app.use("/api/tenant/:tenantId", require("./src/routes/roleRoutes"));
app.use("/api/tenant/:tenantId", require("./src/routes/moduleNameRoutes"));
app.use("/api/tenant/:tenantId", require("./src/routes/superAdminRoutes"));
app.use("/api", require("./src/routes/tenantRoutes"));

// 404 Error Handling Middleware (Unknown Routes)
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// Server Start Function
const PORT = process.env.PORT || 3001;
const startServer = async () => {
  try {
    await connectMainDB();
    console.log("✅ Main database connected.");

    await syncTenantDatabases();
    console.log("✅ Tenant databases synchronized.");

    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server startup failed:", error.message);
    process.exit(1);
  }
};

// Start Server
startServer();

// Error Handling Middleware for Uncaught Exceptions & Rejections
process.on("uncaughtException", (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Graceful Shutdown Handling
process.on("SIGINT", async () => {
  logger.info("SIGINT received. Shutting down gracefully...");
  await mongoose.connection.close();
  logger.info("MongoDB disconnected");
  process.exit(0);
});
