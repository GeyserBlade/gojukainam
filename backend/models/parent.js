const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactEmail: { type: String },
  contactPhone: { type: String },
  familyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Family' },
});
module.exports = mongoose.model('Parent', parentSchema);
