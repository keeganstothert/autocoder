pub fn determine_branch_prefix(issue_title: &str, labels: &[String]) -> &'static str {
  if labels.iter().any(|l| l.contains("feature")) || issue_title.to_lowercase().starts_with("feat")
  {
    "feat"
  } else {
    "fix"
  }
}
