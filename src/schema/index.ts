import { z } from "zod";

export const ListToolsResponseSchema = z.object({
  tools: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      input_schema: z.any(),
    })
  ),
});

export const ToolCallResponseSchema = z.any(); // Allow any response structure from GitHub MCP tools
