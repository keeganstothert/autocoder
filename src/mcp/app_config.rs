use anyhow::{Context, Result};
use std::env;

#[derive(Debug)]
pub struct AppConfig {
    pub anthropic_api_key: String,
    pub github_token: String,
    pub repository: String,
    pub issue_number: i64,
}

impl AppConfig {
    pub fn from_env() -> Result<Self> {
        Ok(Self {
            anthropic_api_key: env::var("ANTHROPIC_API_KEY")
                .context("ANTHROPIC_API_KEY must be set")?,
            github_token: env::var("GITHUB_TOKEN").context("GITHUB_TOKEN must be set")?,
            repository: env::var("GITHUB_REPOSITORY").context("GITHUB_REPOSITORY must be set")?,
            issue_number: env::var("GITHUB_EVENT_ISSUE_NUMBER")
                .context("GITHUB_EVENT_ISSUE_NUMBER must be set")?
                .parse()?,
        })
    }
}
