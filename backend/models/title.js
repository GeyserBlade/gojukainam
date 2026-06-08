const mongoose = require('mongoose');

const titleSchema = new mongoose.Schema({
  description: { type: String, required: true },
});
module.exports = mongoose.model('Title', titleSchema);
