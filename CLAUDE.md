# Claude AI Assistant - Development Guidelines

## Language Convention

- **Chat/Communication**: Czech language (česky)
- **Code**: English language (comments, variable names, function names, etc.)
- **Documentation**: English language (README.md, API docs, etc.)
- **Markdown files**: English language

## Project Overview

This is a Next.js customer support application with AI assistance and MCP memory integration.

## Key Technical Stack

- **Framework**: Next.js 14 with TypeScript
- **Database**: PostgreSQL with TypeORM (code-first approach)
- **Authentication**: JWT with refresh tokens
- **AI Integration**: Multiple providers (OpenAI, Anthropic, Azure OpenAI)
- **Memory**: MCP (Model Context Protocol) with streamable HTTP transport
- **Server**: Express.js standalone API on port 3030

## MCP Integration

The application uses the official Anthropic MCP SDK with streamable HTTP transport:

```javascript
// Correct MCP client configuration
const transport = new StreamableHTTPClientTransport(new URL(mcpServerUrl));
```

**Important**: MCP connection uses streamable HTTP transport. Environment variables:
- `MCP_SERVER_URL=http://localhost:3000/mcp`

## Running the Application

```bash
# Start the standalone API server
node standalone-api.js

# The server runs on port 3030
# Health check: http://localhost:3030/api/health
```

## Database Configuration

- Host: localhost:5432
- Username: postgres
- Password: postgres
- Database: service_ai_assistant

## Authentication

- Admin user created automatically on first run
- Password policy: min 10 chars, special chars (_*-$#@%^&), numbers, no spaces
- JWT tokens with refresh token rotation

## AI Providers

All three providers are implemented and can be switched dynamically:
- OpenAI (default)
- Anthropic Claude
- Azure OpenAI

## Development Notes

- Use TypeORM code-first approach with auto-migrations
- All API endpoints are in standalone-api.js
- MCP integration provides hierarchical memory (general/customer/ticket levels)
- Regex-based anonymization before sending to AI providers