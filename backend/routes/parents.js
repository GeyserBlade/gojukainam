const express = require('express');
const Parent = require('../models/parent');
const router = express.Router();

router.get('/', async (req, res) => {
  const parents = await Parent.find();
  res.json(parents);
});

router.get('/:id', async (req, res) => {
  const parent = await Parent.findById(req.params.id);
  if (!parent) return res.status(404).send('Parent not found');
  res.json(parent);
});

router.post('/', async (req, res) => {
  const parent = new Parent(req.body);
  await parent.save();
  res.status(201).json(parent);
});

router.put('/:id', async (req, res) => {
  const parent = await Parent.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!parent) return res.status(404).send('Parent not found');
  res.json(parent);
});

router.delete('/:id', async (req, res) => {
  await Parent.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

module.exports = router;
