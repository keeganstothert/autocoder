import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

import type { Mcp } from "../types";
import Anthropic from "@anthropic-ai/sdk";
import getAvailableTools from "./availableTools";

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
  const availableTools = await getAvailableTools(mcpClient);

  return { client: mcpClient, availableTools, anthropic } as Mcp;
}
