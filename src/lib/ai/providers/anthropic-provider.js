class AnthropicProvider {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
    this.model = config.model || process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
    this.apiUrl = 'https://api.anthropic.com/v1/messages';
  }

  async sendMessage(messages, options = {}) {
    if (!this.apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    try {
      // Convert OpenAI format to Anthropic format if needed
      const anthropicMessages = messages.map(msg => ({
        role: msg.role === 'system' ? 'user' : msg.role,
        content: msg.content
      }));

      // Extract system message if present
      const systemMessage = messages.find(m => m.role === 'system');
      const nonSystemMessages = messages.filter(m => m.role !== 'system');

      const requestBody = {
        model: this.model,
        messages: nonSystemMessages,
        max_tokens: options.maxTokens || 1024,
        temperature: options.temperature || 0,
        ...options
      };

      if (systemMessage) {
        requestBody.system = systemMessage.content;
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Anthropic API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      return {
        content: data.content[0].text,
        usage: data.usage,
        model: data.model
      };
    } catch (error) {
      console.error('Anthropic API error:', error);
      throw error;
    }
  }

  async isConfigured() {
    return !!this.apiKey;
  }

  getInfo() {
    return {
      provider: 'anthropic',
      model: this.model,
      configured: !!this.apiKey
    };
  }
}

module.exports = AnthropicProvider;