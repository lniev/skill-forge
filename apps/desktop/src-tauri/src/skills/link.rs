use std::fs;
use std::path::{Path, PathBuf};

use crate::skills::error::{InstallError, Result};
use crate::skills::paths::skill_canonical_dir;
use crate::skills::registry::{agent_dir, Agent};

pub fn link_skill(agent: Agent, skill_id: &str) -> Result<PathBuf> {
    let target = skill_canonical_dir(skill_id)?;
    let parent = agent_dir(agent)?;
    fs::create_dir_all(&parent)?;
    let link = parent.join(skill_id);

    fs::create_dir_all(&target)?;
    remove_link(&link)?;

    #[cfg(unix)]
    {
        std::os::unix::fs::symlink(&target, &link)?;
    }
    #[cfg(windows)]
    {
        junction::create(&link, &target).map_err(|e| InstallError::Junction(e.to_string()))?;
    }
    #[cfg(not(any(unix, windows)))]
    {
        return Err(InstallError::Junction("unsupported platform".into()));
    }

    Ok(link)
}

pub fn unlink_skill(agent: Agent, skill_id: &str) -> Result<()> {
    let link = agent_dir(agent)?.join(skill_id);
    remove_link(&link)
}

/// 检测指定 Agent 是否已经链接了某个 Skill。
pub fn is_linked(agent: Agent, skill_id: &str) -> Result<bool> {
    let link = agent_dir(agent)?.join(skill_id);
    Ok(link.exists() || symlink_metadata_exists(&link))
}

fn remove_link(link: &Path) -> Result<()> {
    if !link.exists() && !symlink_metadata_exists(link) {
        return Ok(());
    }

    let meta = fs::symlink_metadata(link)?;
    let ft = meta.file_type();

    if ft.is_symlink() {
        fs::remove_file(link)?;
        return Ok(());
    }

    #[cfg(windows)]
    {
        if junction::exists(link).unwrap_or(false) {
            junction::delete(link).map_err(|e| InstallError::Junction(e.to_string()))?;
            return Ok(());
        }
    }

    Err(InstallError::LinkExists(link.to_path_buf()))
}

fn symlink_metadata_exists(p: &Path) -> bool {
    p.symlink_metadata().is_ok()
}
