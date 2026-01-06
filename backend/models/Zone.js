const mongoose = require('mongoose');

const zoneRoleSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
}, { _id: false });

const zoneSchema = new mongoose.Schema({
  zoneId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  districtId: {
    type: String,
    default: 'D001', // Default district for now
    trim: true,
  },
  roles: [zoneRoleSchema], // President, Secretary, etc.
}, {
  timestamps: true,
});

// Indexes
zoneSchema.index({ zoneId: 1 });
zoneSchema.index({ districtId: 1 });
zoneSchema.index({ name: 1 });

module.exports = mongoose.model('Zone', zoneSchema);
