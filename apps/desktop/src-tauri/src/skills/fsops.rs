use std::fs;
use std::io::Write;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};

use crate::skills::error::{InstallError, Result};
use crate::skills::link;
use crate::skills::paths::{agents_root, skill_canonical_dir};
use crate::skills::registry;

pub fn write_skill_file(
    skill_id: &str,
    _version: &str,
    rel_path: &str,
    bytes: &[u8],
) -> Result<PathBuf> {
    let root = skill_canonical_dir(skill_id)?;
    let dest = root.join(rel_path);

    if !dest.starts_with(&root) {
        return Err(InstallError::PathEscape(dest));
    }

    if let Some(parent) = dest.parent() {
        fs::create_dir_all(parent)?;
    }

    let tmp = dest.with_extension("tmp.part");
    {
        let mut f = fs::File::create(&tmp)?;
        f.write_all(bytes)?;
        f.sync_all()?;
    }
    fs::rename(&tmp, &dest)?;
    Ok(dest)
}

pub fn remove_skill(skill_id: &str) -> Result<()> {
    let dir = skill_canonical_dir(skill_id)?;
    if dir.exists() {
        fs::remove_dir_all(&dir)?;
    }
    Ok(())
}

/// 本地 Skill 元数据结构，写入 ~/.agents/skills/<skill_id>/skill.json。
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SkillMeta {
    #[serde(default)]
    pub id: Option<String>,
    #[serde(default)]
    pub skill_id: Option<String>,
    pub name: Option<String>,
    pub version: Option<String>,
    pub author: Option<String>,
    pub category: Option<String>,
    pub sub_category: Option<String>,
    pub tags: Option<Vec<String>>,
    pub icon_url: Option<String>,
    pub short_description: Option<String>,
    pub description: Option<String>,
    pub runtime_type: Option<String>,
    pub installed_at: Option<String>,
    pub source: Option<String>,
    pub target_env: Option<String>,
}

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InstalledSkill {
    pub id: Option<String>,
    pub skill_id: String,
    pub name: Option<String>,
    pub version: Option<String>,
    pub author: Option<String>,
    pub category: Option<String>,
    pub sub_category: Option<String>,
    pub tags: Option<Vec<String>>,
    pub icon_url: Option<String>,
    pub short_description: Option<String>,
    pub description: Option<String>,
    pub runtime_type: Option<String>,
    pub installed_at: Option<String>,
    pub source: Option<String>,
    pub target_env: Option<String>,
    pub linked_agents: Vec<String>,
}

pub fn list_installed() -> Result<Vec<InstalledSkill>> {
    let root = agents_root()?;
    if !root.exists() {
        return Ok(vec![]);
    }

    let mut out = vec![];
    for entry in fs::read_dir(&root)? {
        let entry = entry?;
        if !entry.file_type()?.is_dir() {
            continue;
        }
        let skill_id = entry.file_name().to_string_lossy().into_owned();
        let dir = root.join(&skill_id);
        let meta_path = dir.join("skill.json");

        let mut meta = SkillMeta {
            skill_id: Some(skill_id.clone()),
            ..Default::default()
        };

        if meta_path.exists() {
            if let Ok(content) = fs::read_to_string(&meta_path) {
                if let Ok(parsed) = serde_json::from_str::<SkillMeta>(&content) {
                    meta = parsed;
                }
            }
        }

        let linked_agents = detect_linked_agents(&skill_id)?;

        out.push(InstalledSkill {
            id: meta.id,
            skill_id,
            name: meta.name,
            version: meta.version,
            author: meta.author,
            category: meta.category,
            sub_category: meta.sub_category,
            tags: meta.tags,
            icon_url: meta.icon_url,
            short_description: meta.short_description,
            description: meta.description,
            runtime_type: meta.runtime_type,
            installed_at: meta.installed_at,
            source: meta.source,
            target_env: meta.target_env,
            linked_agents,
        });
    }
    out.sort_by(|a, b| a.skill_id.cmp(&b.skill_id));
    Ok(out)
}

/// 写入本地 Skill 元数据文件 skill.json。
pub fn write_skill_meta(skill_id: &str, meta: &SkillMeta) -> Result<PathBuf> {
    let root = skill_canonical_dir(skill_id)?;
    let dest = root.join("skill.json");
    fs::create_dir_all(&root)?;

    let tmp = dest.with_extension("tmp.part");
    {
        let mut f = fs::File::create(&tmp)?;
        let content = serde_json::to_string_pretty(meta)?;
        f.write_all(content.as_bytes())?;
        f.sync_all()?;
    }
    fs::rename(&tmp, &dest)?;
    Ok(dest)
}

fn detect_linked_agents(skill_id: &str) -> Result<Vec<String>> {
    let mut linked = Vec::new();
    for spec in registry::AGENTS {
        if link::is_linked(spec.id, skill_id).unwrap_or(false) {
            linked.push(serde_json::to_string(&spec.id)?.trim_matches('"').to_string());
        }
    }
    Ok(linked)
}
