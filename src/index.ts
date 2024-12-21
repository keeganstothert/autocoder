import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import Anthropic from "@anthropic-ai/sdk";
import type { ToolUseBlock } from "@anthropic-ai/sdk/resources/index.mjs";
import type { Message } from "@anthropic-ai/sdk/src/resources/index.js";
import { ListToolsResponseSchema, ToolCallResponseSchema } from "./schema";

class MCPAnthropicClient {
  private mcpClient!: Client;
  private anthropic: Anthropic;
  private availableTools: any[] = [];

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async initialize(mcpServerPath: string) {
    const transport = new StdioClientTransport({
      command: "node",
      args: [mcpServerPath],
    });

    this.mcpClient = new Client(
      {
        name: "mcp-anthropic-client",
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );

    await this.mcpClient.connect(transport);

    // Get available tools from MCP server
    const toolsResponse = await this.mcpClient.request(
      {
        method: "tools/list",
      },
      ListToolsResponseSchema
    );

    // Store tools for use with Claude
    this.availableTools = toolsResponse.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema,
    }));

    console.log(
      "Connected to MCP server with tools:",
      this.availableTools.map((t) => t.name).join(", ")
    );
  }

  private async handleToolUse(toolUseBlock: ToolUseBlock) {
    console.log(`Executing tool: ${toolUseBlock.name}`);

    // Execute the tool call through MCP
    const result = await this.mcpClient.request(
      {
        method: "tools/call",
        params: {
          name: toolUseBlock.name,
          arguments: toolUseBlock.input,
        },
      },
      ToolCallResponseSchema
    );

    return result;
  }

  private async processToolResults(
    messages: Array<Message["content"][number]>
  ) {
    const conversation = [];

    for (const block of messages) {
      if (block.type === "tool_use") {
        const result = await this.handleToolUse(block);
        conversation.push({
          role: "user" as const,
          content: [
            {
              type: "tool_result" as const,
              tool_use_id: block.id,
              content: JSON.stringify(result),
            },
          ],
        });
      } else if (block.type === "text") {
        conversation.push({
          role: "assistant" as const,
          content: block.text,
        });
      }
    }

    return conversation;
  }

  async processWithClaude(userPrompt: string) {
    const messages: Array<Anthropic.MessageParam> = [
      {
        role: "user",
        content: userPrompt,
      },
    ];

    while (true) {
      // Get Claude's response
      const response = await this.anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        messages: messages,
        tools: this.availableTools,
      });

      // Process the response blocks and handle any tool usage
      const newMessages = await this.processToolResults(response.content);
      messages.push(...newMessages);

      // If no tool usage in the last response, we're done
      if (!response.content.some((block) => block.type === "tool_use")) {
        break;
      }
    }

    return messages;
  }

  async disconnect() {
    if (this.mcpClient) {
      // Add any necessary cleanup
    }
  }
}

export default MCPAnthropicClient;
