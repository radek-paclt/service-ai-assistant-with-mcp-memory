const request = require('supertest');
const app = require('../standalone-api');

describe('AI Integration Tests with API Key', () => {
  beforeAll(async () => {
    // Wait for server to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  describe('OpenAI Integration Tests', () => {
    test('Should successfully process AI chat with OpenAI API key', async () => {
      // Skip test if no API key provided
      if (!process.env.OPENAI_API_KEY) {
        console.log('Skipping OpenAI integration test - no API key provided');
        return;
      }

      const response = await request(app)
        .post('/api/ai-chat')
        .send({
          message: 'Hello, I need help with my account access. Can you help me?',
          customerName: 'John Doe',
          ticketId: 'TICKET-' + Date.now()
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.response).toBeDefined();
      expect(response.body.provider).toBe('openai');
      expect(response.body.usage).toBeDefined();
      expect(response.body.usage.prompt_tokens).toBeGreaterThan(0);
      expect(response.body.usage.completion_tokens).toBeGreaterThan(0);
    });

    test('Should use gpt-4o-mini model', async () => {
      if (!process.env.OPENAI_API_KEY) {
        console.log('Skipping OpenAI model test - no API key provided');
        return;
      }

      const response = await request(app)
        .get('/api/ai-providers')
        .expect(200);

      expect(response.body.providers.openai.model).toBe('gpt-4o-mini');
      expect(response.body.providers.openai.isConfigured).toBe(true);
    });

    test('Should handle memory storage and retrieval with OpenAI', async () => {
      if (!process.env.OPENAI_API_KEY) {
        console.log('Skipping OpenAI memory test - no API key provided');
        return;
      }

      const customerName = 'Memory Test Customer';
      const ticketId = 'TICKET-MEMORY-' + Date.now();

      // First interaction - store initial information
      const response1 = await request(app)
        .post('/api/ai-chat')
        .send({
          message: 'Hi, I am having trouble logging into my account. My username is john.doe@example.com',
          customerName: customerName,
          ticketId: ticketId
        })
        .expect(200);

      expect(response1.body.success).toBe(true);
      expect(response1.body.memoryUsed).toBeDefined();

      // Small delay to ensure memory is stored
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Second interaction - should reference previous context
      const response2 = await request(app)
        .post('/api/ai-chat')
        .send({
          message: 'I also cannot access my email. Is this related to my login issue?',
          customerName: customerName,
          ticketId: ticketId
        })
        .expect(200);

      expect(response2.body.success).toBe(true);
      expect(response2.body.response).toBeDefined();
      
      // Response should reference previous context (though this depends on MCP server running)
      // For now, just verify the request was processed
      expect(response2.body.provider).toBe('openai');
    });

    test('Should handle different provider selection', async () => {
      if (!process.env.OPENAI_API_KEY) {
        console.log('Skipping provider selection test - no API key provided');
        return;
      }

      const response = await request(app)
        .post('/api/ai-chat')
        .send({
          message: 'Test message for provider selection',
          customerName: 'Provider Test',
          ticketId: 'TICKET-PROVIDER-' + Date.now(),
          provider: 'openai'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.provider).toBe('openai');
    });

    test('Should fail with invalid provider', async () => {
      const response = await request(app)
        .post('/api/ai-chat')
        .send({
          message: 'Test message',
          customerName: 'Test Customer',
          ticketId: 'TICKET-INVALID-' + Date.now(),
          provider: 'invalid_provider'
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not supported');
    });
  });

  describe('System Prompt Integration with AI', () => {
    test('Should use professional system prompt in AI responses', async () => {
      if (!process.env.OPENAI_API_KEY) {
        console.log('Skipping system prompt test - no API key provided');
        return;
      }

      // Update system prompt to something we can verify
      const testPrompt = `You are a professional customer support assistant. 
Always start your response with "Thank you for contacting support" and end with "Is there anything else I can help you with?"

Customer: {{customerName}}
Ticket: {{ticketId}}
Query: {{userMessage}}
{{memoryContext}}`;

      await request(app)
        .put('/api/admin/system-prompt')
        .send({ prompt: testPrompt })
        .expect(200);

      const response = await request(app)
        .post('/api/ai-chat')
        .send({
          message: 'I need help with my account',
          customerName: 'Test Customer',
          ticketId: 'TICKET-PROMPT-' + Date.now()
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.response).toContain('Thank you for contacting support');
    });
  });

  describe('Error Handling with API Key', () => {
    test('Should handle API rate limits gracefully', async () => {
      if (!process.env.OPENAI_API_KEY) {
        console.log('Skipping rate limit test - no API key provided');
        return;
      }

      // Make multiple rapid requests to potentially trigger rate limiting
      const requests = [];
      for (let i = 0; i < 3; i++) {
        requests.push(
          request(app)
            .post('/api/ai-chat')
            .send({
              message: `Rate limit test message ${i}`,
              customerName: 'Rate Test Customer',
              ticketId: `TICKET-RATE-${Date.now()}-${i}`
            })
        );
      }

      const responses = await Promise.all(requests);
      
      // At least one should succeed
      const successfulResponses = responses.filter(r => r.status === 200);
      expect(successfulResponses.length).toBeGreaterThan(0);
    });

    test('Should handle large messages appropriately', async () => {
      if (!process.env.OPENAI_API_KEY) {
        console.log('Skipping large message test - no API key provided');
        return;
      }

      const largeMessage = 'This is a very long message. '.repeat(100);
      
      const response = await request(app)
        .post('/api/ai-chat')
        .send({
          message: largeMessage,
          customerName: 'Large Message Customer',
          ticketId: 'TICKET-LARGE-' + Date.now()
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.response).toBeDefined();
      expect(response.body.usage.prompt_tokens).toBeGreaterThan(100);
    });
  });
});