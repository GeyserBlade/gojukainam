const express = require('express');
const Grade = require('../models/grade');
const router = express.Router();

router.get('/', async (req, res) => {
  const grades = await Grade.find();
  res.json(grades);
});

router.get('/:id', async (req, res) => {
  const grade = await Grade.findById(req.params.id);
  if (!grade) return res.status(404).send('Grade not found');
  res.json(grade);
});

router.post('/', async (req, res) => {
  const grade = new Grade(req.body);
  await grade.save();
  res.status(201).json(grade);
});

router.put('/:id', async (req, res) => {
  const grade = await Grade.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!grade) return res.status(404).send('Grade not found');
  res.json(grade);
});

router.delete('/:id', async (req, res) => {
  await Grade.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

module.exports = router;
