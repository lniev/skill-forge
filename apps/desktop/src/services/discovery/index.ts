import { invoke } from "@tauri-apps/api/core"
import { Agent } from "../../config/agents"

export interface SkillRepo {
  owner: string
  name: string
  branch: string
  enabled: boolean
  host: string
  protocol: string
}

export interface DiscoverableSkill {
  key: string
  name: string
  description: string
  directory: string
  readmeUrl?: string
  repoOwner: string
  repoName: string
  repoBranch: string
  repoHost: string
  repoProtocol: string
}

export interface SkillsShDiscoverableSkill {
  key: string
  name: string
  description: string
  directory: string
  repoOwner: string
  repoName: string
  repoBranch: string
  repoHost: string
  repoProtocol: string
  installs: number
  readmeUrl?: string
}

export interface SkillsShSearchResult {
  skills: SkillsShDiscoverableSkill[]
  totalCount: number
  query: string
}

export function getSkillRepos(): Promise<SkillRepo[]> {
  return invoke<SkillRepo[]>("get_skill_repos")
}

export function saveSkillRepos(repos: SkillRepo[]): Promise<void> {
  return invoke<void>("save_skill_repos", { repos })
}

export function addSkillRepo(owner: string, name: string, branch: string, host: string, protocol: string = "https"): Promise<void> {
  return invoke<void>("add_skill_repo", { owner, name, branch, host, protocol })
}

export function removeSkillRepo(owner: string, name: string, host: string): Promise<void> {
  return invoke<void>("remove_skill_repo", { owner, name, host })
}

export function discoverSkills(): Promise<DiscoverableSkill[]> {
  return invoke<DiscoverableSkill[]>("discover_skills")
}

export function searchSkillsSh(query: string, limit: number, offset: number): Promise<SkillsShSearchResult> {
  return invoke<SkillsShSearchResult>("search_skills_sh", { query, limit, offset })
}

export function installDiscoveredSkill(skill: DiscoverableSkill, agent: Agent): Promise<string> {
  return invoke<string>("install_discovered_skill", { skill, agent })
}

export function readSkillReadme(skill: DiscoverableSkill): Promise<string> {
  return invoke<string>("read_skill_readme", { skill })
}

export function openExternalUrl(url: string): Promise<void> {
  return invoke<void>("open_external_url", { url })
}
