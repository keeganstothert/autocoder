import type { ToolUseBlock } from "@anthropic-ai/sdk/resources/index.mjs";
import { ToolCallResponseSchema } from "../schema";
import { handleError } from "../errors/handlers";
import type { Mcp } from "../types";

export default async function handleToolUse(
  mcp: Mcp,
  toolUseBlock: ToolUseBlock
) {
  console.log(`Executing tool: ${toolUseBlock.name}`);

  try {
    return await mcp.client.request(
      {
        method: "tools/call",
        params: {
          name: toolUseBlock.name,
          arguments: toolUseBlock.input,
        },
      },
      ToolCallResponseSchema
    );
  } catch (error) {
    await handleError(error, toolUseBlock);
  }
}
