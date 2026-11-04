require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const dbName = process.env.PG_DATABASE || 'blurspot';
  const connBase = {
    host:     process.env.PG_HOST     || 'localhost',
    port:     parseInt(process.env.PG_PORT || '5432'),
    user:     process.env.PG_USER     || 'postgres',
    password: process.env.PG_PASSWORD || 'postgres'
  };

  // Step 1: connect to default 'postgres' db and create target db if missing
  const setup = new Client({ ...connBase, database: 'postgres' });
  await setup.connect();
  const exists = await setup.query(`SELECT 1 FROM pg_database WHERE datname 
    = $1`, [dbName]);
  if (exists.rows.length === 0) {
    await setup.query(`CREATE DATABASE "${dbName}"`);
    console.log(`✓ Database '${dbName}' created`);
  } else {
    console.log(`✓ Database '${dbName}' already exists`);
  }
  await setup.end();

  // Step 2: connect to target db and run migrations
  const client = new Client({ ...connBase, database: dbName });
  await client.connect();
  try {
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      console.log(`Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await client.query(sql);
      console.log(`✓ ${file} done`);
    }
    console.log('✓ All migrations complete');
  } finally {
    await client.end();
  }
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
