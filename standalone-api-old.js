// Load environment variables
require('dotenv').config({ path: '.env.development' });

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { getDataSource } = require('./src/lib/database');

const app = express();
const PORT = 3030;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
let dataSource = null;
const initializeDatabase = async () => {
  try {
    dataSource = await getDataSource();
    
    // Create admin user if not exists
    const userRepository = dataSource.getRepository('User');
    const adminExists = await userRepository.findOne({ where: { username: 'admin' } });
    
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('Admin123!@#', 10);
      const adminUser = userRepository.create({
        username: 'admin',
        passwordHash: hashedPassword,
        role: 'admin',
        isTemporaryPassword: false
      });
      await userRepository.save(adminUser);
      console.log('✅ Admin user created');
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    process.exit(1);
  }
};

// Routes
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    timestamp: new Date().toISOString(),
    service: 'AI Service Assistant Standalone API',
    version: '1.0.0'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'AI Service Assistant'
  });
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required'
      });
    }

    // Database query
    const client = new Client(dbConfig);
    await client.connect();

    const result = await client.query(
      'SELECT id, username, "passwordHash", role, "isTemporaryPassword" FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      await client.end();
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    await client.end();

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        isTemporaryPassword: user.isTemporaryPassword
      },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

app.get('/api/db-test', async (req, res) => {
  try {
    const client = new Client(dbConfig);
    await client.connect();
    
    const result = await client.query('SELECT COUNT(*) as user_count FROM users');
    const userCount = parseInt(result.rows[0].user_count);
    
    await client.end();

    res.json({
      success: true,
      message: 'Database connection successful',
      userCount: userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// MCP Memory test endpoint
app.get('/api/mcp-test', async (req, res) => {
  try {
    // Test if MCP memory server is accessible via streamable HTTP
    const { getMCPClient } = require('./mcp-client.js');
    
    const mcpClient = await getMCPClient();
    
    // Test search
    const searchResult = await mcpClient.searchMemories('test query', 'test-customer', 'test-ticket-123');
    
    // Test store
    const storeResult = await mcpClient.storeMemory(
      'This is a test memory entry',
      'semantic',
      'test-customer',
      'test-ticket-123'
    );
    
    res.json({
      success: true,
      message: 'MCP Memory Server connection successful',
      searchResult: searchResult,
      storeResult: storeResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      mcpStatus: 'Failed to connect to MCP Memory Server'
    });
  }
});

// AI providers status endpoint
app.get('/api/ai-providers', async (req, res) => {
  try {
    const { getAIService } = require('./src/lib/ai/ai-service.js');
    const aiService = getAIService();
    
    const status = await aiService.getAllProvidersStatus();
    
    res.json({
      success: true,
      ...status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Admin endpoint to get system prompt
app.get('/api/admin/system-prompt', async (req, res) => {
  try {
    const { getConfigService } = require('./src/lib/config/config-service.js');
    const configService = getConfigService();
    
    const systemPrompt = await configService.getSystemPrompt();
    
    res.json({
      success: true,
      systemPrompt: systemPrompt,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Admin endpoint to update system prompt
app.put('/api/admin/system-prompt', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        error: 'Prompt is required'
      });
    }

    const { getConfigService } = require('./src/lib/config/config-service.js');
    const configService = getConfigService();
    
    await configService.setSystemPrompt(prompt);
    
    res.json({
      success: true,
      message: 'System prompt updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test AI chat endpoint
app.post('/api/ai-chat', async (req, res) => {
  try {
    const { message, customerName, ticketId, provider } = req.body;
    
    if (!message || !customerName || !ticketId) {
      return res.status(400).json({
        error: 'message, customerName, and ticketId are required'
      });
    }

    const { getAIService } = require('./src/lib/ai/ai-service.js');
    const aiService = getAIService();
    
    // Nastavíme provider pokud je specifikován
    if (provider) {
      aiService.setProvider(provider);
    }
    
    const result = await aiService.chatWithMemory(message, customerName, ticketId);
    
    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Initialize configuration defaults
const initializeConfig = async () => {
  try {
    const { getConfigService } = require('./src/lib/config/config-service.js');
    const configService = getConfigService();
    await configService.initializeDefaults();
    console.log('✅ Configuration defaults initialized');
  } catch (error) {
    console.error('❌ Error initializing configuration:', error);
  }
};

// Start server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Standalone API Server running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Login endpoint: http://localhost:${PORT}/api/auth/login`);
  console.log(`💾 Database test: http://localhost:${PORT}/api/db-test`);
  console.log(`🤖 AI chat: http://localhost:${PORT}/api/ai-chat`);
  console.log(`⚙️  Admin system prompt: http://localhost:${PORT}/api/admin/system-prompt`);
  
  // Initialize configuration
  await initializeConfig();
});

module.exports = app;