import { DataSource } from 'typeorm';
import { User } from './entities/User';
import { SystemConfig } from './entities/SystemConfig';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'service_ai_assistant',
  synchronize: true, // Auto-create tables from entities
  logging: process.env.NODE_ENV === 'development',
  entities: [User, SystemConfig],
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'migrations',
});

export const TestDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'service_ai_assistant_test',
  synchronize: true, // Auto-create tables from entities
  logging: false,
  entities: [User, SystemConfig],
  dropSchema: true, // Drop schema before each test run
});