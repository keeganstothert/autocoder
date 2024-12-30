import { McpError } from "@modelcontextprotocol/sdk/types.js";
import type { ToolUseBlock } from "@anthropic-ai/sdk/resources/index.mjs";

export const isRateLimitError = (error: unknown): boolean =>
  error instanceof Error && error.message.includes("API rate limit exceeded");

export const handleRateLimit = async (
  error: unknown,
  toolUseBlock: ToolUseBlock
): Promise<void> => {
  console.error(`Rate limit exceeded for tool ${toolUseBlock.name}`);
  await new Promise((resolve) => setTimeout(resolve, 60000));
  throw new McpError(
    -32603,
    "GitHub API rate limit exceeded. Waiting 60 seconds before retry",
    {
      toolName: toolUseBlock.name,
      originalError: error,
    }
  );
};
