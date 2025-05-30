const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');


// Get all user names (first and last)
router.get('/names', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT first_name, last_name FROM users'
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});
// Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email_id = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Return minimal user info (omit password)
    res.status(200).json({
      user: {
        user_id: user.user_id,
        email: user.email_id,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});
// Signup Route
router.post('/signup', async (req, res) => {
    console.log('Received signup request:', req.body);
  const { firstName, lastName, email, password } = req.body;

  try {
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email_id = $1',
      [email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      'INSERT INTO users (first_name, last_name, email_id, password) VALUES ($1, $2, $3, $4) RETURNING *',
      [firstName, lastName, email, hashedPassword]
    );

    res.status(201).json({ user: newUser.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
