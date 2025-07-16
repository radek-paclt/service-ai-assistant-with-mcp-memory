const { DataSource } = require('typeorm');
const path = require('path');

let appDataSource = null;

const createDataSource = (isTest = false) => {
  const database = isTest ? 'service_ai_assistant_test' : 'service_ai_assistant';
  
  return new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: database,
    synchronize: true, // Auto-create tables from entities
    logging: process.env.NODE_ENV === 'development' && !isTest,
    entities: [
      require('../entities/User').User,
      require('../entities/SystemConfig').SystemConfig
    ],
    dropSchema: isTest, // Drop schema before each test run
  });
};

const getDataSource = async (isTest = false) => {
  if (!appDataSource || !appDataSource.isInitialized) {
    appDataSource = createDataSource(isTest);
    await appDataSource.initialize();
    console.log(`✅ Database connected: ${appDataSource.options.database}`);
  }
  return appDataSource;
};

const closeDataSource = async () => {
  if (appDataSource && appDataSource.isInitialized) {
    await appDataSource.destroy();
    appDataSource = null;
    console.log('✅ Database connection closed');
  }
};

module.exports = {
  getDataSource,
  closeDataSource,
  createDataSource
};