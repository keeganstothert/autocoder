import type Anthropic from "@anthropic-ai/sdk";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

export type Tool = {
  name: string;
  description: string;
  input_schema: any;
};

export type Mcp = {
  client: Client;
  availableTools: Tool[];
  anthropic: Anthropic;
};
