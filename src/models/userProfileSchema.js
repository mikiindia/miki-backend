const mongoose = require('mongoose');
const { Schema } = mongoose;

// 🔹 Audit Schema (for tracking creation & updates)
const auditSchema = new Schema({
    createdAt: { type: Date, default: Date.now },
    createdBy: { type:  String, ref: 'User' },
    updatedAt: { type: Date },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { _id: false });

// 🔹 Define the UserProfile Schema
const userProfileSchema = new Schema({
    _id: { type: Number, auto: true }, // Auto-generated unique ID
    profileId: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, required: true, unique: true, ref: 'User' }, // Reference to User model

    // 🔹 Profile Details
    name: { type: String, required: true, trim: true },
    username: { type: String, unique: true, sparse: true, trim: true }, // Username should be unique (sparse allows null)
    profileImage: { type: String }, // URL of profile picture
    dateOfBirth: { type: Date },
    bio: { type: String, trim: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    externalLink: { type: String, trim: true }, // External social or website link
    profileLink: { type: String, trim: true },
    preferenceIds: [{ type: Schema.Types.ObjectId, ref: 'Preference' }], // Array of preferences
    totalMikiCoins: { type: Number, default: 0 },

    // 🔹 User Roles and Permissions
    badgeId: { type: String, ref: 'UserBadge', default: null }, // User Badge Reference
    roleIds: [{ type:  String, ref: 'Role' }], // Multiple Roles Support

    // 🔹 Activity & Status
    isActive: { type: Boolean, default: true }, // Account status (active/inactive)
    isOnline: { type: Boolean, default: false }, // Is user online?
    lastSeen: { type: Date }, // Last online timestamp
    lastLogin: { type: Date }, // Last login timestamp
    isLoggedIn: { type: Boolean, default: false }, // If the user is currently logged in
    isVerified: { type: Boolean, default: false }, // Email, phone, or face verified
    isAdmin: { type: Boolean, default: false }, // Admin flag (true/false)
    isGroupAdmin: { type: Boolean, default: false }, // Group admin flag

    // 🔹 Audit Fields
    audit: auditSchema,
    status: { type: Number, enum: [0, 1], default: 1 } // 1 = Active, 0 = Inactive
});

// 🔹 Export the UserProfile model
module.exports = mongoose.model('UserProfile', userProfileSchema);
