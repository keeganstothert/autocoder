import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { ListToolsResponseSchema } from "../schema";

export default async function getAvailableTools(mcpClient: Client) {
  // Get available tools from MCP server
  const toolsResponse = await mcpClient.request(
    {
      method: "tools/list",
    },
    ListToolsResponseSchema
  );

  // Store tools for use with Claude
  // Transform MCP server's inputSchema to Anthropic's input_schema format
  const availableTools = toolsResponse.tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema,
  }));

  console.log(
    "Connected to MCP server with tools:",
    availableTools.map((t) => t.name).join(", ")
  );

  return availableTools;
}
