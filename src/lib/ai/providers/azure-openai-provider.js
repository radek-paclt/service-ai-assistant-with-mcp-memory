class AzureOpenAIProvider {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.AZURE_OPENAI_API_KEY;
    this.endpoint = config.endpoint || process.env.AZURE_OPENAI_ENDPOINT;
    this.deployment = config.deployment || process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4';
    this.apiVersion = config.apiVersion || process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview';
    
    if (this.endpoint) {
      this.apiUrl = `${this.endpoint}/openai/deployments/${this.deployment}/chat/completions?api-version=${this.apiVersion}`;
    }
  }

  async sendMessage(messages, options = {}) {
    if (!this.apiKey || !this.endpoint) {
      throw new Error('Azure OpenAI API key and endpoint not configured');
    }

    try {
      const requestBody = {
        messages: messages,
        temperature: options.temperature || 0,
        max_tokens: options.maxTokens || 1024,
        ...options
      };

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Azure OpenAI API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      return {
        content: data.choices[0].message.content,
        usage: data.usage,
        model: this.deployment
      };
    } catch (error) {
      console.error('Azure OpenAI API error:', error);
      throw error;
    }
  }

  async isConfigured() {
    return !!(this.apiKey && this.endpoint);
  }

  getInfo() {
    return {
      provider: 'azure_openai',
      model: this.deployment,
      endpoint: this.endpoint,
      configured: !!(this.apiKey && this.endpoint)
    };
  }
}

module.exports = AzureOpenAIProvider;