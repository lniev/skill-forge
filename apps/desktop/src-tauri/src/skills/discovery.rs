use std::collections::HashSet;
use std::fs;
use std::path::{Component, Path, PathBuf};

use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

use crate::skills::error::{InstallError, Result as SkillResult};
use crate::skills::fsops::{self, SkillMeta};
use crate::skills::link;
use crate::skills::paths;
use crate::skills::registry::Agent;

// ========== 数据结构 ==========

/// 技能仓库配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillRepo {
    pub owner: String,
    pub name: String,
    pub branch: String,
    pub enabled: bool,
    #[serde(default = "default_host")]
    pub host: String,
    #[serde(default = "default_protocol")]
    pub protocol: String,
}

fn default_host() -> String {
    "github.com".to_string()
}

fn default_protocol() -> String {
    "https".to_string()
}

/// 可发现的技能
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscoverableSkill {
    pub key: String,
    pub name: String,
    #[serde(default)]
    pub description: String,
    pub directory: String,
    pub readme_url: Option<String>,
    pub repo_owner: String,
    pub repo_name: String,
    pub repo_branch: String,
    pub repo_host: String,
    pub repo_protocol: String,
}

/// SKILL.md 元数据
#[derive(Debug, Clone, Deserialize, Default)]
pub struct SkillMetadata {
    pub name: Option<String>,
    pub description: Option<String>,
}

// ========== 仓库配置持久化 ==========

const REPO_STORE_KEY: &str = "skill-repos";
const STORE_PATH: &str = "skill-repos.json";

pub fn load_repos(app: &AppHandle) -> SkillResult<Vec<SkillRepo>> {
    let store = app.store(STORE_PATH).map_err(io_error)?;

    if let Some(value) = store.get(REPO_STORE_KEY) {
        let repos: Vec<SkillRepo> = serde_json::from_value(value).map_err(io_error)?;
        if !repos.is_empty() {
            eprintln!("[discovery] loaded {} repos from store", repos.len());
            return Ok(repos);
        }
        eprintln!("[discovery] store repos empty, using defaults");
    }

    let default = default_repos();
    save_repos_inner(&store, &default)?;
    Ok(default)
}

pub fn save_repos(app: &AppHandle, repos: Vec<SkillRepo>) -> SkillResult<()> {
    let store = app.store(STORE_PATH).map_err(io_error)?;
    save_repos_inner(&store, &repos)
}

fn save_repos_inner(store: &tauri_plugin_store::Store<tauri::Wry>, repos: &[SkillRepo]) -> SkillResult<()> {
    let value = serde_json::to_value(repos).map_err(io_error)?;
    store.set(REPO_STORE_KEY, value);
    store.save().map_err(io_error)?;
    Ok(())
}

fn io_error<E: ToString>(e: E) -> InstallError {
    InstallError::Io(std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))
}

fn default_repos() -> Vec<SkillRepo> {
    vec![
        SkillRepo {
            owner: "anthropics".to_string(),
            name: "skills".to_string(),
            branch: "main".to_string(),
            enabled: true,
            host: "github.com".to_string(),
            protocol: "https".to_string(),
        },
        SkillRepo {
            owner: "ComposioHQ".to_string(),
            name: "awesome-claude-skills".to_string(),
            branch: "master".to_string(),
            enabled: true,
            host: "github.com".to_string(),
            protocol: "https".to_string(),
        },
    ]
}

// ========== 发现逻辑 ==========

pub struct DiscoveryService;

