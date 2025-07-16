const { Client } = require('pg');

module.exports = async () => {
  console.log('Setting up test database...');
  
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres'
  });

  try {
    await client.connect();
    
    // Drop test database if exists
    await client.query('DROP DATABASE IF EXISTS service_ai_assistant_test');
    
    // Create test database
    await client.query('CREATE DATABASE service_ai_assistant_test');
    
    console.log('Test database created successfully');
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  } finally {
    await client.end();
  }
};