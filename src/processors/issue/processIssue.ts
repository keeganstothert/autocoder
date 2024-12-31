import Anthropic from "@anthropic-ai/sdk";
import type { ToolUseBlock } from "@anthropic-ai/sdk/resources/index.mjs";
import getInitialPrompt from "./getInitialPrompt";
import type { Mcp } from "../../types";
import handleToolResults from "../../mcp/handleToolResults";
import createMessage from "../../anthropic/createMessage";
import type { ErrorContext } from "./types";
import formatErrorMessage from "./formatError";

export default async function processIssue(mcp: Mcp, issueNumber: string) {
  try {
    const initialPrompt = getInitialPrompt(issueNumber);
    const messages: Array<Anthropic.MessageParam> = [
      {
        role: "user",
        content: initialPrompt,
      },
    ];

    let lastResponse = await createMessage(
      mcp,
      {
        model: process.env.MODEL!,
        max_tokens: parseInt(process.env.MAX_TOKENS!, 10),
        messages: messages,
        tools: mcp.availableTools,
      },
      messages
    );

    // Add Claude's initial response to the conversation
    if (lastResponse.content.some((block) => block.type === "text")) {
      messages.push({
        role: "assistant",
        content: lastResponse.content,
      });
    }

    // Continue processing tool uses until there are none left
    while (true) {
      const toolUseBlocks = lastResponse.content.filter(
        (block): block is ToolUseBlock => block.type === "tool_use"
      );

      if (toolUseBlocks.length === 0) {
        break; // No more tool uses to process
      }

      try {
        lastResponse = await handleToolResults(mcp, toolUseBlocks, messages);
      } catch (error) {
        // Add detailed error context to the conversation
        const errorContext: ErrorContext = {
          action: "executing tool",
          error: error instanceof Error ? error : new Error(String(error)),
          context: {
            toolCount: toolUseBlocks.length,
            toolNames: toolUseBlocks.map((block) => block.name).join(", "),
            messageCount: messages.length,
          },
        };

        messages.push({
          role: "user",
          content: formatErrorMessage(errorContext),
        });

        // Get Claude's response about the error
        lastResponse = await createMessage(
          mcp,
          {
            model: process.env.MODEL!,
            max_tokens: parseInt(process.env.MAX_TOKENS!, 10),
            messages: messages,
            tools: mcp.availableTools,
          },
          messages
        );

        messages.push({
          role: "assistant",
          content: lastResponse.content,
        });

        // Continue the conversation to allow for recovery
        continue;
      }
    }

    return messages;
  } catch (error) {
    console.error("Error in processIssue:", error);
    throw error;
  }
}
