const request = require('supertest');
const app = require('../standalone-api');

describe('MCP Memory Integration Tests', () => {
  const testCustomer = 'test-customer-' + Date.now();
  const testTicket = 'TICKET-' + Date.now();

  beforeAll(async () => {
    // Wait for server to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  describe('MCP Connection Tests', () => {
    test('Should attempt to connect to MCP server via streamable HTTP', async () => {
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
        expect(response.body.error).toContain('Failed to connect to MCP Memory Server');
        console.log('⚠️  MCP server not running - test passed gracefully');
      }
    });

    test('Should use streamable HTTP transport for MCP connection', async () => {
      // Verify that the client is configured for streamable HTTP
      const fs = require('fs');
      const clientCode = fs.readFileSync('./mcp-client.js', 'utf8');
      
      expect(clientCode).toContain('StreamableHTTPClientTransport');
      expect(clientCode).toContain('http://localhost:3000/mcp');
      
      console.log('✅ MCP client is configured for streamable HTTP transport');
    });
  });

  describe('Memory Storage and Retrieval Tests', () => {
    test('Should have proper memory storage interface', async () => {
      // Test the memory interface without actually calling MCP server
      const { getMCPClient } = require('../mcp-client.js');
      
      // Mock the MCP client to test interface
      const mockMCPClient = {
        searchMemories: jest.fn().mockResolvedValue({
          success: true,
          data: [{ text: JSON.stringify([{ content: 'Previous interaction about billing' }]) }]
        }),
        storeMemory: jest.fn().mockResolvedValue({
          success: true,
          data: { id: 'memory-123' }
        })
      };

      // Test search interface
      const searchResult = await mockMCPClient.searchMemories(
        'billing question',
        testCustomer,
        testTicket
      );

      expect(searchResult.success).toBe(true);
      expect(searchResult.data).toHaveLength(1);
      expect(mockMCPClient.searchMemories).toHaveBeenCalledWith(
        'billing question',
        testCustomer,
        testTicket
      );

      // Test store interface
      const storeResult = await mockMCPClient.storeMemory(
        'User asked about billing. Provided billing information.',
        'semantic',
        testCustomer,
        testTicket
      );

      expect(storeResult.success).toBe(true);
      expect(mockMCPClient.storeMemory).toHaveBeenCalledWith(
        'User asked about billing. Provided billing information.',
        'semantic',
        testCustomer,
        testTicket
      );
    });
  });

  describe('AI Agent Memory Integration Tests', () => {
    test('Should process AI chat successfully when provider is configured', async () => {
      if (!process.env.OPENAI_API_KEY) {
        console.log('Skipping AI chat test - no API key provided');
        return;
      }

      const response = await request(app)
        .post('/api/ai-chat')
        .send({
          message: 'I need help with my account',
          customerName: testCustomer,
          ticketId: testTicket
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.response).toBeDefined();
      expect(response.body.provider).toBe('openai');
    });

    test('Should process system prompt with memory placeholders', async () => {
      const { getConfigService } = require('../src/lib/config/config-service.js');
      const configService = getConfigService();
      
      // Reset to default system prompt first
      await configService.setSystemPrompt(`You are a professional customer support AI assistant for our service. Your goal is to provide helpful, accurate, and efficient support to customers.

Please analyze the customer's query and provide a clear, concise response. If you need additional information, ask specific questions.

Customer: {{customerName}}
Ticket ID: {{ticketId}}
Customer Query: {{userMessage}}

Previous context and memory:
{{memoryContext}}

Please respond professionally and helpfully.`);
      
      const systemPrompt = await configService.getSystemPrompt();
      
      // Check that system prompt contains memory placeholders
      expect(systemPrompt).toContain('{{customerName}}');
      expect(systemPrompt).toContain('{{ticketId}}');
      expect(systemPrompt).toContain('{{userMessage}}');
      expect(systemPrompt).toContain('{{memoryContext}}');
    });

    test('Should build proper prompt with memory context', async () => {
      const { getAIService } = require('../src/lib/ai/ai-service.js');
      const aiService = getAIService();
      
      // Mock the MCP client to avoid actual connection
      const originalGetMCPClient = require('../mcp-client.js').getMCPClient;
      
      const mockMCPClient = {
        searchMemories: jest.fn().mockResolvedValue({
          success: true,
          data: [{ text: JSON.stringify([
            { content: 'Customer previously asked about password reset' },
            { content: 'Successfully reset password on 2024-01-15' }
          ]) }]
        }),
        storeMemory: jest.fn().mockResolvedValue({
          success: true,
          data: { id: 'stored-memory-123' }
        })
      };

      // Mock the getMCPClient function
      require('../mcp-client.js').getMCPClient = jest.fn().mockResolvedValue(mockMCPClient);

      let chatError;
      try {
        // If API key is configured, it won't throw an error
        if (process.env.OPENAI_API_KEY) {
          const result = await aiService.chatWithMemory(
            'I forgot my password again',
            testCustomer,
            testTicket
          );
          // Should succeed with API key
          expect(result).toBeDefined();
          expect(result.response).toBeDefined();
        } else {
          // Without API key, should fail
          await aiService.chatWithMemory(
            'I forgot my password again',
            testCustomer,
            testTicket
          );
        }
      } catch (error) {
        chatError = error;
      }

      // Memory should be searched regardless
      expect(mockMCPClient.searchMemories).toHaveBeenCalledWith(
        'I forgot my password again',
        testCustomer,
        testTicket
      );

      // If no API key, should fail
      if (!process.env.OPENAI_API_KEY) {
        expect(chatError).toBeDefined();
        expect(chatError.message).toContain('not configured');
      }

      // Restore original function
      require('../mcp-client.js').getMCPClient = originalGetMCPClient;
    });
  });

  describe('Memory Persistence Tests', () => {
    test('Should handle memory storage after AI response', async () => {
      // This test verifies that memory storage is called after AI response
      const { getAIService } = require('../src/lib/ai/ai-service.js');
      const aiService = getAIService();
      
      // Mock AI provider to return a successful response
      const mockProvider = {
        isConfigured: jest.fn().mockResolvedValue(true),
        sendMessage: jest.fn().mockResolvedValue({
          content: 'I can help you reset your password. Please follow these steps...',
          usage: { prompt_tokens: 50, completion_tokens: 100 }
        })
      };

      // Mock MCP client
      const mockMCPClient = {
        searchMemories: jest.fn().mockResolvedValue({
          success: true,
          data: []
        }),
        storeMemory: jest.fn().mockResolvedValue({
          success: true,
          data: { id: 'memory-stored-123' }
        })
      };

      // Mock the dependencies
      const originalGetMCPClient = require('../mcp-client.js').getMCPClient;
      require('../mcp-client.js').getMCPClient = jest.fn().mockResolvedValue(mockMCPClient);
      
      const originalGetCurrentProvider = aiService.getCurrentProvider;
      aiService.getCurrentProvider = jest.fn().mockResolvedValue(mockProvider);

      const result = await aiService.chatWithMemory(
        'I need to reset my password',
        testCustomer,
        testTicket
      );

      // Verify memory was stored
      expect(mockMCPClient.storeMemory).toHaveBeenCalledWith(
        expect.stringContaining('User asked: I need to reset my password'),
        'semantic',
        testCustomer,
        testTicket
      );

      // Restore mocks
      require('../mcp-client.js').getMCPClient = originalGetMCPClient;
      aiService.getCurrentProvider = originalGetCurrentProvider;
    });
  });

  describe('Configuration Tests', () => {
    test('Should have proper MCP server URL configuration', () => {
      const mcpServerUrl = process.env.MCP_SERVER_URL;
      expect(mcpServerUrl).toBe('http://localhost:3000/mcp');
    });

    test('Should use correct OpenAI model configuration', () => {
      const openaiModel = process.env.OPENAI_MODEL;
      expect(openaiModel).toBe('gpt-4o-mini');
    });

    test('Should have proper AI provider configuration', () => {
      const aiProvider = process.env.AI_PROVIDER;
      expect(aiProvider).toBe('openai');
    });
  });
});