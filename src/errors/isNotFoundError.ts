import { McpError } from "@modelcontextprotocol/sdk/types.js";
import type { ToolUseBlock } from "@anthropic-ai/sdk/resources/index.mjs";

export const isNotFoundError = (error: unknown): boolean =>
  error instanceof Error && error.message.includes("Not Found");

export const handleNotFound = async (
  error: unknown,
  toolUseBlock: ToolUseBlock
): Promise<void> => {
  throw new McpError(
    -32603,
    `Resource not found while executing ${toolUseBlock.name}`,
    {
      toolName: toolUseBlock.name,
      originalError: error,
    }
  );
};
