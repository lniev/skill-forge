use std::path::PathBuf;

use crate::skills::error::{InstallError, Result};

pub fn home_dir() -> Result<PathBuf> {
    dirs::home_dir().ok_or(InstallError::NoHomeDir)
}

pub fn agents_root() -> Result<PathBuf> {
    Ok(home_dir()?.join(".agents").join("skills"))
}

pub fn skill_canonical_dir(skill_id: &str) -> Result<PathBuf> {
    sanitize(skill_id, |id| InstallError::InvalidSkillId(id.to_string()))?;
    Ok(agents_root()?.join(skill_id))
}

fn sanitize<F: FnOnce(&str) -> InstallError>(id: &str, make_err: F) -> Result<()> {
    if id.is_empty()
        || id.contains('/')
        || id.contains('\\')
        || id == "."
        || id == ".."
        || id.contains('\0')
        || id.chars().any(|c| c.is_control())
    {
        return Err(make_err(id));
    }
    Ok(())
}
