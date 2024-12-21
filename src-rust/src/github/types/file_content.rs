#[derive(Debug, Serialize, Deserialize)]
pub struct FileContent {
  pub name: String,
  pub path: String,
  pub sha: String,
  pub size: i32,
  pub url: String,
  pub content: Option<String>,
  #[serde(rename = "type")]
  pub content_type: String,
  pub encoding: Option<String>,
}
