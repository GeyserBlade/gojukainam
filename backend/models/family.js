const mongoose = require('mongoose');

const familySchema = new mongoose.Schema({
  familyCode: { type: String, required: true },
  familyName: { type: String, required: true },
});
module.exports = mongoose.model('Family', familySchema);



