const express = require('express');
const router = express.Router();
const { pool } = require('../db');

/**
 * POST /iot/data
 * Receives real-time sensor data from ESP32 devices.
 *
 * Expected payload:
 *   { "device_id": "bin_1", "fill_level": 78 }
 *
 * Extracts bin ID from device_id (e.g. "bin_1" → 1),
 * updates the corresponding row in the bins table.
 */
router.post('/data', async (req, res) => {
  try {
    const { device_id, fill_level } = req.body;

    // Validate payload
    if (!device_id || fill_level === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: device_id and fill_level',
      });
    }

    // Extract numeric bin ID from device_id (e.g. "bin_1" → 1, "bin_12" → 12)
    const match = device_id.match(/(\d+)$/);
    if (!match) {
      return res.status(400).json({
        error: `Invalid device_id format: "${device_id}". Expected format: bin_<number>`,
      });
    }

    const binId = parseInt(match[1], 10);
    const level = Math.max(0, Math.min(100, parseInt(fill_level, 10)));

    // Update the bin in the database
    const result = await pool.query(
      'UPDATE bins SET fill_level = $1, last_updated = NOW() WHERE id = $2 RETURNING *',
      [level, binId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: `Bin with id ${binId} not found`,
      });
    }

    const updatedBin = result.rows[0];

    // Log incoming sensor data
    console.log(
      `📡 [${new Date().toLocaleTimeString()}] IoT DATA ← ` +
      `device: ${device_id} | bin_id: ${binId} | fill: ${level}% | ` +
      `status: ${level > 85 ? 'HIGH PRIORITY' : level > 70 ? 'CRITICAL' : level >= 50 ? 'WARNING' : 'NORMAL'}`
    );

    res.json({
      message: 'Sensor data received successfully',
      bin: updatedBin,
    });
  } catch (err) {
    console.error('IoT data error:', err.message);
    res.status(500).json({ error: 'Failed to process sensor data' });
  }
});

module.exports = router;
