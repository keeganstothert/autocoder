#[derive(Debug, Serialize, Deserialize)]
pub struct Reference {
  pub label: String,
  pub ref_field: String,
  pub sha: String,
}
