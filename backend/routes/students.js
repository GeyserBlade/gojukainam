const express = require('express');
const Student = require('../models/student');
const router = express.Router();

router.get('/', async (req, res) => {
  const students = await Student.find().populate('gradeId');
  res.json(students);
});

router.get('/:id', async (req, res) => {
  const student = await Student.findById(req.params.id).populate('gradeId');
  if (!student) return res.status(404).send('Student not found');
  res.json(student);
});

router.post('/', async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.status(201).json(student);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.entries(err.errors).map(
        ([field, e]) => `${field}: ${e.message}`
      );
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!student) return res.status(404).send('Student not found');
    res.json(student);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.entries(err.errors).map(
        ([field, e]) => `${field}: ${e.message}`
      );
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  await Student.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

module.exports = router;
