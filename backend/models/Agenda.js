const mongoose = require('mongoose');

const AgendaSchema = new mongoose.Schema({
  agendaId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  isDefault: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Index for ordering
AgendaSchema.index({ order: 1 });

const Agenda = mongoose.model('Agenda', AgendaSchema);

module.exports = Agenda;
