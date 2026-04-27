require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { initDB, pool } = require('./db');

const binsRouter = require('./routes/bins');
const trucksRouter = require('./routes/trucks');
const optimizeRouter = require('./routes/optimize');
const analysisRouter = require('./routes/analysis');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/bins', binsRouter);
app.use('/trucks', trucksRouter);
app.use('/optimize', optimizeRouter);
app.use('/analysis', analysisRouter);

// Health check
app.get('/', (req, res) => {
  res.json({
    service: 'Smart Waste Management API',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Auto-simulation: gradually increase bin fill levels every 10 seconds
 * to simulate real-world waste accumulation.
 */
function startSimulation() {
  setInterval(async () => {
    try {
      const bins = await pool.query('SELECT id, fill_level FROM bins');
      let updated = 0;

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
        updated++;
      }

      console.log(`🔄 [${new Date().toLocaleTimeString()}] Simulation: ${updated}/${bins.rows.length} bins updated`);
    } catch (err) {
      console.error('Simulation error:', err.message);
    }
  }, 10000);
}

// Start server
async function start() {
  try {
    await initDB();
    startSimulation();

    app.listen(PORT, () => {
      console.log(`\n🚀 Waste Management API running on http://localhost:${PORT}`);
      console.log(`📡 Simulation active (every 10s)\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

start();