impl DiscoveryService {
    /// 列出所有可发现的技能
    pub async fn discover_available(repos: Vec<SkillRepo>) -> Result<Vec<DiscoverableSkill>> {
        let enabled: Vec<_> = repos.into_iter().filter(|r| r.enabled).collect();
        let mut skills = Vec::new();

        for repo in enabled {
            match Self::fetch_repo_skills(&repo).await {
                Ok(repo_skills) => skills.extend(repo_skills),
                Err(e) => {
                    eprintln!("获取仓库 {}/{} 技能失败: {}", repo.owner, repo.name, e);
                }
            }
        }

        Self::deduplicate(&mut skills);
        skills.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));

        Ok(skills)
    }

    async fn fetch_repo_skills(repo: &SkillRepo) -> Result<Vec<DiscoverableSkill>> {
        let temp_dir = tempfile::tempdir()?;
        let temp_path = temp_dir.path();

        let branch = Self::download_repo(repo, temp_path).await?;
        let mut resolved_repo = repo.clone();
        resolved_repo.branch = branch;

        let mut skills = Vec::new();
        Self::scan_dir_recursive(temp_path, temp_path, &resolved_repo, &mut skills)?;
        Ok(skills)
    }

    /// 为已知 host 生成 archive URL；未知 host 返回 None
    fn build_archive_url(protocol: &str, host: &str, owner: &str, name: &str, branch: &str) -> Option<String> {
        match host.to_lowercase().as_str() {
            "github.com" => Some(format!(
                "{protocol}://github.com/{owner}/{name}/archive/refs/heads/{branch}.zip"
            )),
            "gitlab.com" => Some(format!(
                "{protocol}://gitlab.com/{owner}/{name}/-/archive/{branch}/{name}-{branch}.zip"
            )),
            "gitee.com" => Some(format!(
                "{protocol}://gitee.com/{owner}/{name}/repository/archive/{branch}.zip"
            )),
            _ => None,
        }
    }

    /// 为未知 host 生成可能的 archive URL 列表：先 GitHub 风格，再 GitLab 风格
    fn guess_archive_urls(protocol: &str, host: &str, owner: &str, name: &str, branch: &str) -> Vec<String> {
        vec![
            // GitHub / Gitea 风格
            format!("{protocol}://{host}/{owner}/{name}/archive/refs/heads/{branch}.zip"),
            // GitLab 风格
            format!("{protocol}://{host}/{owner}/{name}/-/archive/{branch}/{name}-{branch}.zip"),
        ]
    }

    async fn download_repo(repo: &SkillRepo, dest: &Path) -> Result<String> {
        eprintln!("[discovery] downloading repo: {}/{} @ {} (host: {})", repo.owner, repo.name, repo.branch, repo.host);
        let mut branches = Vec::new();
        if !repo.branch.is_empty() && repo.branch.to_lowercase() != "head" {
            branches.push(repo.branch.as_str());
        }
        if !branches.contains(&"main") {
            branches.push("main");
        }
        if !branches.contains(&"master") {
            branches.push("master");
        }

        let mut last_error: Option<anyhow::Error> = None;

        for branch in branches {
            let urls: Vec<String> = if let Some(url) = Self::build_archive_url(&repo.protocol, &repo.host, &repo.owner, &repo.name, branch) {
                vec![url]
            } else {
                Self::guess_archive_urls(&repo.protocol, &repo.host, &repo.owner, &repo.name, branch)
            };

            for url in urls {
                eprintln!("[discovery] trying archive URL: {}", url);
                match Self::download_and_extract(&url, dest).await {
                    Ok(_) => {
                        eprintln!("[discovery] downloaded and extracted to: {}", dest.display());
                        return Ok(branch.to_string());
                    }
                    Err(e) => {
                        eprintln!("[discovery] archive failed: {} -> {}", url, e);
                        let _ = fs::remove_dir_all(dest);
                        let _ = fs::create_dir_all(dest);
                        last_error = Some(e);
                    }
                }
            }
            eprintln!("[discovery] all archive URL attempts failed for branch {}", branch);
        }

        Err(last_error.unwrap_or_else(|| anyhow!("所有分支下载失败")))
    }

    async fn download_and_extract(url: &str, dest: &Path) -> Result<()> {
        let client = reqwest::Client::new();
        let response = client.get(url).send().await?;

        if !response.status().is_success() {
            anyhow::bail!("下载失败: HTTP {}", response.status());
        }

        let bytes = response.bytes().await?;
        let cursor = std::io::Cursor::new(bytes);
        let archive = zip::ZipArchive::new(cursor)?;
        Self::extract_repo_archive(archive, dest)?;
        Ok(())
    }

    fn extract_repo_archive<R: std::io::Read + std::io::Seek>(
        mut archive: zip::ZipArchive<R>,
        dest: &Path,
    ) -> Result<()> {
        let root_name = if !archive.is_empty() {
            let first = archive.by_index(0)?;
            first.name().split('/').next().unwrap_or("").to_string()
        } else {
            anyhow::bail!("空归档");
        };

        for i in 0..archive.len() {
            let mut file = archive.by_index(i)?;
            let Some(safe_path) = file.enclosed_name() else {
                continue;
            };

            let relative = match safe_path.strip_prefix(&root_name) {
                Ok(r) => r,
                Err(_) => continue,
            };

            if relative.components().any(|c| matches!(c, Component::ParentDir)) {
                continue;
            }

            let outpath = dest.join(relative);
            if file.is_dir() {
                fs::create_dir_all(&outpath)?;
            } else {
                if let Some(parent) = outpath.parent() {
                    fs::create_dir_all(parent)?;
                }
                let mut outfile = fs::File::create(&outpath)?;
                std::io::copy(&mut file, &mut outfile)?;
            }
        }

        Ok(())
    }

    fn scan_dir_recursive(
        current_dir: &Path,
        base_dir: &Path,
        repo: &SkillRepo,
        skills: &mut Vec<DiscoverableSkill>,
    ) -> Result<()> {
        eprintln!("[discovery] scanning: {}", current_dir.display());
        let skill_md = current_dir.join("SKILL.md");

        if skill_md.exists() {
            eprintln!("[discovery] found SKILL.md: {}", skill_md.display());
            let directory = if current_dir == base_dir {
                repo.name.clone()
            } else {
                current_dir
                    .strip_prefix(base_dir)
                    .unwrap_or(current_dir)
                    .to_string_lossy()
                    .replace('\\', "/")
            };

            let doc_path = skill_md
                .strip_prefix(base_dir)
                .unwrap_or(skill_md.as_path())
                .to_string_lossy()
                .replace('\\', "/");

            if let Ok(skill) = Self::build_skill_from_metadata(&skill_md, &directory, &doc_path, repo) {
                skills.push(skill);
            }

            return Ok(());
        }

        for entry in fs::read_dir(current_dir)? {
            let entry = entry?;
            let path = entry.path();
            if path.is_dir() {
                Self::scan_dir_recursive(&path, base_dir, repo, skills)?;
            }
        }

        Ok(())
    }

    fn build_skill_from_metadata(
        skill_md: &Path,
        directory: &str,
        doc_path: &str,
        repo: &SkillRepo,
    ) -> Result<DiscoverableSkill> {
        let meta = Self::parse_skill_metadata(skill_md)?;

        let readme_url = if repo.host == "github.com" {
            Some(format!(
                "https://github.com/{}/{}/blob/{}/{}",
                repo.owner, repo.name, repo.branch, doc_path
            ))
        } else if repo.host == "gitlab.com" {
            Some(format!(
                "https://gitlab.com/{}/{}/-/blob/{}/{}",
                repo.owner, repo.name, repo.branch, doc_path
            ))
        } else {
            Some(format!(
                "{}://{}/{}/{}/blob/{}/{}",
                repo.protocol, repo.host, repo.owner, repo.name, repo.branch, doc_path
            ))
        };

        Ok(DiscoverableSkill {
            key: format!("{}/{}/{}", repo.owner, repo.name, directory),
            name: meta.name.unwrap_or_else(|| directory.to_string()),
            description: meta.description.unwrap_or_default(),
            directory: directory.to_string(),
            readme_url,
            repo_owner: repo.owner.clone(),
            repo_name: repo.name.clone(),
            repo_branch: repo.branch.clone(),
            repo_host: repo.host.clone(),
            repo_protocol: repo.protocol.clone(),
        })
    }

    fn parse_skill_metadata(path: &Path) -> Result<SkillMetadata> {
        let content = fs::read_to_string(path)?;
        let content = content.trim_start_matches('\u{feff}');

        let parts: Vec<&str> = content.splitn(3, "---").collect();
        if parts.len() < 3 {
            return Ok(SkillMetadata::default());
        }

        let front_matter = parts[1].trim();
        let meta: SkillMetadata = serde_yaml::from_str(front_matter)
            .unwrap_or_else(|_| SkillMetadata::default());

        Ok(meta)
    }

    fn deduplicate(skills: &mut Vec<DiscoverableSkill>) {
        let mut seen = HashSet::new();
        skills.retain(|s| seen.insert(s.key.clone()));
    }

    /// 安装发现的 skill 到本地
    pub async fn install_skill(skill: &DiscoverableSkill, agent: Agent) -> Result<String> {
        let repo = SkillRepo {
            owner: skill.repo_owner.clone(),
            name: skill.repo_name.clone(),
            branch: skill.repo_branch.clone(),
            enabled: true,
            host: skill.repo_host.clone(),
            protocol: skill.repo_protocol.clone(),
        };

        let temp_dir = tempfile::tempdir()?;
        let temp_path = temp_dir.path();
        let _branch = Self::download_repo(&repo, temp_path).await?;

        let source_dir = Self::resolve_skill_source_dir(temp_path, &skill.directory)
            .ok_or_else(|| anyhow!("未找到 skill 源目录: {}", skill.directory))?;

        let skill_id = Self::derive_skill_id(&skill.directory)?;
        let dest_dir = paths::skill_canonical_dir(&skill_id)?;

        if dest_dir.exists() {
            fs::remove_dir_all(&dest_dir)?;
        }
        fs::create_dir_all(&dest_dir)?;

        Self::copy_dir_recursive(&source_dir, &dest_dir)?;

        let meta = SkillMeta {
            id: Some(skill_id.clone()),
            skill_id: Some(skill_id.clone()),
            name: Some(skill.name.clone()),
            description: Some(skill.description.clone()),
            source: Some("third-party-repo".to_string()),
            installed_at: Some(chrono::Utc::now().to_rfc3339()),
            ..Default::default()
        };
        fsops::write_skill_meta(&skill_id, &meta)?;

        link::link_skill(agent, &skill_id)?;

        Ok(skill_id)
    }

    fn resolve_skill_source_dir(root: &Path, directory: &str) -> Option<PathBuf> {
        let direct = root.join(directory);
        if direct.is_dir() && direct.join("SKILL.md").is_file() {
            return Some(direct);
        }

        let install_name = directory
            .split('/')
            .last()
            .or(directory.split('\\').last())?;
        Self::find_skill_dir_by_name(root, install_name)
    }

    fn find_skill_dir_by_name(root: &Path, name: &str) -> Option<PathBuf> {
        for entry in fs::read_dir(root).ok()? {
            let entry = entry.ok()?;
            let path = entry.path();
            if path.is_dir() {
                if path.file_name()?.to_string_lossy() == name {
                    if path.join("SKILL.md").is_file() {
                        return Some(path);
                    }
                }
                if let Some(found) = Self::find_skill_dir_by_name(&path, name) {
                    return Some(found);
                }
            }
        }
        None
    }

    fn derive_skill_id(directory: &str) -> Result<String> {
        let name = directory
            .split('/')
            .last()
            .or(directory.split('\\').last())
            .unwrap_or(directory);
        let sanitized: String = name
            .chars()
            .map(|c| {
                if c.is_alphanumeric() || c == '-' || c == '_' {
                    c
                } else {
                    '-'
                }
            })
            .collect();
        if sanitized.is_empty() || sanitized == "." || sanitized == ".." {
            anyhow::bail!("非法的 skill id: {}", directory);
        }
        Ok(sanitized)
    }

    fn copy_dir_recursive(source: &Path, dest: &Path) -> Result<()> {
        fs::create_dir_all(dest)?;
        for entry in fs::read_dir(source)? {
            let entry = entry?;
            let path = entry.path();
            let file_name = path.file_name().ok_or_else(|| anyhow!("invalid path"))?;
            let dest_path = dest.join(file_name);

            if path.is_dir() {
                Self::copy_dir_recursive(&path, &dest_path)?;
            } else {
                fs::copy(&path, &dest_path)?;
            }
        }
        Ok(())
    }

    /// 读取 skill 的 SKILL.md 内容
    pub async fn read_skill_readme(skill: &DiscoverableSkill) -> Result<String> {
        let repo = SkillRepo {
            owner: skill.repo_owner.clone(),
            name: skill.repo_name.clone(),
            branch: skill.repo_branch.clone(),
            enabled: true,
            host: skill.repo_host.clone(),
            protocol: skill.repo_protocol.clone(),
        };

        let temp_dir = tempfile::tempdir()?;
        let temp_path = temp_dir.path();
        let _branch = Self::download_repo(&repo, temp_path).await?;

        let source_dir = Self::resolve_skill_source_dir(temp_path, &skill.directory)
            .ok_or_else(|| anyhow!("未找到 skill 源目录: {}", skill.directory))?;

        let skill_md = source_dir.join("SKILL.md");
        if !skill_md.exists() {
            anyhow::bail!("该 skill 没有 SKILL.md");
        }

        let content = fs::read_to_string(&skill_md)?;
        Ok(content)
    }
}

