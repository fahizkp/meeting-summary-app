const mongoose = require('mongoose');

const districtSchema = new mongoose.Schema({
  districtId: {
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
}, {
  timestamps: true,
});

// Indexes
districtSchema.index({ districtId: 1 });

module.exports = mongoose.model('District', districtSchema);
