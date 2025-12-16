const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    providerId: { type: String, required: true, unique: true }, // Google/GitHub ID or email for local
    provider: { type: String, required: true }, // 'google', 'github', 'local', etc.
    displayName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // For local signup (hashed)
    avatar: String, // URL to profile picture
    role: { type: String, enum: ['user', 'contractor'], default: 'user' }, // User role for permissions
    // The "Garage" they own (if we expand later)
    joinedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);