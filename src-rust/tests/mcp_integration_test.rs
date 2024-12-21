use anthropic::types::CompleteRequest;
use anyhow::Result;
use chrono::{DateTime, Utc};
use mockall::mock;
use mockall::predicate::*;
use octocrab::models::issues::{Issue, Label};
use octocrab::models::pulls::PullRequest;
use octocrab::models::repos::Content;
use std::env;

use autocode_github_action::mcp::{AnthropicClient, AppConfig, GithubClient, MCP};

mock! {
    pub GithubClient {}
    impl Clone for GithubClient {
        fn clone(&self) -> Self;
    }
    impl GithubClient for MockGithubClient {
        async fn get_issue(&self, owner: &str, repo: &str, number: u64) -> Result<Issue>;
        async fn create_pull_request(&self, owner: &str, repo: &str, title: &str, head: &str, base: &str, body: &str) -> Result<PullRequest>;
        async fn get_content(&self, owner: &str, repo: &str, path: &str) -> Result<Content>;
        async fn create_issue_comment(&self, owner: &str, repo: &str, number: u64, body: &str) -> Result<()>;
    }
}

mock! {
    pub AnthropicClient {}
    impl Clone for AnthropicClient {
        fn clone(&self) -> Self;
    }
    impl AnthropicClient for MockAnthropicClient {
        async fn complete(&self, request: CompleteRequest) -> Result<String>;
    }
}

#[tokio::test]
async fn test_mcp_process_issue() -> Result<()> {
    // Setup environment
    env::set_var("GITHUB_TOKEN", "test-token");
    env::set_var("ANTHROPIC_API_KEY", "test-key");

    let now: DateTime<Utc> = Utc::now();

    // Create mock issue
    let mock_issue = Issue {
        number: 123,
        title: String::from("feat: Add new feature"),
        body: Some(String::from("Feature description")),
        body_text: None,
        body_html: None,
        labels: vec![Label {
            id: 1,
            url: String::from("http://example.com"),
            name: String::from("feature"),
            color: String::from("blue"),
            description: Some(String::from("Feature label")),
            default: false,
            node_id: String::from("node1"),
        }],
        state: String::from("open"),
        state_reason: None,
        locked: false,
        assignee: None,
        assignees: Some(vec![]),
        milestone: None,
        comments: 0,
        created_at: Some(now),
        updated_at: Some(now),
        closed_at: None,
        author_association: String::from("OWNER"),
        active_lock_reason: None,
        draft: Some(false),
        pull_request: None,
        repository_url: String::from("http://example.com"),
        labels_url: String::from("http://example.com/labels"),
        comments_url: String::from("http://example.com/comments"),
        events_url: String::from("http://example.com/events"),
        html_url: String::from("http://example.com"),
        id: 1,
        node_id: String::from("node1"),
        user: None,
        url: String::from("http://example.com"),
    };

    // Setup mock GitHub client
    let mut mock_github = MockGithubClient::new();

    // Expect issue fetch
    mock_github
        .expect_get_issue()
        .with(eq("owner"), eq("repo"), eq(123))
        .returning(move |_, _, _| Ok(mock_issue.clone()));

    // Expect style guide fetch
    mock_github
        .expect_get_content()
        .with(eq("owner"), eq("repo"), eq("STYLE_GUIDE.md"))
        .returning(|| {
            Ok(Content {
                name: Some(String::from("STYLE_GUIDE.md")),
                path: Some(String::from("STYLE_GUIDE.md")),
                sha: Some(String::from("abc123")),
                size: Some(100),
                url: Some(String::from("http://example.com")),
                html_url: Some(String::from("http://example.com")),
                git_url: Some(String::from("http://example.com")),
                download_url: Some(String::from("http://example.com")),
                r#type: Some(String::from("file")),
                content: Some(String::from("# Style Guide\nTest content")),
                encoding: Some(String::from("base64")),
                _links: Default::default(),
                target: None,
                submodule_git_url: None,
                license: None,
                links: Default::default(),
            })
        });

    // Expect PR creation
    mock_github
        .expect_create_pull_request()
        .with(
            eq("owner"),
            eq("repo"),
            eq("[FEAT] Add new feature"),
            eq("feat/123"),
            eq("main"),
            any(),
        )
        .returning(|_, _, _, _, _, _| {
            Ok(PullRequest {
                id: 456,
                number: 456,
                state: String::from("open"),
                locked: false,
                title: String::from("[FEAT] Add new feature"),
                user: None,
                body: Some(String::from("PR description")),
                body_text: None,
                body_html: None,
                created_at: Some(now),
                updated_at: Some(now),
                closed_at: None,
                merged_at: None,
                merge_commit_sha: None,
                assignee: None,
                assignees: Some(vec![]),
                requested_reviewers: Some(vec![]),
                requested_teams: Some(vec![]),
                labels: Some(vec![]),
                milestone: None,
                draft: Some(false),
                commits_url: String::from("http://example.com"),
                review_comments_url: String::from("http://example.com"),
                review_comment_url: String::from("http://example.com"),
                comments_url: String::from("http://example.com"),
                statuses_url: String::from("http://example.com"),
                head: Default::default(),
                base: Default::default(),
                _links: Default::default(),
                author_association: String::from("OWNER"),
                auto_merge: None,
                active_lock_reason: None,
                merged: Some(false),
                mergeable: Some(true),
                rebaseable: Some(true),
                mergeable_state: Some(String::from("clean")),
                merged_by: None,
                comments: Some(0),
                review_comments: Some(0),
                maintainer_can_modify: Some(true),
                commits: Some(0),
                additions: Some(0),
                deletions: Some(0),
                changed_files: Some(0),
                node_id: String::from("node1"),
                html_url: String::from("http://example.com"),
                diff_url: Some(String::from("http://example.com")),
                patch_url: Some(String::from("http://example.com")),
                issue_url: Some(String::from("http://example.com")),
                url: String::from("http://example.com"),
                links: Default::default(),
                repo: None,
            })
        });

    // Expect issue comment creation
    mock_github
        .expect_create_issue_comment()
        .with(eq("owner"), eq("repo"), eq(123), eq("Created PR #456"))
        .returning(|_, _, _, _| Ok(()));

    // Setup mock Anthropic client
    let mut mock_anthropic = MockAnthropicClient::new();
    mock_anthropic
        .expect_complete()
        .returning(|_| Ok(String::from("Generated PR description")));

    // Create MCP instance with mocked clients
    let config = AppConfig {
        github_token: String::from("test-token"),
        anthropic_api_key: String::from("test-key"),
        repository: String::from("owner/repo"),
        issue_number: 123,
    };

    let mcp = MCP::with_clients(config, mock_github, mock_anthropic);

    // Process the issue
    mcp.process_issue().await?;

    Ok(())
}
