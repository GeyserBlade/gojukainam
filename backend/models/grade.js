const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  description: { type: String, required: true },
  gradingCost: { type: Number, required: true },
  gradingCostCurrency: { type: String, required: true },
});
module.exports = mongoose.model('Grade', gradeSchema);

