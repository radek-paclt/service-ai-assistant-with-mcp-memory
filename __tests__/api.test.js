const request = require('supertest');
const app = require('../standalone-api');

describe('API Routes E2E Tests', () => {
  let testUserId;
  let authToken;

  beforeAll(async () => {
    // Wait for server to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  describe('Health & Status Routes', () => {
    test('GET /api/health should return 200', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.service).toBe('AI Service Assistant');
    });

    test('GET /api/status should return 200', async () => {
      const response = await request(app)
        .get('/api/status')
        .expect(200);

      expect(response.body.status).toBe('running');
      expect(response.body.service).toBe('AI Service Assistant Standalone API');
    });
  });

  describe('Database Routes', () => {
    test('GET /api/db-test should return database info', async () => {
      const response = await request(app)
        .get('/api/db-test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Database connection successful');
      expect(typeof response.body.userCount).toBe('number');
    });
  });

  describe('Authentication Routes', () => {
    test('POST /api/auth/login should fail with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });

    test('POST /api/auth/login should fail without credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Username and password are required');
    });

    test('POST /api/auth/login should succeed with admin credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'Admin123!@#'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.username).toBe('admin');
      expect(response.body.user.role).toBe('admin');
      
      testUserId = response.body.user.id;
    });
  });

  describe('AI Provider Routes', () => {
    test('GET /api/ai-providers should return provider status', async () => {
      const response = await request(app)
        .get('/api/ai-providers')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.current).toBe('openai');
      expect(response.body.providers).toHaveProperty('openai');
      expect(response.body.providers).toHaveProperty('anthropic');
      expect(response.body.providers).toHaveProperty('azure_openai');
    });

    test('Should show correct provider configuration status', async () => {
      const response = await request(app)
        .get('/api/ai-providers')
        .expect(200);

      if (process.env.OPENAI_API_KEY) {
        expect(response.body.providers.openai.isConfigured).toBe(true);
        console.log('✅ OpenAI provider is configured');
      } else {
        expect(response.body.providers.openai.isConfigured).toBe(false);
        console.log('⚠️  OpenAI provider is not configured');
      }
      
      // These should be false unless specifically configured
      expect(response.body.providers.anthropic.isConfigured).toBe(false);
      expect(response.body.providers.azure_openai.isConfigured).toBe(false);
    });
  });

  describe('System Configuration Routes', () => {
    test('GET /api/admin/system-prompt should return system prompt', async () => {
      const response = await request(app)
        .get('/api/admin/system-prompt')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.systemPrompt).toContain('professional customer support');
      expect(response.body.systemPrompt).toContain('{{customerName}}');
    });

    test('PUT /api/admin/system-prompt should update system prompt', async () => {
      const newPrompt = 'Test updated system prompt with {{customerName}} placeholder';
      
      const response = await request(app)
        .put('/api/admin/system-prompt')
        .send({ prompt: newPrompt })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('System prompt updated successfully');

      // Verify the update
      const getResponse = await request(app)
        .get('/api/admin/system-prompt')
        .expect(200);

      expect(getResponse.body.systemPrompt).toBe(newPrompt);
    });

    test('PUT /api/admin/system-prompt should fail without prompt', async () => {
      const response = await request(app)
        .put('/api/admin/system-prompt')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Prompt is required');
    });
  });

  describe('MCP Memory Routes', () => {
    test('GET /api/mcp-test should test MCP connection', async () => {
      const response = await request(app)
        .get('/api/mcp-test');

      // Should succeed if MCP server is running, otherwise fail gracefully
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.searchResult).toBeDefined();
        expect(response.body.storeResult).toBeDefined();
        console.log('✅ MCP server is running and connected');
      } else {
        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
        expect(response.body.mcpStatus).toBe('Failed to connect to MCP Memory Server');
        console.log('⚠️  MCP server not running - test passed gracefully');
      }
    });
  });

  describe('AI Chat Routes', () => {
    test('POST /api/ai-chat should handle API key configuration', async () => {
      const response = await request(app)
        .post('/api/ai-chat')
        .send({
          message: 'Hello, I need help with my account',
          customerName: 'John Doe',
          ticketId: 'TICKET-123'
        });

      if (process.env.OPENAI_API_KEY) {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.response).toBeDefined();
        console.log('✅ AI chat succeeded with API key');
      } else {
        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('not configured');
        console.log('✅ AI chat failed without API key');
      }
    });

    test('POST /api/ai-chat should fail with missing parameters', async () => {
      const response = await request(app)
        .post('/api/ai-chat')
        .send({
          message: 'Hello'
        })
        .expect(400);

      expect(response.body.error).toBe('message, customerName, and ticketId are required');
    });

    test('POST /api/ai-chat should fail with empty message', async () => {
      const response = await request(app)
        .post('/api/ai-chat')
        .send({
          message: '',
          customerName: 'John Doe',
          ticketId: 'TICKET-123'
        })
        .expect(400);

      expect(response.body.error).toBe('message, customerName, and ticketId are required');
    });
  });

  describe('Error Handling', () => {
    test('Should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body.error).toBe('Not found');
    });

    test('Should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(500);
        
      expect(response.body.error).toBe('Something went wrong!');
    });
  });
});