use crate::skills::discovery::{self, DiscoverableSkill, SkillRepo, SkillsShSearchResult};
use crate::skills::error::Result;
use crate::skills::fsops::{self, InstalledSkill};
use crate::skills::link;
use crate::skills::paths;
use crate::skills::registry::{Agent, DetectedAgent};

// Tauri 命令参数由前端以 camelCase 传入，这里保持参数名与前端一致。
#[tauri::command]
#[allow(non_snake_case)]
pub fn install_skill_file(
    skillId: String,
    version: String,
    relPath: String,
    bytes: Vec<u8>,
) -> Result<String> {
    let path = fsops::write_skill_file(&skillId, &version, &relPath, &bytes)?;
    Ok(path.to_string_lossy().into_owned())
}

#[tauri::command]
#[allow(non_snake_case)]
pub fn link_skill(agent: Agent, skillId: String) -> Result<String> {
    let path = link::link_skill(agent, &skillId)?;
    Ok(path.to_string_lossy().into_owned())
}

#[tauri::command]
#[allow(non_snake_case)]
pub fn uninstall_skill(skillId: String, agents: Vec<Agent>) -> Result<()> {
    for agent in agents {
        let _ = link::unlink_skill(agent, &skillId);
    }
    fsops::remove_skill(&skillId)
}

#[tauri::command]
pub fn list_installed_skills() -> Result<Vec<InstalledSkill>> {
    fsops::list_installed()
}

#[tauri::command]
#[allow(non_snake_case)]
pub fn write_skill_meta(
    skillId: String,
    mut meta: fsops::SkillMeta,
) -> Result<String> {
    meta.skill_id = Some(skillId.clone());
    let path = fsops::write_skill_meta(&skillId, &meta)?;
    Ok(path.to_string_lossy().into_owned())
}

#[tauri::command]
#[allow(non_snake_case)]
pub fn get_skill_dir(skillId: String) -> Result<String> {
    let path = paths::skill_canonical_dir(&skillId)?;
    Ok(path.to_string_lossy().into_owned())
}

#[tauri::command]
#[allow(non_snake_case)]
pub fn open_skill_dir(skillId: String) -> Result<()> {
    let path = paths::skill_canonical_dir(&skillId)?;
    opener::open(path).map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?;
    Ok(())
}

#[tauri::command]
pub fn detect_installed_agents() -> Result<Vec<DetectedAgent>> {
    crate::skills::registry::detect_installed_agents()
}

// ========== 三方仓库发现 ==========

#[tauri::command]
pub async fn install_discovered_skill(
    skill: DiscoverableSkill,
    agent: Agent,
) -> Result<String> {
    discovery::DiscoveryService::install_skill(&skill, agent)
        .await
        .map_err(|e| crate::skills::error::InstallError::Io(std::io::Error::new(
            std::io::ErrorKind::Other,
            e.to_string(),
        )))
}

#[tauri::command]
pub fn get_skill_repos(app: tauri::AppHandle) -> Result<Vec<SkillRepo>> {
    discovery::load_repos(&app)
}

#[tauri::command]
pub fn save_skill_repos(app: tauri::AppHandle, repos: Vec<SkillRepo>) -> Result<()> {
    discovery::save_repos(&app, repos)
}

#[tauri::command]
pub fn add_skill_repo(
    app: tauri::AppHandle,
    owner: String,
    name: String,
    branch: String,
    host: String,
    protocol: String,
) -> Result<()> {
    let mut repos = discovery::load_repos(&app)?;
    if let Some(existing) = repos.iter_mut().find(|r| r.owner == owner && r.name == name && r.host == host) {
        existing.branch = branch;
        existing.enabled = true;
        existing.protocol = protocol;
        return discovery::save_repos(&app, repos);
    }
    repos.push(SkillRepo {
        owner,
        name,
        branch,
        enabled: true,
        host,
        protocol,
    });
    discovery::save_repos(&app, repos)
}

#[tauri::command]
pub fn remove_skill_repo(app: tauri::AppHandle, owner: String, name: String, host: String) -> Result<()> {
    let mut repos = discovery::load_repos(&app)?;
    repos.retain(|r| !(r.owner == owner && r.name == name && r.host == host));
    discovery::save_repos(&app, repos)
}

#[tauri::command]
pub async fn discover_skills(app: tauri::AppHandle) -> Result<Vec<DiscoverableSkill>> {
    let repos = discovery::load_repos(&app)?;
    let enabled: Vec<_> = repos.into_iter().filter(|r| r.enabled).collect();
    discovery::DiscoveryService::discover_available(enabled)
        .await
        .map_err(|e| crate::skills::error::InstallError::Io(std::io::Error::new(
            std::io::ErrorKind::Other,
            e.to_string(),
        )))
}

#[tauri::command]
pub async fn search_skills_sh(query: String, limit: usize, offset: usize) -> Result<SkillsShSearchResult> {
    discovery::SkillsShService::search(&query, limit, offset)
        .await
        .map_err(|e| crate::skills::error::InstallError::Io(std::io::Error::new(
            std::io::ErrorKind::Other,
            e.to_string(),
        )))
}

#[tauri::command]
pub fn open_external_url(url: String) -> Result<()> {
    opener::open(&url).map_err(|e| crate::skills::error::InstallError::Io(std::io::Error::new(
        std::io::ErrorKind::Other,
        e.to_string(),
    )))
}

#[tauri::command]
pub async fn read_skill_readme(skill: DiscoverableSkill) -> Result<String> {
    discovery::DiscoveryService::read_skill_readme(&skill)
        .await
        .map_err(|e| crate::skills::error::InstallError::Io(std::io::Error::new(
            std::io::ErrorKind::Other,
            e.to_string(),
        )))
}
