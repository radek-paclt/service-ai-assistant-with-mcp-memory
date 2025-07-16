# Test Setup Instructions

## Prerequisites

1. **PostgreSQL Database**: Ensure PostgreSQL is running on localhost:5432
2. **MCP Memory Server**: Should be running on http://localhost:3000/mcp (for full integration tests)
3. **OpenAI API Key**: Required for AI integration tests

## Test Environment Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup
The tests will automatically create a test database `service_ai_assistant_test` and run migrations.

### 3. Run Tests

#### Basic Tests (without API key)
```bash
npm test
```

#### With OpenAI API Key
```bash
OPENAI_API_KEY=your-api-key-here npm test
```

#### Watch Mode
```bash
npm run test:watch
```

#### Coverage Report
```bash
npm run test:coverage
```

## Test Suites

### 1. Database Setup Tests (`__tests__/setup.test.js`)
- Tests database connection
- Verifies table creation
- Runs migrations

### 2. API Routes Tests (`__tests__/api.test.js`)
- Tests all API endpoints
- Authentication tests
- Error handling tests
- Parameter validation

### 3. MCP Memory Tests (`__tests__/mcp-memory.test.js`)
- Tests MCP client configuration
- Verifies streamable HTTP transport
- Tests memory storage/retrieval interfaces
- Tests without actual MCP server running

### 4. AI Integration Tests (`__tests__/ai-integration.test.js`)
- Tests AI provider configuration
- System prompt integration
- Memory context integration
- Error handling without API keys

### 5. Full Integration Tests (`__tests__/with-api-key.test.js`)
- Requires OpenAI API key
- Tests complete AI chat workflow
- Tests memory storage and retrieval
- Tests different providers
- Rate limiting and error handling

## Test Configuration

### Environment Variables
```bash
NODE_ENV=test
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=service_ai_assistant_test
JWT_SECRET=test-jwt-secret
JWT_REFRESH_SECRET=test-refresh-secret
MCP_SERVER_URL=http://localhost:3000/mcp
AI_PROVIDER=openai
OPENAI_MODEL=gpt-4o-mini
OPENAI_API_KEY=your-api-key-here  # Only for integration tests
```

### Test Database
- Automatically created: `service_ai_assistant_test`
- Migrations run automatically
- Cleaned up after tests

## Expected Results

### Without API Key
- ✅ Database tests should pass
- ✅ API route tests should pass
- ✅ MCP interface tests should pass
- ✅ AI integration tests should pass (but show "not configured" errors)
- ❌ Full integration tests should be skipped

### With API Key
- ✅ All tests should pass
- ✅ AI responses should be generated
- ✅ Memory integration should work (if MCP server is running)
- ✅ System prompt should be used correctly

### With MCP Server Running
- ✅ All MCP tests should pass
- ✅ Memory storage/retrieval should work
- ✅ AI responses should include memory context

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Check credentials in jest.setup.js

2. **MCP Connection Error**
   - Expected if MCP server is not running
   - Tests should handle this gracefully

3. **API Key Error**
   - Expected without OPENAI_API_KEY
   - Integration tests will be skipped

4. **Port Conflicts**
   - Ensure ports 3030 and 3000 are available
   - Stop any running servers before testing

## Running Individual Test Suites

```bash
# Database and setup tests
npm test __tests__/setup.test.js

# API routes only
npm test __tests__/api.test.js

# MCP memory tests
npm test __tests__/mcp-memory.test.js

# AI integration tests
npm test __tests__/ai-integration.test.js

# Full integration (with API key)
OPENAI_API_KEY=your-key npm test __tests__/with-api-key.test.js
```