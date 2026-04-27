const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

/**
 * Initialize database tables and seed sample data if empty.
 */
async function initDB() {
  const client = await pool.connect();
  try {
    // Create tables if they don't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS bins (
        id SERIAL PRIMARY KEY,
        location TEXT NOT NULL,
        fill_level INT DEFAULT 0 CHECK (fill_level >= 0 AND fill_level <= 100),
        last_updated TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS trucks (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        capacity INT NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS collection_tasks (
        id SERIAL PRIMARY KEY,
        truck_id INT REFERENCES trucks(id),
        bin_id INT REFERENCES bins(id),
        priority TEXT,
        status TEXT DEFAULT 'PENDING',
        scheduled_time TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS bin_history (
        id SERIAL PRIMARY KEY,
        bin_id INT,
        fill_level INT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed sample data only if tables are empty
    const binsCount = await client.query('SELECT COUNT(*) FROM bins');
    if (parseInt(binsCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO bins (location, fill_level) VALUES
          ('Main Street & 1st Ave', 45),
          ('Central Park Entrance', 78),
          ('Downtown Market Square', 92),
          ('Riverside Walk South', 30),
          ('University Campus Gate', 65),
          ('City Hospital East Wing', 88),
          ('Train Station Platform 2', 55),
          ('Shopping Mall North Exit', 15),
          ('Tech Park Block A', 73),
          ('Sports Complex Lot B', 40)
      `);
      console.log('✅ Seeded 10 sample bins');
    }

    const trucksCount = await client.query('SELECT COUNT(*) FROM trucks');
    if (parseInt(trucksCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO trucks (name, capacity) VALUES
          ('Truck Alpha', 500),
          ('Truck Bravo', 450),
          ('Truck Charlie', 600)
      `);
      console.log('✅ Seeded 3 sample trucks');
    }

    console.log('✅ Database initialized successfully');
  } catch (err) {
    console.error('❌ Database initialization error:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, initDB };
