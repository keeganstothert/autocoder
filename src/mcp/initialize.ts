import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { ListToolsResponseSchema } from "../schema";
import type { Mcp } from "../types";
import Anthropic from "@anthropic-ai/sdk";

export default async function initialize() {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const transport = new StdioClientTransport({
    command: "bun",
    args: [
      "./node_modules/@modelcontextprotocol/server-github/src/github/index.ts",
    ],
    env: process.env as Record<string, string>,
  });

  const mcpClient = new Client(
    {
      name: "mcp-anthropic-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  await mcpClient.connect(transport);

  // Get available tools from MCP server
  const toolsResponse = await mcpClient.request(
    {
      method: "tools/list",
    },
    ListToolsResponseSchema
  );

  console.log("tool response", toolsResponse);
  // Store tools for use with Claude
  const availableTools = toolsResponse.tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.input_schema,
  }));

  console.log(
    "Connected to MCP server with tools:",
    availableTools.map((t) => t.name).join(", ")
  );

  return { client: mcpClient, availableTools, anthropic } as Mcp;
}
