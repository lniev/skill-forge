use std::path::PathBuf;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum InstallError {
    #[error("home directory could not be resolved")]
    NoHomeDir,
    #[error("invalid skill id: {0}")]
    InvalidSkillId(String),
    #[error("path escapes install root: {0}")]
    PathEscape(PathBuf),
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("json error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("link path already exists and is not a symlink: {0}")]
    LinkExists(PathBuf),
    #[cfg(windows)]
    #[error("windows junction unsupported: {0}")]
    Junction(String),
}

impl serde::Serialize for InstallError {
    fn serialize<S: serde::Serializer>(&self, s: S) -> std::result::Result<S::Ok, S::Error> {
        s.serialize_str(self.to_string().as_ref())
    }
}

pub type Result<T> = std::result::Result<T, InstallError>;
