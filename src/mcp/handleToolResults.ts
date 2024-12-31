import Anthropic from "@anthropic-ai/sdk";
import type { ToolUseBlock } from "@anthropic-ai/sdk/resources/index.mjs";
import type { Mcp } from "../types";
import handleToolUse from "./handleToolUse";
import createMessage from "../anthropic/createMessage";

export default async function handleToolResults(
  mcp: Mcp,
  toolUseBlocks: ToolUseBlock[],
  messages: Array<Anthropic.MessageParam>
): Promise<Anthropic.Message> {
  let lastResponse: Anthropic.Message | undefined;

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
  }

  if (!lastResponse) {
    throw new Error("No response received from tool use processing");
  }

  return lastResponse;
}
