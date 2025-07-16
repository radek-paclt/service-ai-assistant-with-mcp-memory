const OpenAIProvider = require('./providers/openai-provider');
const AnthropicProvider = require('./providers/anthropic-provider');
const AzureOpenAIProvider = require('./providers/azure-openai-provider');

class AIService {
  constructor() {
    this.providers = {
      openai: new OpenAIProvider(),
      anthropic: new AnthropicProvider(),
      azure_openai: new AzureOpenAIProvider()
    };
    
    // Default provider - můžeme to později číst z databáze/konfigurace
    this.currentProvider = process.env.AI_PROVIDER || 'openai';
  }

  setProvider(providerName) {
    if (!this.providers[providerName]) {
      throw new Error(`Provider ${providerName} not supported`);
    }
    this.currentProvider = providerName;
  }

  async getCurrentProvider() {
    return this.providers[this.currentProvider];
  }

  async sendMessage(messages, options = {}) {
    const provider = await this.getCurrentProvider();
    
    if (!(await provider.isConfigured())) {
      throw new Error(`Provider ${this.currentProvider} is not configured`);
    }

    return provider.sendMessage(messages, options);
  }

  async getProviderInfo() {
    const provider = await this.getCurrentProvider();
    return provider.getInfo();
  }

  async getAllProvidersStatus() {
    const status = {};
    
    for (const [name, provider] of Object.entries(this.providers)) {
      status[name] = {
        ...provider.getInfo(),
        isConfigured: await provider.isConfigured()
      };
    }
    
    return {
      current: this.currentProvider,
      providers: status
    };
  }

  async chatWithMemory(userMessage, customerName, ticketId, options = {}) {
    try {
      // Get system prompt from configuration
      const { getConfigService } = require('../config/config-service.js');
      const configService = getConfigService();
      const systemPromptTemplate = await configService.getSystemPrompt();

      // Search for relevant information in memory
      const { getMCPClient } = require('../../../mcp-client.js');
      const mcpClient = await getMCPClient();
      
      const memoryResult = await mcpClient.searchMemories(
        userMessage,
        customerName,
        ticketId
      );

      // Build memory context
      let memoryContext = '';
      if (memoryResult.success && memoryResult.data && memoryResult.data.length > 0) {
        const memories = JSON.parse(memoryResult.data[0].text);
        if (memories.length > 0) {
          memoryContext = `\n\nRelevant Past Information:\n${memories.map(m => `- ${m.content}`).join('\n')}`;
        }
      }

      // Replace placeholders in system prompt
      const systemPrompt = systemPromptTemplate
        .replace('{{customerName}}', customerName)
        .replace('{{ticketId}}', ticketId)
        .replace('{{userMessage}}', userMessage)
        .replace('{{memoryContext}}', memoryContext);

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ];

      const response = await this.sendMessage(messages, options);

      // Uložíme novou informaci do paměti pokud je relevantní
      if (response.content && response.content.length > 50) {
        await mcpClient.storeMemory(
          `User asked: ${userMessage}. AI responded: ${response.content}`,
          'semantic',
          customerName,
          ticketId
        );
      }

      return {
        response: response.content,
        provider: this.currentProvider,
        usage: response.usage,
        memoryUsed: memoryResult.success
      };
    } catch (error) {
      console.error('Chat with memory error:', error);
      throw error;
    }
  }
}

// Singleton instance
let aiService = null;

const getAIService = () => {
  if (!aiService) {
    aiService = new AIService();
  }
  return aiService;
};

module.exports = { getAIService, AIService };