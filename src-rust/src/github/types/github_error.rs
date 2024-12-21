// src/error.rs
use thiserror::Error;

#[derive(Error, Debug)]
pub enum GithubError {
  #[error("GitHub API error: {0}")]
  ApiError(String),

  #[error("Request error: {0}")]
  RequestError(#[from] reqwest::Error),

  #[error("Invalid input: {0}")]
  ValidationError(String),

  #[error("Authentication error")]
  AuthError,

  #[error("Resource not found")]
  NotFound,
}
