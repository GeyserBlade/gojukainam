const express = require('express');
const Dojo = require('../models/dojo');
const router = express.Router();

router.get('/', async (req, res) => {
  const dojos = await Dojo.find();
  res.json(dojos);
});

router.get('/:id', async (req, res) => {
  const dojo = await Dojo.findById(req.params.id);
  if (!dojo) return res.status(404).send('Dojo not found');
  res.json(dojo);
});

router.post('/', async (req, res) => {
  const dojo = new Dojo(req.body);
  await dojo.save();
  res.status(201).json(dojo);
});

router.put('/:id', async (req, res) => {
  const dojo = await Dojo.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!dojo) return res.status(404).send('Dojo not found');
  res.json(dojo);
});

router.delete('/:id', async (req, res) => {
  await Dojo.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

module.exports = router;
