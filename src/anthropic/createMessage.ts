import Anthropic from "@anthropic-ai/sdk";
import { APIError } from "@anthropic-ai/sdk/error.js";
import type { Mcp } from "../types";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export default async function createMessage(
  mcp: Mcp,
  params: Anthropic.MessageCreateParams,
  messages: Array<Anthropic.MessageParam>,
  retryCount = 0
): Promise<Anthropic.Message> {
  try {
    const response = await mcp.anthropic.messages.create(params);
    if ("content" in response) {
      return response as Anthropic.Message;
    }
    throw new Error("Unexpected streaming response");
  } catch (error) {
    if (
      error instanceof APIError &&
      error.status === 500 &&
      retryCount < MAX_RETRIES
    ) {
      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      return createMessage(mcp, params, messages, retryCount + 1);
    }

    // For other errors or if max retries reached, add error info to conversation
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    messages.push({
      role: "user",
      content: `Error occurred: ${errorMessage}. Please suggest how to proceed.`,
    });
    throw error;
  }
}
