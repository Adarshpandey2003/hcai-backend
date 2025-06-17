const express = require('express');
const router = express.Router();
const pool = require('../db');

// 📥 POST /api/advice
router.post('/', async (req, res) => {
  const { disease_id, advice } = req.body;

  if (!disease_id || !advice) {
    return res.status(400).json({ error: 'Missing disease_id or advice' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO advice (disease_id, advice) VALUES ($1, $2) RETURNING *',
      [disease_id, advice]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /advice error:', err.message);
    res.status(500).send('Server error');
  }
});

// 📤 GET /api/advice?disease_id=5
router.get('/', async (req, res) => {
  const diseaseId = req.query.disease_id;

  if (!diseaseId) {
    return res.status(400).json({ error: 'Missing disease_id in query' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM advice WHERE disease_id = $1',
      [diseaseId]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('GET /advice error:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
