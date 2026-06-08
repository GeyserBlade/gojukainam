
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  firstName:    { type: String, required: true },
  lastName:     { type: String, required: true },
  dob:          { type: Date,   required: true }, // ISO date string
  gender:       { type: String, required: true },
  weight:       { type: Number },
  dojoId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Dojo' },
  gradeId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Grade' },
  titleId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Title' },
  joinDate:     { type: Date },
  lastGraded:   { type: Date },
  contactEmail: { type: String },
  contactPhone: { type: String },
  familyId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Family' },
  parents:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'Parent' }],
  instructor:   { type: Boolean, default: false },
  active:       { type: Boolean, default: true }
});

module.exports = mongoose.model('Student', studentSchema);