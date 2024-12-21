#[derive(Debug, Serialize, Deserialize)]
pub struct Commit {
  pub sha: String,
  pub message: String,
  pub author: GitHubUser,
  pub committer: GitHubUser,
}
