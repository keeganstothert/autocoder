export default function getInitialPrompt(issueNumber: string) {
  return `Use the get_issue tool to read issue #${issueNumber} from the repository keeganstothert/autocoder. Here are the parameters to use:
    - owner: ${process.env.GITHUB_REPOSITORY_OWNER}
    - repo: ${process.env.GITHUB_REPOSITORY_NAME}
    - issue_number: ${issueNumber}
    
    Then analyze the issue content to understand what changes are needed.
    Before making any changes:
    1. Use get_file_contents, and search_code as needed to get information about the repository structure
    2. use create_branch to create a new branch with an appropriate name based on the issue
    3. Use get_file_contents only on files that you know exist from steps 1 and 2
    
    Then make the necessary code changes and create a pull request with a clear title and description.
    Use the available GitHub tools to accomplish these tasks step by step.`;
}
