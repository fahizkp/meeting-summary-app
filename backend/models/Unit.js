const mongoose = require('mongoose');

const unitMemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    default: 'Member',
    trim: true,
  },
}, { _id: false });

const unitSchema = new mongoose.Schema({
  unitId: {
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
  zoneId: {
    type: String,
    required: true,
    trim: true,
  },
  members: [unitMemberSchema],
}, {
  timestamps: true,
});

// Indexes
unitSchema.index({ unitId: 1 });
unitSchema.index({ zoneId: 1 });

module.exports = mongoose.model('Unit', unitSchema);
