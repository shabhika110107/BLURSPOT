require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./pool');
const bcrypt = require('bcryptjs');

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Seed authorities
    const authorities = [
      { username: 'authority1', password: 'auth123', department: 'roads',       location: 'Tamil Nadu', name: 'Roads Authority' },
      { username: 'authority2', password: 'auth123', department: 'water',       location: 'Tamil Nadu', name: 'Water Authority' },
      { username: 'authority3', password: 'auth123', department: 'sanitation',  location: 'Tamil Nadu', name: 'Sanitation Authority' },
      { username: 'authority4', password: 'auth123', department: 'electricity', location: 'Tamil Nadu', name: 'Electricity Authority' }
    ];

    for (const auth of authorities) {
      const hash = await bcrypt.hash(auth.password, 10);
      await client.query(
        `INSERT INTO authorities (username, password_hash, name, department, location)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (username) DO NOTHING`,
        [auth.username, hash, auth.name, auth.department, auth.location]
      );
    }
    console.log('✓ Authorities seeded');

    // Seed sample user
    const userHash = await bcrypt.hash('password123', 10);
    await client.query(
      `INSERT INTO users (name, email, phone, address, password_hash, role, verified, karma)
       VALUES ($1, $2, $3, $4, $5, 'user', true, 0)
       ON CONFLICT (email) DO NOTHING`,
      ['Test User', 'testuser@blurspot.com', '+919999999999', 'Tamil Nadu, India', userHash]
    );
    console.log('✓ Sample user seeded (testuser@blurspot.com / password123)');

    await client.query('COMMIT');
    console.log('✓ Seed complete');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(() => process.exit(1));
