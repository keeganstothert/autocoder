import disconnect from "./mcp/disconnect";
import initialize from "./mcp/initialize";
import processIssue from "./processors/issue/processIssue";

async function main() {
  const mcp = await initialize();

  try {
    const issueNumber = process.env.GITHUB_EVENT_ISSUE_NUMBER!;
    if (!issueNumber) {
      throw new Error(
        "GITHUB_EVENT_ISSUE_NUMBER environment variable is not set"
      );
    }
    const conversation = await processIssue(mcp, issueNumber);

    // Log the conversation to see what happened
    console.log("Conversation history:");
    conversation.forEach((message, i) => {
      console.log(`\n${message.role.toUpperCase()}:`);
      console.log(
        typeof message.content === "string"
          ? message.content
          : JSON.stringify(message.content, null, 2)
      );
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await disconnect(mcp);
    // Ensure process exits after completion
    process.exit(0);
  }
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
