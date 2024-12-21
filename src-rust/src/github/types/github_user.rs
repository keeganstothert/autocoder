#[derive(Debug, Serialize, Deserialize)]
pub struct GitHubUser {
  pub name: String,
  pub email: String,
  pub date: DateTime<Utc>,
}
