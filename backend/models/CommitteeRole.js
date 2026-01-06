const mongoose = require('mongoose');

const committeeRoleSchema = new mongoose.Schema({
  roleId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String, // Malayalam name
    required: true
  },
  englishName: {
    type: String, // For mapping purposes
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CommitteeRole', committeeRoleSchema);
