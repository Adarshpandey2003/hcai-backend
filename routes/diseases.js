const express = require('express');
const router = express.Router();
const pool = require('../db');

// 🔍 GET /api/disease?user_id=10
// Fetch all disease_name entries for a given user_id
router.get('/', async (req, res) => {
  const userId = req.query.user_id;

  if (!userId) {
    return res.status(400).json({ error: 'Missing user_id in query' });
  }

  try {
    const result = await pool.query(
      'SELECT disease_id,disease_name FROM disease WHERE user_id = $1',
      [userId]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('GET /disease error:', err.message);
    res.status(500).send('Server error');
  }
});

// ➕ POST /api/disease
// Body: { "user_id": 10, "disease_name": "Malaria" }
router.post('/', async (req, res) => {
  const { user_id, disease_name } = req.body;

  if (!user_id || !disease_name) {
    return res.status(400).json({ error: 'Missing user_id or disease_name' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO disease (user_id, disease_name) VALUES ($1, $2) RETURNING *',
      [user_id, disease_name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /disease error:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;

