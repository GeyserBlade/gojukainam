const express = require('express');
const Family = require('../models/family');
const router = express.Router();

router.get('/', async (req, res) => {
  const families = await Family.find();
  res.json(families);
});

router.get('/:id', async (req, res) => {
  const family = await Family.findById(req.params.id);
  if (!family) return res.status(404).send('Family not found');
  res.json(family);
});

router.post('/', async (req, res) => {
  const family = new Family(req.body);
  await family.save();
  res.status(201).json(family);
});

router.put('/:id', async (req, res) => {
  const family = await Family.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!family) return res.status(404).send('Family not found');
  res.json(family);
});

router.delete('/:id', async (req, res) => {
  await Family.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

module.exports = router;
