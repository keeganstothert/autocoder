import type { Mcp } from "../types";

export default async function disconnect(mcp: Mcp) {
  if (mcp.client) {
    // Add any necessary cleanup
  }
}
