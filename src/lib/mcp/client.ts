import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

interface Tool {
  name: string
  description?: string
  input_schema?: any
}

interface MCPMemoryResponse {
  success: boolean
  data?: any
  error?: string
}

class MCPMemoryClient {
  private client: Client
  private transport: StreamableHTTPClientTransport | null = null
  private isConnected = false
  private tools: Tool[] = []

  constructor() {
    this.client = new Client({
      name: 'service-ai-assistant',
      version: '1.0.0'
    })
  }

  async connect(): Promise<void> {
    if (this.isConnected) return

    try {
      // Connect to MCP memory server using streamable HTTP transport
      const mcpServerUrl = process.env.MCP_SERVER_URL || 'http://localhost:3000/mcp'
      
      this.transport = new StreamableHTTPClientTransport(new URL(mcpServerUrl))

      await this.client.connect(this.transport)
      this.isConnected = true

      // List available tools
      const toolsResult = await this.client.listTools()
      this.tools = toolsResult.tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema
      }))

      console.log('MCP Memory Client connected successfully via streamable HTTP')
      console.log(`Available tools: ${this.tools.map(t => t.name).join(', ')}`)
    } catch (error) {
      console.error('Failed to connect to MCP Memory Server:', error)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    if (this.transport && this.isConnected) {
      await this.transport.close()
      this.isConnected = false
      this.transport = null
    }
  }

  async callTool(toolName: string, args: any): Promise<MCPMemoryResponse> {
    if (!this.isConnected) {
      throw new Error('MCP client not connected')
    }

    try {
      const result = await this.client.callTool({
        name: toolName,
        arguments: args
      })

      return {
        success: true,
        data: result.content
      }
    } catch (error) {
      console.error(`Error calling tool ${toolName}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async searchMemories(query: string, customerId?: string, interactionId?: string): Promise<MCPMemoryResponse> {
    return this.callTool('search_memories', {
      query,
      customer_id: customerId,
      interaction_id: interactionId,
      limit: 10,
      includeAssociations: false,
      detailLevel: 'compact',
      reconstructChunks: false
    })
  }

  async storeMemory(content: string, type: string = 'semantic', customerId?: string, interactionId?: string): Promise<MCPMemoryResponse> {
    return this.callTool('store_memory', {
      content,
      type,
      context: {
        customer_id: customerId,
        interaction_id: interactionId
      },
      importance: 0.5
    })
  }

  getAvailableTools(): Tool[] {
    return this.tools
  }
}

let mcpClient: MCPMemoryClient | null = null

export const getMCPClient = async (): Promise<MCPMemoryClient> => {
  if (!mcpClient) {
    mcpClient = new MCPMemoryClient()
    await mcpClient.connect()
  }
  return mcpClient
}

export const disconnectMCPClient = async (): Promise<void> => {
  if (mcpClient) {
    await mcpClient.disconnect()
    mcpClient = null
  }
}

export type { Tool, MCPMemoryResponse }