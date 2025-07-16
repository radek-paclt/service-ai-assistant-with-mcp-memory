const request = require('supertest');

describe('Tests without API key', () => {
  describe('AI Provider Tests without API Keys', () => {
    test('Should show providers configuration status correctly', async () => {
      const app = require('../standalone-api');
      const response = await request(app)
        .get('/api/ai-providers')
        .expect(200);

      // Test should pass regardless of API key presence
      if (process.env.OPENAI_API_KEY) {
        expect(response.body.providers.openai.isConfigured).toBe(true);
        console.log('✅ OpenAI provider is configured');
      } else {
        expect(response.body.providers.openai.isConfigured).toBe(false);
        console.log('✅ OpenAI provider is not configured');
      }
      
      // These should remain false unless specifically configured
      expect(response.body.providers.anthropic.isConfigured).toBe(false);
      expect(response.body.providers.azure_openai.isConfigured).toBe(false);
    });

    test('Should handle AI chat based on API key availability', async () => {
      const app = require('../standalone-api');
      const response = await request(app)
        .post('/api/ai-chat')
        .send({
          message: 'Hello, I need help',
          customerName: 'Test Customer',
          ticketId: 'TICKET-123'
        });

      if (process.env.OPENAI_API_KEY) {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        console.log('✅ AI chat succeeded with API key');
      } else {
        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('not configured');
        console.log('✅ AI chat failed without API key');
      }
    });

    test('Should fail with unconfigured provider selection', async () => {
      const app = require('../standalone-api');
      const response = await request(app)
        .post('/api/ai-chat')
        .send({
          message: 'Test message',
          customerName: 'Test Customer',
          ticketId: 'TICKET-ANTHROPIC',
          provider: 'anthropic'
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not configured');
      console.log('✅ Anthropic provider correctly shows as not configured');
    });
  });
});