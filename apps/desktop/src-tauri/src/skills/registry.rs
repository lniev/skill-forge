use std::path::PathBuf;

use serde::{Deserialize, Serialize};

use crate::skills::error::{InstallError, Result};
use crate::skills::paths::home_dir;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "kebab-case")]
pub enum Agent {
    ClaudeCode,
    Codex,
    GeminiCli,
    Cursor,
    Windsurf,
    Roo,
    Trae,
}

#[derive(Debug, Clone, Serialize)]
pub struct AgentSpec {
    pub id: Agent,
    pub label: &'static str,
    pub skill_dir: &'static str,
    /// Optional CLI binary name. When set, the agent is considered installed
    /// only if the binary is found on PATH (in addition to its directory).
    pub binary: Option<&'static str>,
}

pub const AGENTS: &[AgentSpec] = &[
    AgentSpec {
        id: Agent::ClaudeCode,
        label: "Claude Code",
        skill_dir: ".claude/skills",
        binary: Some("claude"),
    },
    AgentSpec {
        id: Agent::Codex,
        label: "Codex",
        skill_dir: ".codex/skills",
        binary: Some("codex"),
    },
    AgentSpec {
        id: Agent::GeminiCli,
        label: "Gemini CLI",
        skill_dir: ".gemini/skills",
        binary: Some("gemini"),
    },
    AgentSpec {
        id: Agent::Cursor,
        label: "Cursor",
        skill_dir: ".cursor/skills",
        binary: None,
    },
    AgentSpec {
        id: Agent::Windsurf,
        label: "Windsurf",
        skill_dir: ".codeium/windsurf/skills",
        binary: None,
    },
    AgentSpec {
        id: Agent::Roo,
        label: "Roo",
        skill_dir: ".roo/skills",
        binary: Some("roo"),
    },
    AgentSpec {
        id: Agent::Trae,
        label: "Trae",
        skill_dir: ".trae/skills",
        binary: Some("trae"),
    },
];

pub fn spec(agent: Agent) -> &'static AgentSpec {
    AGENTS
        .iter()
        .find(|a| a.id == agent)
        .expect("agent in AGENTS")
}

pub fn agent_dir(agent: Agent) -> Result<PathBuf> {
    Ok(home_dir()?.join(spec(agent).skill_dir))
}

/// Detect whether the agent is installed.
///
/// For agents with a known CLI binary, we require the binary to be on PATH.
/// For editor-style agents without a CLI binary, we fall back to checking the
/// agent's home directory (e.g. `~/.cursor`).
pub fn is_agent_installed(agent: Agent) -> Result<bool> {
    let spec = spec(agent);

    if let Some(binary) = spec.binary {
        if which::which_global(binary).is_ok() {
            return Ok(true);
        }
    }

    let skill_dir = agent_dir(agent)?;
    let root = skill_dir
        .parent()
        .ok_or(InstallError::NoHomeDir)?
        .to_path_buf();
    Ok(root.exists())
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct DetectedAgent {
    pub id: Agent,
    pub label: &'static str,
    pub installed: bool,
}

pub fn detect_installed_agents() -> Result<Vec<DetectedAgent>> {
    let mut out = vec![];
    for spec in AGENTS {
        let installed = is_agent_installed(spec.id).unwrap_or(false);
        out.push(DetectedAgent {
            id: spec.id,
            label: spec.label,
            installed,
        });
    }
    out.sort_by(|a, b| b.installed.cmp(&a.installed).then(a.label.cmp(b.label)));
    Ok(out)
}
