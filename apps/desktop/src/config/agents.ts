export enum Agent {
  ClaudeCode = "claude-code",
  Codex = "codex",
  GeminiCli = "gemini-cli",
  Cursor = "cursor",
  Windsurf = "windsurf",
  Roo = "roo",
  Trae = "trae",
}

export interface AgentSpec {
  id: Agent
  label: string
  skillDir: string
}

export const AGENTS: AgentSpec[] = [
  { id: Agent.ClaudeCode, label: "Claude Code", skillDir: ".claude/skills" },
  { id: Agent.Codex,     label: "Codex",       skillDir: ".codex/skills" },
  { id: Agent.GeminiCli, label: "Gemini CLI",  skillDir: ".gemini/skills" },
  { id: Agent.Cursor,    label: "Cursor",      skillDir: ".cursor/skills" },
  { id: Agent.Windsurf,  label: "Windsurf",    skillDir: ".codeium/windsurf/skills" },
  { id: Agent.Roo,       label: "Roo",         skillDir: ".roo/skills" },
  { id: Agent.Trae,      label: "Trae",        skillDir: ".trae/skills" },
]
