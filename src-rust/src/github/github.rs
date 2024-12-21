// src/main.rs
use crate::direct_github::GithubClient;
use crate::handlers::register_handlers;
use anyhow::Result;
use model_context_protocol::{Server, Transport};
use std::env;

// src/types.rs
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

// src/github.rs
use crate::error::GithubError;
use crate::types::*;
use async_trait::async_trait;
use reqwest::{header, Client};

pub struct GithubClient {
  client: Client,
  token: String,
}

impl GithubClient {
  pub fn new(token: String) -> Self {
    let mut headers = header::HeaderMap::new();
    headers.insert(
      header::ACCEPT,
      header::HeaderValue::from_static("application/vnd.github.v3+json"),
    );
    headers.insert(
      header::USER_AGENT,
      header::HeaderValue::from_static("github-mcp-server"),
    );

    let client = Client::builder()
      .default_headers(headers)
      .build()
      .expect("Failed to create HTTP client");

    Self { client, token }
  }

  pub async fn create_or_update_file(
    &self,
    owner: &str,
    repo: &str,
    path: &str,
    content: &str,
    message: &str,
    branch: &str,
    sha: Option<&str>,
  ) -> Result<CreateFileResponse, GithubError> {
    let url = format!(
      "https://api.github.com/repos/{}/{}/contents/{}",
      owner, repo, path
    );

    let content = base64::encode(content);

    let mut body = serde_json::json!({
        "message": message,
        "content": content,
        "branch": branch,
    });

    if let Some(sha) = sha {
      body["sha"] = serde_json::Value::String(sha.to_string());
    }

    let response = self
      .client
      .put(&url)
      .bearer_auth(&self.token)
      .json(&body)
      .send()
      .await?;

    if !response.status().is_success() {
      return Err(GithubError::ApiError(response.text().await?.to_string()));
    }

    Ok(response.json().await?)
  }

  // Add other GitHub API methods here...
}

// src/handlers.rs
use crate::direct_github::GithubClient;
use crate::types::*;
use model_context_protocol::{Server, Tool, ToolResult};

pub async fn register_handlers(server: &Server, github: GithubClient) -> Result<()> {
  server.add_tool(Tool::new(
    "create_or_update_file",
    "Create or update a single file in a GitHub repository",
    move |args| {
      let github = github.clone();
      async move {
        let params = serde_json::from_value(args)?;
        let result = github
          .create_or_update_file(
            params.owner,
            params.repo,
            params.path,
            params.content,
            params.message,
            params.branch,
            params.sha.as_deref(),
          )
          .await?;

        Ok(ToolResult::new(serde_json::to_value(result)?))
      }
    },
  ));

  // Register other tools here...

  Ok(())
}
