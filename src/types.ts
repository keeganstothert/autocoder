import type Anthropic from "@anthropic-ai/sdk";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

// Type for Anthropic's expected tool format
export type AnthropicTool = {
  name: string;
  description: string;
  input_schema: any;
};

export type Mcp = {
  client: Client;
  availableTools: AnthropicTool[];
  anthropic: Anthropic;
};
