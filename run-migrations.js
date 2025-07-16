const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const dbConfig = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'service_ai_assistant'
};

async function runMigrations() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    const migrationDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      const migrationPath = path.join(migrationDir, file);
      const migration = fs.readFileSync(migrationPath, 'utf8');
      
      console.log(`Running migration: ${file}`);
      await client.query(migration);
      console.log(`✅ Migration ${file} completed`);
    }
    
    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();