class OpenAIProvider {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    this.model = config.model || process.env.OPENAI_MODEL || 'gpt-4o-mini';
    this.apiUrl = 'https://api.openai.com/v1/chat/completions';
    
    // Validate model
    if (!this.model.includes('gpt-4o-mini') && !this.model.includes('gpt-4') && !this.model.includes('gpt-3.5')) {
      console.warn(`Warning: Using model ${this.model}. Recommended: gpt-4o-mini for cost efficiency.`);
    }
  }

  async sendMessage(messages, options = {}) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const requestBody = {
        model: this.model,
        messages: messages,
        temperature: options.temperature || 0,
        max_tokens: options.maxTokens || 1024,
        ...options
      };

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      return {
        content: data.choices[0].message.content,
        usage: data.usage,
        model: data.model
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }

  async isConfigured() {
    return !!this.apiKey;
  }

  getInfo() {
    return {
      provider: 'openai',
      model: this.model,
      configured: !!this.apiKey
    };
  }
}

module.exports = OpenAIProvider;