import { McpError } from "@modelcontextprotocol/sdk/types.js";
import type { ToolUseBlock } from "@anthropic-ai/sdk/resources/index.mjs";

export const isBranchExistsError = (error: unknown): boolean =>
  error instanceof Error && error.message.includes("Reference already exists");

export const handleBranchExists = async (
  error: unknown,
  toolUseBlock: ToolUseBlock
): Promise<void> => {
  if (toolUseBlock.name !== "create_branch") {
    throw error;
  }

  console.error(`Branch creation failed: ${(error as Error).message}`);
  throw new McpError(
    -32603,
    "Branch already exists, please choose a different branch name",
    {
      toolName: toolUseBlock.name,
      originalError: error,
    }
  );
};
