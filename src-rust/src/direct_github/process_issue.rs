use anthropic::types::{ContentBlock, Message, MessagesRequestBuilder, Role};
use anyhow::{Context, Result};
use octocrab::{models::repos::Object, params::repos::Reference};

use crate::mcp::{create_prompt, format_pr_body, MCP};

use super::{get_issue, read_style_guide};

pub async fn process_issue(mcp: &MCP) -> Result<()> {
  let issue = get_issue(&mcp).await?;
  let style_guide = read_style_guide(&mcp).await?;
  let branch_name = format!("issue/{}", mcp.config.issue_number);
  let prompt = create_prompt(&issue, &style_guide);

  // Create messages request
  let messages = vec![Message {
    role: Role::User,
    content: vec![ContentBlock::Text { text: prompt }],
  }];

  let messages_request = MessagesRequestBuilder::default()
    .messages(messages)
    .model(mcp.config.model.clone())
    .max_tokens(5000usize)
    .build()
    .context("Failed to build messages request")?;

  let response = mcp.claude.messages(messages_request).await?;

  // Create PR
  let (owner, repo) = mcp
    .config
    .repository
    .split_once('/')
    .context("Invalid repository format")?;

  // Get the main branch's latest commit SHA
  let base_ref = mcp
    .github
    .repos(owner, repo)
    .get_ref(&Reference::Branch("main".to_string()))
    .await?;

  let sha = match &base_ref.object {
    Object::Commit { sha, .. } => sha,
    Object::Tag { sha, .. } => sha,
    _ => anyhow::bail!("Unexpected object type"),
  };

  // Create new branch from main
  let new_branch = mcp
    .github
    .repos(owner, repo)
    .create_ref(&Reference::Branch(branch_name.to_string()), sha)
    .await?;

  let pr = mcp
    .github
    .pulls(owner, repo)
    .create(
      format!("[ISSUE-{}] {}", mcp.config.issue_number, issue.title),
      branch_name,
      "main",
    )
    .body(format_pr_body(
      response
        .content
        .first()
        .and_then(|block| match block {
          ContentBlock::Text { text } => Some(text.clone()),
          _ => None,
        })
        .unwrap_or_else(String::new),
    ))
    .send()
    .await?;

  mcp
    .github
    .issues(owner, repo)
    .create_comment(issue.number as u64, format!("Created PR #{}", pr.number))
    .await?;

  Ok(())
}
