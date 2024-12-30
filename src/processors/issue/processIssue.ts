import Anthropic from "@anthropic-ai/sdk";
import type { ToolUseBlock } from "@anthropic-ai/sdk/resources/index.mjs";
import getInitialPrompt from "./getInitialPrompt";
import type { Mcp } from "../../types";
import handleToolResults from "../../mcp/handleToolResults";

export default async function processIssue(mcp: Mcp, issueNumber: string) {
  const initialPrompt = getInitialPrompt(issueNumber);
  const messages: Array<Anthropic.MessageParam> = [
    {
      role: "user",
      content: initialPrompt,
    },
  ];

  let lastResponse = await mcp.anthropic.messages.create({
    model: process.env.MODEL!,
    max_tokens: parseInt(process.env.MAX_TOKENS!, 10),
    messages: messages,
    tools: mcp.availableTools,
  });

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

    lastResponse = await handleToolResults(mcp, toolUseBlocks, messages);
  }

  return messages;
}
