const request = require('supertest');
const app = require('../standalone-api');

describe('AI Integration Tests', () => {
  beforeAll(async () => {
    // Wait for server to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  describe('AI Provider Configuration', () => {
    test('Should have OpenAI provider configured for gpt-4o-mini', async () => {
      const response = await request(app)
        .get('/api/ai-providers')
        .expect(200);

      expect(response.body.providers.openai.provider).toBe('openai');
      expect(response.body.providers.openai.model).toBe('gpt-4o-mini');
    });

    test('Should successfully process AI chat with API key', async () => {
      if (!process.env.OPENAI_API_KEY) {
        console.log('Skipping AI chat test - no API key provided');
        return;
      }

      const response = await request(app)
        .post('/api/ai-chat')
        .send({
          message: 'Hello, I need help',
          customerName: 'Test Customer',
          ticketId: 'TICKET-123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.response).toBeDefined();
      expect(response.body.provider).toBe('openai');
      expect(response.body.usage).toBeDefined();
    });

    test('Should support provider switching', async () => {
      const response = await request(app)
        .post('/api/ai-chat')
        .send({
          message: 'Hello, I need help',
          customerName: 'Test Customer',
          ticketId: 'TICKET-123',
          provider: 'anthropic'
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Provider anthropic is not configured');
    });
  });

  describe('System Prompt Integration', () => {
    test('Should use configurable system prompt', async () => {
      const customPrompt = 'You are a test assistant. Customer: {{customerName}}, Ticket: {{ticketId}}, Query: {{userMessage}}. Memory: {{memoryContext}}';
      
      // Update system prompt
      await request(app)
        .put('/api/admin/system-prompt')
        .send({ prompt: customPrompt })
        .expect(200);

      // Verify the prompt was updated
      const getResponse = await request(app)
        .get('/api/admin/system-prompt')
        .expect(200);

      expect(getResponse.body.systemPrompt).toBe(customPrompt);
    });

    test('Should replace placeholders in system prompt', async () => {
      const { getConfigService } = require('../src/lib/config/config-service.js');
      const configService = getConfigService();
      
      // Set a test prompt with placeholders
      const testPrompt = 'Customer: {{customerName}}, Ticket: {{ticketId}}, Message: {{userMessage}}, Memory: {{memoryContext}}';
      await configService.setSystemPrompt(testPrompt);

      const { getAIService } = require('../src/lib/ai/ai-service.js');
      const aiService = getAIService();
      
      // Mock MCP client
      const mockMCPClient = {
        searchMemories: jest.fn().mockResolvedValue({
          success: true,
          data: [{ text: JSON.stringify([{ content: 'Previous interaction' }]) }]
        }),
        storeMemory: jest.fn().mockResolvedValue({ success: true })
      };

      // Mock provider
      const mockProvider = {
        isConfigured: jest.fn().mockResolvedValue(true),
        sendMessage: jest.fn().mockResolvedValue({
          content: 'Test response',
          usage: { prompt_tokens: 10, completion_tokens: 20 }
        })
      };

      // Mock dependencies
      const originalGetMCPClient = require('../mcp-client.js').getMCPClient;
      require('../mcp-client.js').getMCPClient = jest.fn().mockResolvedValue(mockMCPClient);
      
      const originalGetCurrentProvider = aiService.getCurrentProvider;
      aiService.getCurrentProvider = jest.fn().mockResolvedValue(mockProvider);

      await aiService.chatWithMemory(
        'Test message',
        'John Doe',
        'TICKET-456'
      );

      // Check that sendMessage was called with properly replaced placeholders
      expect(mockProvider.sendMessage).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: expect.stringContaining('Customer: John Doe')
          })
        ]),
        {}
      );

      // Restore mocks
      require('../mcp-client.js').getMCPClient = originalGetMCPClient;
      aiService.getCurrentProvider = originalGetCurrentProvider;
    });
  });

  describe('Memory Context Integration', () => {
    test('Should include memory context in system prompt', async () => {
      const { getAIService } = require('../src/lib/ai/ai-service.js');
      const aiService = getAIService();
      
      // Mock MCP client with memory data
      const mockMCPClient = {
        searchMemories: jest.fn().mockResolvedValue({
          success: true,
          data: [{ text: JSON.stringify([
            { content: 'Customer previously had login issues' },
            { content: 'Password was reset on 2024-01-15' }
          ]) }]
        }),
        storeMemory: jest.fn().mockResolvedValue({ success: true })
      };

      // Mock provider
      const mockProvider = {
        isConfigured: jest.fn().mockResolvedValue(true),
        sendMessage: jest.fn().mockResolvedValue({
          content: 'Based on your history, I can help with login issues.',
          usage: { prompt_tokens: 15, completion_tokens: 25 }
        })
      };

      // Mock dependencies
      const originalGetMCPClient = require('../mcp-client.js').getMCPClient;
      require('../mcp-client.js').getMCPClient = jest.fn().mockResolvedValue(mockMCPClient);
      
      const originalGetCurrentProvider = aiService.getCurrentProvider;
      aiService.getCurrentProvider = jest.fn().mockResolvedValue(mockProvider);

      await aiService.chatWithMemory(
        'I cannot login to my account',
        'Jane Smith',
        'TICKET-789'
      );

      // Verify memory was searched
      expect(mockMCPClient.searchMemories).toHaveBeenCalledWith(
        'I cannot login to my account',
        'Jane Smith',
        'TICKET-789'
      );

      // Verify system prompt includes memory context
      const systemPromptCall = mockProvider.sendMessage.mock.calls[0][0][0];
      expect(systemPromptCall.content).toContain('Customer previously had login issues');
      expect(systemPromptCall.content).toContain('Password was reset on 2024-01-15');

      // Restore mocks
      require('../mcp-client.js').getMCPClient = originalGetMCPClient;
      aiService.getCurrentProvider = originalGetCurrentProvider;
    });
  });

  describe('Error Handling', () => {
    test('Should handle MCP connection failures gracefully', async () => {
      const { getAIService } = require('../src/lib/ai/ai-service.js');
      const aiService = getAIService();
      
      // Mock MCP client that fails
      const mockMCPClient = {
        searchMemories: jest.fn().mockRejectedValue(new Error('MCP connection failed')),
        storeMemory: jest.fn().mockRejectedValue(new Error('MCP connection failed'))
      };

      // Mock provider
      const mockProvider = {
        isConfigured: jest.fn().mockResolvedValue(true),
        sendMessage: jest.fn().mockResolvedValue({
          content: 'I can help you without accessing previous context.',
          usage: { prompt_tokens: 10, completion_tokens: 15 }
        })
      };

      // Mock dependencies
      const originalGetMCPClient = require('../mcp-client.js').getMCPClient;
      require('../mcp-client.js').getMCPClient = jest.fn().mockResolvedValue(mockMCPClient);
      
      const originalGetCurrentProvider = aiService.getCurrentProvider;
      aiService.getCurrentProvider = jest.fn().mockResolvedValue(mockProvider);

      let chatError;
      try {
        await aiService.chatWithMemory(
          'I need help',
          'Test Customer',
          'TICKET-ERROR'
        );
      } catch (error) {
        chatError = error;
      }

      // Should fail due to MCP error
      expect(chatError).toBeDefined();
      expect(chatError.message).toContain('MCP connection failed');

      // Restore mocks
      require('../mcp-client.js').getMCPClient = originalGetMCPClient;
      aiService.getCurrentProvider = originalGetCurrentProvider;
    });

    test('Should handle AI provider failures gracefully', async () => {
      const { getAIService } = require('../src/lib/ai/ai-service.js');
      const aiService = getAIService();
      
      // Mock MCP client
      const mockMCPClient = {
        searchMemories: jest.fn().mockResolvedValue({ success: true, data: [] }),
        storeMemory: jest.fn().mockResolvedValue({ success: true })
      };

      // Mock provider that fails
      const mockProvider = {
        isConfigured: jest.fn().mockResolvedValue(true),
        sendMessage: jest.fn().mockRejectedValue(new Error('AI provider API error'))
      };

      // Mock dependencies
      const originalGetMCPClient = require('../mcp-client.js').getMCPClient;
      require('../mcp-client.js').getMCPClient = jest.fn().mockResolvedValue(mockMCPClient);
      
      const originalGetCurrentProvider = aiService.getCurrentProvider;
      aiService.getCurrentProvider = jest.fn().mockResolvedValue(mockProvider);

      let chatError;
      try {
        await aiService.chatWithMemory(
          'I need help',
          'Test Customer',
          'TICKET-AI-ERROR'
        );
      } catch (error) {
        chatError = error;
      }

      // Should fail due to AI provider error
      expect(chatError).toBeDefined();
      expect(chatError.message).toContain('AI provider API error');

      // Restore mocks
      require('../mcp-client.js').getMCPClient = originalGetMCPClient;
      aiService.getCurrentProvider = originalGetCurrentProvider;
    });
  });
});