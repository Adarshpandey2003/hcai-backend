const express = require('express');
const router = express.Router();
// const fetch = require('node-fetch'); // or global fetch in Node 18+

router.post('/', async (req, res) => {
  const { disease } = req.body;

  if (!disease) {
    return res.status(400).json({ error: 'Disease name required' });
  }

  const prompt = `You are a helpful medical assistant. Suggest safe and simple home remedies for ${disease}.`;

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama2',
        prompt: prompt,
        stream: false
      }),
    });

    const data = await response.json();
    res.status(200).json({ remedy: data.response });
  } catch (err) {
    console.error('LLaMA 2 error:', err.message);
    res.status(500).json({ error: 'Failed to get remedy from LLaMA 2' });
  }
});

module.exports = router;
