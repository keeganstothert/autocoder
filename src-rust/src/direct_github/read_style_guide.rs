use crate::{mcp::MCP, utils::AppError};
use anyhow::{Context, Result};

pub async fn read_style_guide(mcp: &MCP) -> Result<String> {
  let (owner, repo) = mcp
    .config
    .repository
    .split_once('/')
    .context("Invalid repository format")?;

  let content = mcp
    .github
    .repos(owner, repo)
    .get_content()
    .path("STYLE_GUIDE.md")
    .send()
    .await?;

  // Decode content from base64
  let decoded = content
    .items
    .first()
    .context("STYLE_GUIDE.md not found")?
    .content
    .clone()
    .context("Empty STYLE_GUIDE.md")?;

  Ok(decoded)
}
