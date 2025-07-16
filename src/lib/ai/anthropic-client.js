const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';

class AnthropicClient {
  constructor() {
    this.apiKey = ANTHROPIC_API_KEY;
    this.model = ANTHROPIC_MODEL;
    this.apiUrl = 'https://api.anthropic.com/v1/messages';
  }

  async sendMessage(messages, options = {}) {
    if (!this.apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    try {
      const requestBody = {
        model: this.model,
        messages: messages,
        max_tokens: options.maxTokens || 1024,
        temperature: options.temperature || 0,
        ...options
      };

      // Add MCP servers configuration if provided
      if (options.mcpServers) {
        requestBody.mcp_servers = options.mcpServers;
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'mcp-client-2025-04-04' // Required for MCP
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Anthropic API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Anthropic API error:', error);
      throw error;
    }
  }

  async chatWithMemory(userMessage, customerName, ticketId) {
    // Configure MCP memory server
    const mcpServers = [{
      type: 'url',
      url: process.env.MCP_MEMORY_SERVER_URL || 'http://localhost:3333/sse',
      name: 'memory-server'
    }];

    // Build conversation context
    const messages = [
      {
        role: 'user',
        content: `Context: Customer ${customerName}, Ticket ${ticketId}\n\nUser query: ${userMessage}`
      }
    ];

    // Include tool use instructions
    const systemPrompt = `You are a helpful customer support assistant. 
    You have access to a memory system through MCP tools. 
    Use mcp__memory__search_memories to find relevant past solutions.
    Use mcp__memory__store_memory to save new solutions.
    
    When searching, use customer_id="${customerName}" and interaction_id="${ticketId}" for context-specific memories.`;

    return this.sendMessage(messages, {
      mcpServers,
      system: systemPrompt,
      maxTokens: 2048
    });
  }
}

// Singleton instance
let anthropicClient = null;

const getAnthropicClient = () => {
  if (!anthropicClient) {
    anthropicClient = new AnthropicClient();
  }
  return anthropicClient;
};

module.exports = { getAnthropicClient, AnthropicClient };