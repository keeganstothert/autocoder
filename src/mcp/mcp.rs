use anthropic::client::Client;
use anthropic::types::CompleteRequest;
use anyhow::{Context, Result};
use octocrab::models::issues::Issue;
use tracing::info;

use super::{create_prompt, format_pr_body, AppConfig};

#[derive(Debug)]
pub struct MCP {
    config: AppConfig,
    github: octocrab::Octocrab,
    claude: Client,
}

impl MCP {
    pub async fn new(config: AppConfig) -> Result<Self> {
        let github = octocrab::OctocrabBuilder::new()
            .personal_token(config.github_token.clone())
            .build()?;

        info!("anthropic_api_key: {}", config.anthropic_api_key);
        std::env::set_var("ANTHROPIC_API_KEY", &config.anthropic_api_key);
        let claude = Client::default();

        Ok(Self {
            config,
            github,
            claude,
        })
    }

    async fn get_issue(&self) -> Result<Issue> {
        let (owner, repo) = self
            .config
            .repository
            .split_once('/')
            .context("Invalid repository format")?;

        self.github
            .issues(owner, repo)
            .get(self.config.issue_number as u64)
            .await
            .context("Failed to fetch issue")
    }

    async fn read_style_guide(&self) -> Result<String> {
        let (owner, repo) = self
            .config
            .repository
            .split_once('/')
            .context("Invalid repository format")?;

        let content = self
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

    pub fn determine_branch_prefix(&self, issue_title: &str, labels: &[String]) -> &'static str {
        if labels.iter().any(|l| l.contains("feature"))
            || issue_title.to_lowercase().starts_with("feat")
        {
            "feat"
        } else {
            "fix"
        }
    }

    pub async fn process_issue(&self) -> Result<()> {
        let issue = self.get_issue().await?;
        let style_guide = self.read_style_guide().await?;

        // Create branch name
        let prefix = self.determine_branch_prefix(
            &issue.title,
            &issue
                .labels
                .iter()
                .map(|l| l.name.clone())
                .collect::<Vec<_>>(),
        );
        let branch_name = format!("{}/{}", prefix, self.config.issue_number);
        let prompt = create_prompt(&issue, &style_guide);

        // Get Claude's response
        let mut request = CompleteRequest::default();
        request.prompt = format!("\n\nHuman: {}\n\nAssistant:", prompt);
        request.model = "claude-3-sonnet-20240229".to_string();
        request.max_tokens_to_sample = 2000;
        request.stop_sequences = Some(vec!["\n\nHuman:".to_string()]);

        let response = self.claude.complete(request).await?;

        // Create PR
        let (owner, repo) = self
            .config
            .repository
            .split_once('/')
            .context("Invalid repository format")?;

        let pr = self
            .github
            .pulls(owner, repo)
            .create(
                format!("[{}] {}", prefix.to_uppercase(), issue.title),
                branch_name,
                "main",
            )
            .body(format_pr_body(response.completion))
            .send()
            .await?;

        // Link PR to issue
        self.github
            .issues(owner, repo)
            .create_comment(issue.number as u64, format!("Created PR #{}", pr.number))
            .await?;

        Ok(())
    }
}
