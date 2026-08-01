const mongoose = require('mongoose');

const dojoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: String,
  city: String,
  region: String,
  country: String,
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' }, // Assuming instructors are also students
  contactEmail: String,
  contactPhone: String,
});

const familiesSchema = new mongoose.Schema({
  familyCode: { type: String, required: true },
  familyName: { type: String, required: true },
});

const parentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactEmail: String,
  contactPhone: String,
  familyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Family' },
});

const gradeSchema = new mongoose.Schema({
  description: { type: String, required: true },
  gradingCost: { type: Number, required: true },
  gradingCostCurrency: { type: String, required: true },
});

const titleSchema = new mongoose.Schema({
  description: { type: String, required: true },
});

const studentSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  dob: { type: Date, required: true },
  gender: { type: String, required: true },
  weight: Number,
  dojoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dojo' },
  gradeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Grade' },
  titleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Title', required: false},
  joinDate: { type: Date },
  lastGraded: { type: Date },
  contactEmail: { type: String, required: false },
  contactPhone: { type: String, required: false },
  familyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Family' },
  parents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Parent' }],
  instructor: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
});

// Export models
module.exports = {
  Dojo: mongoose.model('Dojo', dojoSchema),
  Family: mongoose.model('Family', familiesSchema),
  Parent: mongoose.model('Parent', parentSchema),
  Grade: mongoose.model('Grade', gradeSchema),
  Title: mongoose.model('Title', titleSchema),
  Student: mongoose.model('Student', studentSchema),
};
