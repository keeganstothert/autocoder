#[derive(Debug, Serialize, Deserialize)]
pub struct Issue {
  pub number: i32,
  pub title: String,
  pub body: Option<String>,
  pub state: String,
  pub labels: Vec<Label>,
  pub assignees: Vec<User>,
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}
