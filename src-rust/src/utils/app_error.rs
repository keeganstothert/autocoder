use std::{ffi::OsString, path::PathBuf};

use anthropic::{self, error::AnthropicError};
use anyhow;
use octocrab::Error as OctocrabError;
use serde::{ser::Serializer, Serialize};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
  #[error(transparent)]
  Io(#[from] std::io::Error),
  #[error(transparent)]
  Json(#[from] serde_json::Error),
  #[error(transparent)]
  TokioOneShot(#[from] tokio::sync::oneshot::error::RecvError),
  #[error(transparent)]
  Utf8(#[from] std::str::Utf8Error),
  #[error(transparent)]
  NulError(#[from] std::ffi::NulError),
  #[error(transparent)]
  FromUtf16Error(#[from] std::string::FromUtf16Error),
  #[error(transparent)]
  Octocrab(#[from] OctocrabError),
  #[error("Invalid UTF-8 in path: {}", .0.to_string_lossy())]
  InvalidUtf8Path(PathBuf),
  #[error("{0}")]
  Generic(String),
}

impl From<AnthropicError> for AppError {
  fn from(error: AnthropicError) -> Self {
    AppError::Generic(format!("Anthropic error: {}", error))
  }
}

impl From<anyhow::Error> for AppError {
  fn from(error: anyhow::Error) -> Self {
    AppError::Generic(error.to_string())
  }
}

impl From<OsString> for AppError {
  fn from(os_string: OsString) -> Self {
    AppError::InvalidUtf8Path(os_string.into())
  }
}

impl Serialize for AppError {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: Serializer,
  {
    serializer.serialize_str(self.to_string().as_ref())
  }
}
