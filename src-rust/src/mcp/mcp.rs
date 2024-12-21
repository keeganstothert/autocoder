use anthropic::client::Client;
use anthropic::config::AnthropicConfig;
use anyhow::Context;
use tracing::{error, info};

use super::AppConfig;
use crate::utils::AppError;

#[derive(Debug)]
pub struct MCP {
  pub config: AppConfig,
  pub github: octocrab::Octocrab,
  pub claude: Client,
}

impl MCP {
  pub async fn new(config: AppConfig) -> Result<Self, AppError> {
    let github = octocrab::OctocrabBuilder::new()
      .personal_token(config.github_token.clone())
      .build()
      .context("Failed to build GitHub client")?;

    info!("Testing GitHub authentication...");
    match github.current().user().await {
      Ok(user) => info!("Successfully authenticated as: {}", user.login),
      Err(e) => error!("GitHub authentication test failed: {:?}", e),
    }

    info!("github_token: {:?}", github);
    info!("anthropic_api_key: {}", config.anthropic_api_key);

    let cfg = AnthropicConfig::new()?;
    let claude = Client::try_from(cfg)?;

    Ok(Self {
      config,
      github,
      claude,
    })
  }
}
