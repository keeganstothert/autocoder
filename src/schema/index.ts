import { z } from "zod";

export const ToolSchema = z.object({
  name: z.string(),
  description: z.string(),
  inputSchema: z.any(),
});

export const ListToolsResponseSchema = z.object({
  tools: z.array(ToolSchema),
});

export const ToolCallResponseSchema = z.any();
