const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const pool = require('../db');

// Native fetch is available in Node 18+
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

router.post('/', async (req, res) => {
  const { symptoms, user_id } = req.body;

  if (!symptoms || typeof symptoms !== 'object' || !user_id) {
    return res.status(400).json({ error: 'Missing or invalid symptoms or user_id' });
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
      const parsed = JSON.parse(result.trim());
      predicted = parsed.disease;
    } catch (err) {
      console.error('Parsing error:', result);
      return res.status(500).json({ error: 'Invalid response from model' });
    }

    // STEP 2: Generate remedy via LLaMA/Gemini
    let remedy = '';
    try {
      const remedyResponse = await fetch('http://localhost:5000/api/remedies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disease: predicted })
      });

      const remedyData = await remedyResponse.json();
      remedy = remedyData.remedy || 'No remedy found.';
    } catch (err) {
      console.error('Failed to fetch remedy:', err);
      remedy = 'Failed to generate remedy';
    }

    try {
      // STEP 3: Insert into disease table
      const diseaseInsert = await pool.query(
        'INSERT INTO disease (user_id, disease_name) VALUES ($1, $2) RETURNING disease_id',
        [user_id, predicted]
      );
      const diseaseId = diseaseInsert.rows[0].disease_id;

      // STEP 4: Insert into advice table
      await pool.query(
        'INSERT INTO advice (disease_id, advice) VALUES ($1, $2)',
        [diseaseId, remedy]
      );

      // Final response
      res.status(200).json({
        disease: predicted,
        remedy: remedy
      });
    } catch (err) {
      console.error('Database insert error:', err.message);
      res.status(500).json({ error: 'Failed to store prediction and remedy' });
    }
  });
});

module.exports = router;
