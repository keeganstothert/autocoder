import { z } from "zod";

export const ListToolsResponseSchema = z.object({
  tools: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      inputSchema: z.any(),
    })
  ),
});

export const ToolCallResponseSchema = z.object({
  content: z.array(z.any()),
});
