import type { ToolUseBlock } from "@anthropic-ai/sdk/resources/index.mjs";

export type ErrorMatcher = (error: unknown) => boolean;
export interface ErrorResponse {
  error: true;
  message: string;
}

export type ErrorHandler = (
  error: unknown,
  toolUseBlock: ToolUseBlock
) => Promise<void>;

export interface Handler {
  matches: ErrorMatcher;
  handle: ErrorHandler;
}
