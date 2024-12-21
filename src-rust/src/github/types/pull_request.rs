#[derive(Debug, Serialize, Deserialize)]
pub struct PullRequest {
  pub number: i32,
  pub title: String,
  pub body: Option<String>,
  pub state: String,
  pub head: Reference,
  pub base: Reference,
  pub mergeable: Option<bool>,
  pub merged: bool,
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}
