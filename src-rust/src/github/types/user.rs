#[derive(Debug, Serialize, Deserialize)]
pub struct User {
  pub login: String,
  pub id: i64,
  pub avatar_url: String,
  pub url: String,
}
