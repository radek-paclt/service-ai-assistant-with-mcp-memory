# AI Service Assistant

A professional customer support system powered by AI with memory capabilities. Built with Next.js, TypeScript, PostgreSQL, and integrates with OpenAI/Anthropic/Azure OpenAI providers.

## Features

- 🤖 Multi-provider AI support (OpenAI, Anthropic, Azure OpenAI)
- 💾 Memory persistence via MCP (Model Context Protocol) server
- 🔐 JWT authentication with role-based access control
- 👥 User management with admin/user roles
- 💬 Professional customer support chat interface
- ⚙️ Configurable system prompts
- 🗄️ PostgreSQL database with TypeORM
- 🧪 Comprehensive E2E test coverage

## Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- MCP Memory Server running on http://localhost:3000/mcp
- At least one AI provider API key (OpenAI recommended)

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd service-ai-assistant
```

2. Install dependencies:
```bash
npm install
```

3. Set up PostgreSQL database:
```bash
# Create database
createdb service_ai_assistant

# Or using psql
psql -U postgres -c "CREATE DATABASE service_ai_assistant;"
```

4. Configure environment variables:
```bash
# Copy the example environment file
cp .env.example .env.development

# Edit .env.development with your configuration
```

5. Configure your `.env.development` file:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=service_ai_assistant

# API Configuration
API_PORT=3030

# AI Provider Configuration (at least one required)
AI_PROVIDER=openai
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-4o-mini

# Optional AI Providers
ANTHROPIC_API_KEY=your-anthropic-api-key-here
AZURE_OPENAI_API_KEY=your-azure-api-key-here
AZURE_OPENAI_ENDPOINT=your-azure-endpoint-here

# MCP Memory Server
MCP_SERVER_URL=http://localhost:3000/mcp

# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
```

6. Run database migrations (automatic on first start):
```bash
# Tables are created automatically via TypeORM synchronize
# Or manually reset database:
node reset-db.js
```

## Running the Application

### Development Mode

```bash
# Start the standalone API server
npm run dev:api

# In another terminal, start the Next.js frontend (when implemented)
npm run dev
```

### Production Mode

```bash
# Build the application
npm run build

# Start the API server
npm run start:api
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- __tests__/api.test.js
```

## API Endpoints

The API server runs on `http://localhost:3030` by default.

### Public Endpoints
- `GET /api/health` - Health check
- `GET /api/status` - Server status
- `POST /api/auth/login` - User login

### Protected Endpoints
- `POST /api/ai-chat` - Chat with AI agent
- `GET /api/ai-providers` - List AI providers status
- `GET /api/admin/system-prompt` - Get system prompt
- `PUT /api/admin/system-prompt` - Update system prompt (admin only)

## Default Credentials

On first start, an admin user is automatically created:
- Username: `admin`
- Password: `Admin123!@#`

**⚠️ IMPORTANT: Change the default password immediately after first login!**

## Project Structure

```
service-ai-assistant/
├── src/
│   ├── entities/          # TypeORM entities
│   ├── lib/              # Core libraries
│   │   ├── ai/           # AI provider integrations
│   │   ├── auth/         # Authentication logic
│   │   ├── config/       # Configuration services
│   │   └── database.js   # Database connection
│   └── pages/            # Next.js pages
├── __tests__/            # E2E test suite
├── standalone-api.js     # Express API server
├── mcp-client.js        # MCP memory client
└── package.json         # Dependencies
```

## Security Considerations

- Never commit `.env` files or any files containing API keys
- Always use environment variables for sensitive configuration
- Keep your API keys secure and rotate them regularly
- Use strong JWT secrets in production
- Enable HTTPS in production environments
- Regularly update dependencies for security patches

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check database credentials in `.env.development`
- Verify database exists: `psql -U postgres -l`

### MCP Server Connection
- Ensure MCP memory server is running on configured URL
- Check `MCP_SERVER_URL` in environment variables
- Test connection: `curl http://localhost:3000/mcp`

### AI Provider Issues
- Verify API keys are correct and active
- Check API key permissions and quotas
- Ensure selected provider matches configured keys

## License

[Your License Here]

## Support

For issues and questions, please create an issue in the repository.