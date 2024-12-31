import type { ErrorContext } from "./types";

export default function formatErrorMessage({
  action,
  error,
  context,
}: ErrorContext): string {
  let message = `Error while ${action}: ${error.message}`;
  if (context) {
    message +=
      "\nContext:\n" +
      Object.entries(context)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n");
  }
  message +=
    "\n\nPlease analyze this error and suggest how to proceed. You can:\n";
  message += "1. Try an alternative approach\n";
  message += "2. Skip this step if non-critical\n";

  return message;
}
