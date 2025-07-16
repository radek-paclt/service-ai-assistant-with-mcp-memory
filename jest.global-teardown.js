const { Client } = require('pg');

module.exports = async () => {
  console.log('Cleaning up test database...');
  
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres'
  });

  try {
    await client.connect();
    
    // Drop test database
    await client.query('DROP DATABASE IF EXISTS service_ai_assistant_test');
    
    console.log('Test database cleaned up successfully');
  } catch (error) {
    console.error('Error cleaning up test database:', error);
  } finally {
    await client.end();
  }
};