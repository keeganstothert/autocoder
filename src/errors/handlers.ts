import type { ToolUseBlock } from "@anthropic-ai/sdk/resources/index.mjs";
import { handleBranchExists, isBranchExistsError } from "./isBranchExistsError";
import { handleRateLimit, isRateLimitError } from "./isRateLimitError";
import { handleNotFound, isNotFoundError } from "./isNotFoundError";
import type { ErrorResponse, Handler } from "./types";

const handlers: Handler[] = [
  { matches: isBranchExistsError, handle: handleBranchExists },
  { matches: isRateLimitError, handle: handleRateLimit },
  { matches: isNotFoundError, handle: handleNotFound },
];

export const handleError = async (
  error: unknown,
  toolUseBlock: ToolUseBlock
): Promise<ErrorResponse> => {
  const handler = handlers.find((h) => h.matches(error));

  try {
    if (handler) {
      await handler.handle(error, toolUseBlock);
    }
    // If we get here, no handler matched or the handler didn't throw
    throw error;
  } catch (e) {
    // Convert any error (including McpError) to an ErrorResponse
    return {
      error: true,
      message: e instanceof Error ? e.message : "An unknown error occurred",
    };
  }
};
