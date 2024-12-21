#[derive(Debug, Serialize, Deserialize)]
pub struct CreateFileResponse {
  pub content: FileContent,
  pub commit: Commit,
}