// ========== skills.sh 搜索 ==========
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillsShSearchResult {
    pub skills: Vec<SkillsShDiscoverableSkill>,
    pub total_count: usize,
    pub query: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillsShDiscoverableSkill {
    pub key: String,
    pub name: String,
    pub description: String,
    pub directory: String,
    pub repo_owner: String,
    pub repo_name: String,
    pub repo_branch: String,
    pub repo_host: String,
    pub repo_protocol: String,
    pub installs: u64,
    pub readme_url: Option<String>,
}

pub struct SkillsShService;

struct SkillsShSourceInfo {
    protocol: String,
    host: String,
    owner: String,
    name: String,
}

impl SkillsShService {
    fn parse_skills_sh_source(source: &str, id: &str) -> Result<SkillsShSourceInfo> {
        let trimmed = source.trim();

        // 优先从 source 字段解析
        if let Some(info) = Self::parse_source_str(trimmed) {
            return Ok(info);
        }

        // source 无法解析时，从 id（例如 owner/repo/skill-id）兜底，取前两层作为仓库
        let id_trimmed = id.trim();
        if !id_trimmed.is_empty() {
            if let Some(info) = Self::parse_source_str(id_trimmed) {
                return Ok(info);
            }
        }

        anyhow::bail!("无法从 source ({}) 或 id ({}) 解析出仓库信息", source, id)
    }

    fn parse_source_str(trimmed: &str) -> Option<SkillsShSourceInfo> {
        if trimmed.is_empty() || trimmed == "/" {
            return None;
        }

        // https://host/owner/name 或 https://host/owner/name.git
        if trimmed.starts_with("http://") || trimmed.starts_with("https://") {
            let without_protocol = trimmed.split_once("://").map(|s| s.1).unwrap_or(trimmed);
            let protocol = if trimmed.starts_with("http://") { "http" } else { "https" };
            let parts: Vec<&str> = without_protocol.split('/').collect();
            if parts.len() >= 3 && !parts[1].is_empty() && !parts[2].is_empty() {
                return Some(SkillsShSourceInfo {
                    protocol: protocol.to_string(),
                    host: parts[0].to_string(),
                    owner: parts[1].to_string(),
                    name: parts[2].replace(".git", ""),
                });
            }
        }

        // git@host:owner/name.git
        if trimmed.starts_with("git@") {
            let without_prefix = &trimmed[4..];
            if let Some((host, rest)) = without_prefix.split_once(':') {
                let parts: Vec<&str> = rest.split('/').collect();
                if parts.len() >= 2 && !parts[0].is_empty() && !parts[1].is_empty() {
                    return Some(SkillsShSourceInfo {
                        protocol: "https".to_string(),
                        host: host.to_string(),
                        owner: parts[0].to_string(),
                        name: parts[1].replace(".git", ""),
                    });
                }
            }
        }

        // owner/name 或 owner/name.git，允许 trailing slash 和更多路径段
        let parts: Vec<&str> = trimmed.split('/').collect();
        if parts.len() >= 2 && !parts[0].is_empty() && !parts[1].is_empty() {
            return Some(SkillsShSourceInfo {
                protocol: "https".to_string(),
                host: "github.com".to_string(),
                owner: parts[0].to_string(),
                name: parts[1].replace(".git", ""),
            });
        }

        None
    }
    pub async fn search(query: &str, limit: usize, offset: usize) -> Result<SkillsShSearchResult> {
        let client = reqwest::Client::new();
        let url = format!(
            "https://skills.sh/api/search?q={}&limit={}&offset={}",
            urlencoding::encode(query),
            limit,
            offset
        );

        let response = client.get(&url).send().await?;
        if !response.status().is_success() {
            anyhow::bail!("skills.sh 搜索失败: HTTP {}", response.status());
        }

        let content_type = response
            .headers()
            .get(reqwest::header::CONTENT_TYPE)
            .and_then(|v| v.to_str().ok())
            .unwrap_or("unknown");
        if !content_type.contains("application/json") {
            anyhow::bail!(
                "skills.sh 搜索返回非 JSON 响应 (Content-Type: {})",
                content_type
            );
        }

        let data: SkillsShApiResponse = response.json().await?;

        let skills = data.skills.into_iter().filter_map(|s| {
            let source = match Self::parse_skills_sh_source(&s.source, &s.id) {
                Ok(info) => info,
                Err(e) => {
                    eprintln!("[discovery] 解析 source 失败: {} (source={}, id={})", e, s.source, s.id);
                    return None;
                }
            };
            Some(SkillsShDiscoverableSkill {
                key: s.skill_id.clone(),
                name: s.name,
                description: String::new(),
                directory: s.skill_id.clone(),
                repo_owner: source.owner,
                repo_name: source.name,
                repo_branch: "main".to_string(),
                repo_host: source.host,
                repo_protocol: source.protocol,
                installs: s.installs,
                readme_url: Some(format!("https://skills.sh/skill/{}", s.skill_id)),
            })
        }).collect();

        Ok(SkillsShSearchResult {
            skills,
            total_count: data.count,
            query: data.query,
        })
    }
}

#[derive(Debug, Clone, Deserialize)]
struct SkillsShApiResponse {
    query: String,
    #[serde(rename = "searchType")]
    _search_type: String,
    skills: Vec<SkillsShApiSkill>,
    count: usize,
    #[allow(dead_code)]
    duration_ms: u64,
}

#[derive(Debug, Clone, Deserialize)]
struct SkillsShApiSkill {
    id: String,
    #[serde(rename = "skillId")]
    skill_id: String,
    name: String,
    installs: u64,
    source: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_fetch_anthropics_skills() {
        let repo = SkillRepo {
            owner: "anthropics".to_string(),
            name: "skills".to_string(),
            branch: "main".to_string(),
            enabled: true,
        };
        let skills = DiscoveryService::fetch_repo_skills(&repo).await.unwrap();
        eprintln!("discovered {} skills", skills.len());
        for skill in &skills[..3.min(skills.len())] {
            eprintln!("  - {}: {}", skill.name, skill.directory);
        }
        assert!(!skills.is_empty(), "should discover skills from anthropics/skills");
    }
}
