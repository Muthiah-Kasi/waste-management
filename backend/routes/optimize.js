const express = require('express');
const router = express.Router();
const { pool } = require('../db');

/**
 * GET /optimize
 * Optimization logic:
 *   1. Filter bins with fill_level > 70%
 *   2. Assign priority: >85 = HIGH, 70–85 = MEDIUM
 *   3. Sort by priority (HIGH first) then by fill_level descending
 *   4. Round-robin assign to available trucks
 *   5. Return routes: Truck1 → Bin3 → Bin7
 */
router.get('/', async (req, res) => {
  try {
    // Get bins that need collection (fill_level > 70)
    const binsResult = await pool.query(
      'SELECT * FROM bins WHERE fill_level > 70 ORDER BY fill_level DESC'
    );

    // Get all available trucks
    const trucksResult = await pool.query(
      'SELECT * FROM trucks ORDER BY id'
    );

    const urgentBins = binsResult.rows;
    const trucks = trucksResult.rows;

    if (trucks.length === 0) {
      return res.json({
        message: 'No trucks available',
        routes: [],
        tasks: [],
      });
    }

    if (urgentBins.length === 0) {
      return res.json({
        message: 'All bins are below threshold. No collection needed.',
        routes: [],
        tasks: [],
      });
    }

    // Assign priority labels
    const prioritizedBins = urgentBins.map((bin) => ({
      ...bin,
      priority: bin.fill_level > 85 ? 'HIGH' : 'MEDIUM',
    }));

    // Sort: HIGH priority first, then by fill_level descending
    prioritizedBins.sort((a, b) => {
      if (a.priority === 'HIGH' && b.priority !== 'HIGH') return -1;
      if (a.priority !== 'HIGH' && b.priority === 'HIGH') return 1;
      return b.fill_level - a.fill_level;
    });

    // Round-robin assign bins to trucks
    const routeMap = {};
    trucks.forEach((truck) => {
      routeMap[truck.id] = {
        truck_id: truck.id,
        truck_name: truck.name,
        bins: [],
      };
    });

    const tasks = [];

    prioritizedBins.forEach((bin, index) => {
      const truck = trucks[index % trucks.length];
      routeMap[truck.id].bins.push({
        bin_id: bin.id,
        location: bin.location,
        fill_level: bin.fill_level,
        priority: bin.priority,
      });

      tasks.push({
        truck_id: truck.id,
        truck_name: truck.name,
        bin_id: bin.id,
        bin_location: bin.location,
        priority: bin.priority,
        fill_level: bin.fill_level,
      });
    });

    // Build human-readable route strings
    const routes = Object.values(routeMap)
      .filter((route) => route.bins.length > 0)
      .map((route) => {
        const binStops = route.bins
          .map((b) => `Bin${b.bin_id} (${b.location})`)
          .join(' → ');
        return {
          truck: route.truck_name,
          route: `${route.truck_name} → ${binStops}`,
          stops: route.bins,
        };
      });

    // Persist collection tasks to database
    await pool.query("DELETE FROM collection_tasks WHERE status = 'PENDING'");

    for (const task of tasks) {
      await pool.query(
        `INSERT INTO collection_tasks (truck_id, bin_id, priority, status, scheduled_time)
         VALUES ($1, $2, $3, 'PENDING', NOW())`,
        [task.truck_id, task.bin_id, task.priority]
      );
    }

    res.json({
      message: `Optimized ${urgentBins.length} bin(s) across ${routes.length} truck(s)`,
      total_urgent_bins: urgentBins.length,
      routes,
      tasks,
    });
  } catch (err) {
    console.error('Error optimizing routes:', err.message);
    res.status(500).json({ error: 'Failed to optimize routes' });
  }
});

module.exports = router;
