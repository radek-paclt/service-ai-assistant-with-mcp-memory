const { Client } = require('pg');

async function resetDatabase() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres'
  });

  try {
    await client.connect();
    
    // Drop and recreate database
    await client.query('DROP DATABASE IF EXISTS service_ai_assistant');
    await client.query('CREATE DATABASE service_ai_assistant');
    
    console.log('✅ Database reset successfully');
  } catch (error) {
    console.error('❌ Error resetting database:', error);
  } finally {
    await client.end();
  }
}

resetDatabase();