import { Hono } from "hono"
import { API_ERROR_CODES } from "@skill-platform/api"
import type { InstallRepository } from "../../repositories/installs"
import type { SkillsRepository } from "../../repositories/skills"
import type { VersionRepository } from "../../repositories/versions"

export function createInvokeRoutes(
  skillsRepo: SkillsRepository,
  versionsRepo: VersionRepository,
  installsRepo: InstallRepository
) {
  const app = new Hono()

  app.post("/:id/invoke", async (c) => {
    const skillId = c.req.param("id")
    const versionParam = c.req.query("version")
    const startTime = Date.now()

    const skill = await skillsRepo.findById(skillId)
    if (!skill) {
      return c.json({ success: false, code: API_ERROR_CODES.SKILL_NOT_FOUND }, 404)
    }

    let versionRecord
    if (versionParam) {
      versionRecord = await versionsRepo.findBySkillAndVersion(skillId, versionParam)
    } else {
      versionRecord = await versionsRepo.findLatest(skillId)
    }

    if (!versionRecord) {
      return c.json({ success: false, code: API_ERROR_CODES.VERSION_NOT_FOUND }, 404)
    }

    let input: Record<string, unknown> = {}
    try {
      const body = await c.req.json()
      input = body ?? {}
    } catch {
      input = {}
    }

    const runtimeConfig = versionRecord.runtimeConfig ?? {}
    const latencyMs = Date.now() - startTime

    const response = {
      skillId: skill.skillId,
      version: versionRecord.version,
      invokedAt: new Date().toISOString(),
      runtimeType: skill.runtimeType,
      runtimeConfig,
      input,
      output: {
        result: "ok",
        note: "MVP invocation stub: integrate actual runtime here",
      },
      latencyMs,
    }

    return c.json({ success: true, data: response })
  })

  return app
}
