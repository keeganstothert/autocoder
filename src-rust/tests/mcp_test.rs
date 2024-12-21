use autocode_github_action::mcp::{AppConfig, MCP};

#[tokio::test]
async fn test_determine_branch_prefix() {
    let config = AppConfig {
        anthropic_api_key: "test".to_string(),
        github_token: "test".to_string(),
        repository: "owner/repo".to_string(),
        issue_number: 1,
    };

    let mcp = MCP::new(config).await.unwrap();

    // Test feature branch prefix
    assert_eq!(
        mcp.determine_branch_prefix("feat: add new feature", &vec!["feature".to_string()]),
        "feat"
    );

    // Test fix branch prefix
    assert_eq!(
        mcp.determine_branch_prefix("fix: resolve bug", &vec!["bug".to_string()]),
        "fix"
    );

    // Test feature prefix from title
    assert_eq!(
        mcp.determine_branch_prefix("feat: something", &vec![]),
        "feat"
    );

    // Test default to fix
    assert_eq!(
        mcp.determine_branch_prefix("update something", &vec![]),
        "fix"
    );
}
