use anyhow::{Context, Result};
use octocrab::models::issues::Issue;

use crate::mcp::MCP;

pub async fn get_issue(mcp: &MCP) -> Result<Issue> {
  let (owner, repo) = mcp
    .config
    .repository
    .split_once('/')
    .context("Invalid repository format")?;

  Ok(
    mcp
      .github
      .issues(owner, repo)
      .get(mcp.config.issue_number as u64)
      .await
      .context("Failed to fetch issue")?,
  )
}
