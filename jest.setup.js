// Global test setup
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_USERNAME = 'postgres';
process.env.DB_PASSWORD = 'postgres';
process.env.DB_DATABASE = 'service_ai_assistant_test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.MCP_SERVER_URL = 'http://localhost:3000/mcp';
process.env.AI_PROVIDER = 'openai';
process.env.OPENAI_MODEL = 'gpt-4o-mini';

// Extend Jest timeout for E2E tests
jest.setTimeout(30000);