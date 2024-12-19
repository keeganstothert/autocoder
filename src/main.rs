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
