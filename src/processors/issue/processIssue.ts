import Anthropic from "@anthropic-ai/sdk";
import getInitialPrompt from "./getInitialPrompt";
import type { Mcp } from "../../types";
import handleToolUse from "../../mcp/handleToolUse";

export default async function processIssue(mcp: Mcp, issueNumber: string) {
  const initialPrompt = getInitialPrompt(issueNumber);
  const messages: Array<Anthropic.MessageParam> = [
    {
      role: "user",
      content: initialPrompt,
    },
  ];

  let lastResponse = await mcp.anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
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
      (block) => block.type === "tool_use"
    );

    if (toolUseBlocks.length === 0) {
      break; // No more tool uses to process
    }

    // Process each tool use in the response
    for (const block of toolUseBlocks) {
      const result = await handleToolUse(mcp, block);
      messages.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify(result),
          },
        ],
      });

      // Get Claude's response to the tool result
      lastResponse = await mcp.anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        messages: messages,
        tools: mcp.availableTools,
      });

      // Add Claude's response to the conversation
      messages.push({
        role: "assistant",
        content: lastResponse.content,
      });
    }
  }

  return messages;
}
