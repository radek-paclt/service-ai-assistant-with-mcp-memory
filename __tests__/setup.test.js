const { getDataSource } = require('../src/lib/database');

// Helper function to setup test database
async function setupDatabase() {
  const dataSource = await getDataSource(true); // true = test mode
  console.log('✅ Test database setup with TypeORM');
  return dataSource;
}

let testDataSource;

// Setup test database
beforeAll(async () => {
  testDataSource = await setupDatabase();
});

describe('Database Setup', () => {
  test('should connect to test database', async () => {
    expect(testDataSource.isInitialized).toBe(true);
    expect(testDataSource.options.database).toBe('service_ai_assistant_test');
  });

  test('should have User entity', async () => {
    const userRepository = testDataSource.getRepository('User');
    expect(userRepository).toBeDefined();
    
    // Test that we can create a user
    const testUser = userRepository.create({
      username: 'testuser',
      passwordHash: 'hashedpassword',
      role: 'user'
    });
    
    expect(testUser.username).toBe('testuser');
  });

  test('should have SystemConfig entity', async () => {
    const configRepository = testDataSource.getRepository('SystemConfig');
    expect(configRepository).toBeDefined();
    
    // Test that we can create a config
    const testConfig = configRepository.create({
      type: 'test_config',
      content: 'test content',
      description: 'test description'
    });
    
    expect(testConfig.type).toBe('test_config');
  });
});