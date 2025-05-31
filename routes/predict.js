const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');

// Native fetch is available in Node 18+
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

router.post('/', async (req, res) => {
  const symptoms = req.body.symptoms;

  if (!symptoms || typeof symptoms !== 'object') {
    return res.status(400).json({ error: 'Missing or invalid symptoms object' });
  }

  const py = spawn('python', ['predict_disease.py']);
  let result = '';
  let errorOutput = '';

  py.stdout.on('data', chunk => result += chunk.toString());
  py.stderr.on('data', err => errorOutput += err.toString());

  py.stdin.write(JSON.stringify({ symptoms }));
  py.stdin.end();

  py.on('close', async (code) => {
    if (code !== 0 || errorOutput) {
      console.error('Python Error:', errorOutput);
      return res.status(500).json({ error: 'Prediction failed' });
    }

    let predicted;
    try {
      const parsed = JSON.parse(result);
      predicted = parsed.disease;
    } catch (err) {
      console.error('Parsing error:', result);
      return res.status(500).json({ error: 'Invalid response from model' });
    }

    // Send POST to /api/remedy with the disease
    try {
      const remedyResponse = await fetch('http://localhost:5000/api/remedies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disease: predicted })
      });

      const remedyData = await remedyResponse.json();

      res.json({
        disease: predicted,
        remedy: remedyData.remedy || 'No remedy found.'
      });
    } catch (err) {
      console.error('Failed to fetch remedy:', err);
      res.status(500).json({ disease: predicted, remedy: 'Failed to fetch remedy' });
    }
  });
});

module.exports = router;
