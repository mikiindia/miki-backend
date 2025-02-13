const mongoose = require("mongoose");

const masterUserSchema = new mongoose.Schema(
  {
    _id: { type: Number },
    supId: { type: String, default: null },
    tenantId: { type: String, default: null },
    bdmId: { type: String, default: null },
    userId: { type: String, default: null },
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

    refreshToken: { type: String, default: null },
    refreshTokenExpiry: { type: Date, default: null },

    status: { type: Number, default: 1 }, // 1 = Active, 0 = Inactive
  },
  { timestamps: true }
);

module.exports = mongoose.model("MasterUser", masterUserSchema);
