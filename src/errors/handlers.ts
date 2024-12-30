import type { ToolUseBlock } from "@anthropic-ai/sdk/resources/index.mjs";
import { handleBranchExists, isBranchExistsError } from "./isBranchExistsError";
import { handleRateLimit, isRateLimitError } from "./isRateLimitError";
import { handleNotFound, isNotFoundError } from "./isNotFoundError";
import type { Handler } from "./types";

const handlers: Handler[] = [
  { matches: isBranchExistsError, handle: handleBranchExists },
  { matches: isRateLimitError, handle: handleRateLimit },
  { matches: isNotFoundError, handle: handleNotFound },
];

export const handleError = async (
  error: unknown,
  toolUseBlock: ToolUseBlock
): Promise<void> => {
  const handler = handlers.find((h) => h.matches(error));

  if (handler) {
    await handler.handle(error, toolUseBlock);
  }

  // If no handler matches, rethrow the original error
  throw error;
};
