const express = require('express');
const Title = require('../models/title');
const router = express.Router();

router.get('/', async (req, res) => {
  const titles = await Title.find();
  res.json(titles);
});

router.get('/:id', async (req, res) => {
  const title = await Title.findById(req.params.id);
  if (!title) return res.status(404).send('Title not found');
  res.json(title);
});

router.post('/', async (req, res) => {
  const title = new Title(req.body);
  await title.save();
  res.status(201).json(title);
});

router.put('/:id', async (req, res) => {
  const title = await Title.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!title) return res.status(404).send('Title not found');
  res.json(title);
});

router.delete('/:id', async (req, res) => {
  await Title.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

module.exports = router;
