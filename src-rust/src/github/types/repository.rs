#[derive(Debug, Serialize, Deserialize)]
pub struct Repository {
  pub id: i64,
  pub name: String,
  pub full_name: String,
  pub private: bool,
  pub description: Option<String>,
  pub fork: bool,
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
  pub pushed_at: Option<DateTime<Utc>>,
  pub git_url: String,
  pub ssh_url: String,
  pub clone_url: String,
  pub default_branch: String,
}
