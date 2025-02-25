const mongoose = require("mongoose");
const getNextSequenceId = require('../utils/nextSequenceId'); 
const bcrypt = require('bcrypt');


const masterUserSchema = new mongoose.Schema(
  {
    _id: { type: Number },
    userId: { type: String, default: null },
    user_name: { type: String },
    phone_Number: { type: String },
    email_id: { type: String },
    password_hash: { type: String },

    roleId: { type: String, ref: "Role" },
    tenant_ID: { type: String, ref: "Tenant", default: null }, // matched with _id of tenantSchema used in create tenant db 

    isSuperAdmin: { type: Number, default: 0 },
    isTenant: { type: Number, default: 0 },
    isTenantUser: { type: Number, default: 0 },
    isBusinessDeveloper: { type: Number, default: 0 },

    otp: { type: String, default: null },
    otpExpiry: { type: Date, default: null },
    lastLogin: { type: Date, default: null },
    isLoggedIn: { type: Boolean, default: false },
    refreshToken: { type: String, default: null },
    refreshTokenExpiry: { type: Date, default: null },

    status: { type: Number, default: 1 }, // 1 = Active, 0 = Inactive
  },
  { timestamps: true }
);

// **Middleware to Auto-Increment `_id` Before Saving**
masterUserSchema.pre('save', async function (next) {
  if (this.isNew) {
      try {
          this._id = await getNextSequenceId('masterUserId'); // Get Next ID
      } catch (error) {
          return next(error);
      }
  }
  next();
});

// **Middleware to Hash Password Before Saving**
masterUserSchema.pre('save', async function (next) {
  if (!this.isModified('password_hash')) return next(); // Hash only if changed
  try {
      const saltRounds = 10; // Recommended: 10-12 rounds
      this.password_hash = await bcrypt.hash(this.password_hash, saltRounds);
      next();
  } catch (error) {
      return next(error);
  }
});


module.exports = mongoose.model("MasterUser", masterUserSchema);
