use anyhow::Result;
use mcp::{AppConfig, MCP};
use tracing::{error, info};

pub mod mcp;

#[tokio::main]
async fn main() -> Result<()> {
  // Initialize logging
  tracing_subscriber::fmt::init();

  // Load environment variables
  dotenv::dotenv().ok();

  // Debug: Print environment variables
  info!(
    "GITHUB_TOKEN: {}",
    std::env::var("GITHUB_TOKEN").unwrap_or_default()
  );
  info!(
    "GITHUB_REPOSITORY: {}",
    std::env::var("GITHUB_REPOSITORY").unwrap_or_default()
  );
  info!(
    "GITHUB_EVENT_ISSUE_NUMBER: {}",
    std::env::var("GITHUB_EVENT_ISSUE_NUMBER").unwrap_or_default()
  );

  // Get configuration
  let config = AppConfig::from_env()?;

  // Initialize MCP
  let mcp = MCP::new(config).await?;

  // Process the issue
  match mcp.process_issue().await {
    Ok(_) => info!("Successfully processed issue"),
    Err(e) => error!("Failed to process issue: {}", e),
  }

  Ok(())
}
