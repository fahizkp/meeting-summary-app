const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  roles: [{
    type: String,
    enum: ['admin', 'district_admin', 'zone_admin'],
  }],
  zoneAccess: [{
    type: String, // Zone IDs
  }],
  districtAccess: [{
    type: String, // District IDs (for future multi-district)
  }],
}, {
  timestamps: true,
});

// Indexes
userSchema.index({ username: 1 });
userSchema.index({ roles: 1 });

module.exports = mongoose.model('User', userSchema);
