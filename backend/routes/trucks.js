const express = require('express');
const router = express.Router();
const { pool } = require('../db');

/**
 * GET /trucks
 * Returns all trucks ordered by id.
 */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM trucks ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching trucks:', err.message);
    res.status(500).json({ error: 'Failed to fetch trucks' });
  }
});

module.exports = router;
