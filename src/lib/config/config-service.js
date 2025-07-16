const { getDataSource } = require('../database');

const DEFAULT_SYSTEM_PROMPT = `You are a professional customer support AI assistant for a technology company. Your role is to provide helpful, accurate, and empathetic customer service.

## Core Responsibilities:
- Provide accurate technical support and troubleshooting assistance
- Help customers resolve product-related issues efficiently
- Escalate complex problems to human agents when necessary
- Maintain professional, friendly, and patient communication
- Document all interactions for future reference

## Communication Guidelines:
- Always greet customers professionally and acknowledge their concerns
- Use clear, simple language avoiding technical jargon unless necessary
- Be empathetic and understanding of customer frustration
- Provide step-by-step solutions when possible
- Always confirm understanding before proceeding with solutions
- End interactions by asking if there's anything else you can help with

## Memory Usage Instructions:
- Search your memory for relevant past interactions with this customer
- Reference previous solutions that worked for similar issues
- Build upon previous conversations to provide personalized support
- Store important customer preferences and technical details
- Remember successful troubleshooting steps for similar future issues

## Escalation Criteria:
- Technical issues beyond your knowledge scope
- Customer requests for refunds or billing changes
- Complaints requiring management attention
- Security-related concerns
- Any situation where customer expresses serious dissatisfaction

## Response Format:
- Start with a professional greeting
- Acknowledge the customer's specific issue
- Provide clear, actionable solutions
- Include relevant links or resources when helpful
- End with next steps or follow-up questions

## Data Privacy:
- Never share customer information between different customers
- Protect sensitive data like email addresses, phone numbers, account IDs
- Only access memory relevant to the current customer and ticket
- Maintain confidentiality of all customer interactions

## Current Context:
Customer: {{customerName}}
Ticket ID: {{ticketId}}
Customer Query: {{userMessage}}

{{memoryContext}}

Please provide professional, helpful support based on the above guidelines and context.`;

class ConfigService {
  constructor() {
    this.cache = new Map();
  }

  async getSystemPrompt() {
    return this.getConfig('ai_system_prompt', DEFAULT_SYSTEM_PROMPT);
  }

  async setSystemPrompt(prompt) {
    return this.setConfig('ai_system_prompt', prompt, 'AI Assistant System Prompt');
  }

  async getConfig(type, defaultValue = null) {
    // Check cache first
    if (this.cache.has(type)) {
      return this.cache.get(type);
    }

    try {
      const dataSource = await getDataSource();
      const configRepository = dataSource.getRepository('SystemConfig');
      
      const config = await configRepository.findOne({
        where: { type, isActive: true }
      });

      let value = defaultValue;
      if (config) {
        value = config.content;
      }

      // Cache the result
      this.cache.set(type, value);
      return value;
    } catch (error) {
      console.error('Error getting config:', error);
      return defaultValue;
    }
  }

  async setConfig(type, content, description = null) {
    try {
      const dataSource = await getDataSource();
      const configRepository = dataSource.getRepository('SystemConfig');
      
      // Try to find existing config
      let config = await configRepository.findOne({ where: { type } });
      
      if (config) {
        // Update existing
        config.content = content;
        config.description = description;
        config.updatedAt = new Date();
      } else {
        // Create new
        config = configRepository.create({
          type,
          content,
          description,
          isActive: true
        });
      }
      
      const result = await configRepository.save(config);

      // Update cache
      this.cache.set(type, content);
      
      return result;
    } catch (error) {
      console.error('Error setting config:', error);
      throw error;
    }
  }

  async initializeDefaults() {
    try {
      const dataSource = await getDataSource();
      const configRepository = dataSource.getRepository('SystemConfig');
      
      // Check if system prompt exists
      const existingPrompt = await configRepository.findOne({
        where: { type: 'ai_system_prompt' }
      });

      if (!existingPrompt) {
        await this.setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
        console.log('Initialized default system prompt');
      }
    } catch (error) {
      console.error('Error initializing defaults:', error);
    }
  }

  clearCache() {
    this.cache.clear();
  }
}

// Singleton instance
let configService = null;

const getConfigService = () => {
  if (!configService) {
    configService = new ConfigService();
  }
  return configService;
};

module.exports = { getConfigService, ConfigService };