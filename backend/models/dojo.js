const mongoose = require('mongoose');

const dojoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String },
  city: { type: String },
  region: { type: String },
  country: { type: String },
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  contactEmail: { type: String },
  contactPhone: { type: String },
});
module.exports = mongoose.model('Dojo', dojoSchema);
