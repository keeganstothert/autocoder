use crate::github::process_issue;
use crate::mcp::{AppConfig, MCP};
use anyhow::Result;
use tracing::{error, info};

pub mod github;
pub mod github;
pub mod mcp;
pub mod utils;

#[tokio::main]
async fn main() -> Result<()> {
  tracing_subscriber::fmt::init();

  dotenv::dotenv().ok();

  let config = AppConfig::from_env()?;
  let _mcp: MCP = MCP::new(config).await?;

  match process_issue(&_mcp).await {
    Ok(_) => info!("Successfully processed issue"),
    Err(e) => error!("Failed to process issue: {}", e),
  }

  Ok(())
}
