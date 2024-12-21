#[derive(Debug, Serialize, Deserialize)]
pub struct Label {
  pub name: String,
  pub color: String,
  pub description: Option<String>,
}
