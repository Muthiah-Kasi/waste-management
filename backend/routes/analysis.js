const express = require('express');
const router = express.Router();
const { pool } = require('../db');

/**
 * GET /analysis
 * Exploratory Data Analysis endpoint.
 * Computes insights from bin_history table:
 *   - Most active bin (highest average fill level)
 *   - Overall average fill level
 *   - Number of critical events (fill_level > 70)
 */
router.get('/', async (req, res) => {
  try {
    // Most active bin: highest average fill_level
    const mostActiveResult = await pool.query(`
      SELECT bin_id, ROUND(AVG(fill_level)) as avg_fill
      FROM bin_history
      GROUP BY bin_id
      ORDER BY avg_fill DESC
      LIMIT 1
    `);

    // Overall average fill level across all history
    const avgFillResult = await pool.query(`
      SELECT ROUND(AVG(fill_level)) as average_fill
      FROM bin_history
    `);

    // Number of critical events (fill_level > 70)
    const criticalResult = await pool.query(`
      SELECT COUNT(*) as critical_events
      FROM bin_history
      WHERE fill_level > 70
    `);

    const mostActiveBin = mostActiveResult.rows.length > 0
      ? mostActiveResult.rows[0].bin_id
      : null;

    const averageFill = avgFillResult.rows[0]?.average_fill
      ? parseInt(avgFillResult.rows[0].average_fill)
      : 0;

    const criticalEvents = parseInt(criticalResult.rows[0]?.critical_events || 0);

    res.json({
      most_active_bin: mostActiveBin,
      average_fill: averageFill,
      critical_events: criticalEvents,
    });
  } catch (err) {
    console.error('Error computing analysis:', err.message);
    res.status(500).json({ error: 'Failed to compute analysis' });
  }
});

module.exports = router;
