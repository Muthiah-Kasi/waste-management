const express = require('express');
const router = express.Router();
const { pool } = require('../db');

/**
 * GET /bins
 * Returns all bins ordered by id.
 */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM bins ORDER BY id'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching bins:', err.message);
    res.status(500).json({ error: 'Failed to fetch bins' });
  }
});

/**
 * POST /bins/update
 * Simulates IoT sensor updates — bins only increase or stay the same.
 * Bins are NEVER auto-reset; only /collect resets them.
 */
router.post('/update', async (req, res) => {
  try {
    const bins = await pool.query('SELECT id, fill_level FROM bins');

    for (const bin of bins.rows) {
      // 30% chance no change, 70% chance increase by 1–8
      const shouldIncrease = Math.random() < 0.7;
      if (!shouldIncrease) continue;

      const increase = Math.floor(Math.random() * 8) + 1;
      const newLevel = Math.min(100, bin.fill_level + increase);

      await pool.query(
        'UPDATE bins SET fill_level = $1, last_updated = NOW() WHERE id = $2',
        [newLevel, bin.id]
      );
      // Record history for EDA
      await pool.query(
        'INSERT INTO bin_history (bin_id, fill_level) VALUES ($1, $2)',
        [bin.id, newLevel]
      );
    }

    const updated = await pool.query('SELECT * FROM bins ORDER BY id');
    res.json({
      message: 'Bin levels updated (simulation)',
      bins: updated.rows,
    });
  } catch (err) {
    console.error('Error updating bins:', err.message);
    res.status(500).json({ error: 'Failed to update bin levels' });
  }
});

/**
 * POST /collect
 * Waste collection endpoint — resets fill_level to 0 for specified bins
 * and marks any pending collection tasks as COMPLETED.
 */
router.post('/collect', async (req, res) => {
  try {
    const { binIds } = req.body;

    if (!binIds || !Array.isArray(binIds) || binIds.length === 0) {
      return res.status(400).json({ error: 'binIds array is required' });
    }

    // Reset fill levels to 0
    const placeholders = binIds.map((_, i) => `$${i + 1}`).join(', ');
    await pool.query(
      `UPDATE bins SET fill_level = 0, last_updated = NOW() WHERE id IN (${placeholders})`,
      binIds
    );

    // Record collection in history for EDA
    for (const binId of binIds) {
      await pool.query(
        'INSERT INTO bin_history (bin_id, fill_level) VALUES ($1, 0)',
        [binId]
      );
    }

    // Mark pending collection tasks as COMPLETED for these bins
    await pool.query(
      `UPDATE collection_tasks SET status = 'COMPLETED' WHERE bin_id IN (${placeholders}) AND status = 'PENDING'`,
      binIds
    );

    const updated = await pool.query(
      `SELECT * FROM bins WHERE id IN (${placeholders}) ORDER BY id`,
      binIds
    );

    console.log(`🗑️ Collected waste from ${binIds.length} bin(s): [${binIds.join(', ')}]`);

    res.json({
      message: `Successfully collected waste from ${binIds.length} bin(s)`,
      collected_bins: updated.rows,
    });
  } catch (err) {
    console.error('Error collecting waste:', err.message);
    res.status(500).json({ error: 'Failed to collect waste' });
  }
});

module.exports = router;
