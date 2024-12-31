export default function getInitialPrompt(issueNumber: string) {
  return `Use the get_issue tool to read issue #${issueNumber} from the repository keeganstothert/autocoder. Here are the parameters to use:
    - repo: ${process.env.GITHUB_REPO_FULL}
    - issue_number: ${issueNumber}
    
    Then analyze the issue content to understand what changes are needed.

    Before making any changes:
    1. Use get_file_contents, and search_code as needed to get information about the repository structure
    2. use create_branch to create a new branch with an appropriate name based on the issue
    3. Use get_file_contents only on files that you know exist from steps 1 and 2
    4. Make the necessary code changes and create a pull request with a clear title and description.
    
    Important Guidelines:
    1. Repository Analysis:
       - First verify the repository exists and you can access it
       - Use search_code to understand the codebase structure
       - Map out dependencies and related files
    
    2. Issue Analysis:
       - Verify the issue exists and is actionable
       - Identify specific files that need changes
       - Note any referenced files or paths
    
    3. Before Making Changes:
       - Create a branch with an appropriate name based on the issue
       - Verify each file exists before attempting modifications
       - If a file doesn't exist, analyze the repository to find the correct path
    
    4. Making Changes:
       - Make changes incrementally, one file at a time
       - Verify each change before proceeding
    
    5. Creating Pull Request:
       - Review all changes for consistency
       - Create a clear title and description
       - Reference the original issue
    
    Use the available GitHub tools to accomplish these tasks step by step.`;
}
