import type { SkillInstall } from "@skill-platform/api"
import { invoke } from "@tauri-apps/api/core"
import { request, parseResponse } from "../request"
import { Agent } from "../../config/agents"

export type { SkillInstall }

export interface InstallSkillOptions {
  skillId: string
  version: string
  targetAppId?: string
  targetEnv?: "dev" | "staging" | "prod"
  customConfig?: Record<string, unknown>
  permissions?: string[]
}

export async function installSkill(options: InstallSkillOptions): Promise<SkillInstall> {
  const response = await request.post(`installs/${options.skillId}/install`, {
    json: {
      version: options.version,
      targetAppId: options.targetAppId ?? "desktop",
      targetEnv: options.targetEnv ?? "dev",
      customConfig: options.customConfig,
      permissions: options.permissions,
    },
  })
  return parseResponse<SkillInstall>(response)
}

export async function downloadAsset(
  skillId: string,
  version: string,
  filename: string
): Promise<Blob> {
  const response = await request.get(
    `skills/${skillId}/versions/${version}/assets/${encodeURIComponent(filename)}`
  )
  return response.blob()
}

export async function installSkillFile(
  skillId: string,
  version: string,
  relPath: string,
  bytes: Uint8Array
): Promise<string> {
  // Ensure the bytes are sent as a plain numeric array over Tauri's IPC.
  return invoke<string>("install_skill_file", {
    skillId,
    version,
    relPath,
    bytes: Array.from(bytes),
  })
}

export async function linkSkill(agent: Agent, skillId: string): Promise<string> {
  return invoke<string>("link_skill", { agent, skillId })
}

export async function uninstallSkill(skillId: string, agents: string[]): Promise<void> {
  return invoke<void>("uninstall_skill", { skillId, agents })
}

export async function openSkillDirectory(skillId: string): Promise<void> {
  return invoke<void>("open_skill_dir", { skillId })
}

export interface InstalledSkill {
  id?: string
  skillId: string
  name?: string
  version?: string
  author?: string
  category?: string
  subCategory?: string
  tags?: string[]
  iconUrl?: string
  shortDescription?: string
  description?: string
  runtimeType?: string
  installedAt?: string
  source?: string
  targetEnv?: string
  linkedAgents?: string[]
}

export async function listInstalledSkills(): Promise<InstalledSkill[]> {
  return invoke<InstalledSkill[]>("list_installed_skills")
}

export async function writeSkillMeta(
  skillId: string,
  meta: Omit<InstalledSkill, "skillId" | "linkedAgents">
): Promise<string> {
  return invoke<string>("write_skill_meta", { skillId, meta })
}

export interface DetectedAgent {
  id: Agent
  label: string
  installed: boolean
}

export async function detectInstalledAgents(): Promise<DetectedAgent[]> {
  return invoke<DetectedAgent[]>("detect_installed_agents")
}

export function saveFileToDisk(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
