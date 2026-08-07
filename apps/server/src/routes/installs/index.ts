import { zValidator } from "@hono/zod-validator"
import { createInstallSchema, updateInstallStatusSchema, API_ERROR_CODES } from "@skill-platform/api"
import { Hono } from "hono"
import { snowflakeId } from "../../lib/snowflake"
import type { InstallStatus } from "../../db/schema/index"
import type { InstallRepository } from "../../repositories/installs"
import type { VersionRepository } from "../../repositories/versions"

export function createInstallRoutes(installsRepo: InstallRepository, versionsRepo: VersionRepository) {
  const app = new Hono()

  app.get("/", async (c) => {
    const skillId = c.req.query("skillId") ?? undefined
    const appId = c.req.query("appId") ?? undefined
    const limit = Number(c.req.query("limit") ?? 20)
    const offset = Number(c.req.query("offset") ?? 0)
    const list = await installsRepo.list({ skillId, appId, limit, offset })
    return c.json({ success: true, data: list })
  })

  app.post("/:id/install", zValidator("json", createInstallSchema), async (c) => {
    const skillId = c.req.param("id")
    const body = c.req.valid("json")

    const versionRecord = await versionsRepo.findBySkillAndVersion(skillId, body.version)
    if (!versionRecord) {
      return c.json({ success: false, code: API_ERROR_CODES.VERSION_NOT_FOUND }, 404)
    }

    const now = new Date()
    const install = await installsRepo.create({
      id: snowflakeId(),
      skillId,
      version: body.version,
      targetAppId: body.targetAppId,
      targetEnv: body.targetEnv,
      customConfig: body.customConfig,
      permissions: body.permissions,
      status: "applying",
      createdAt: now,
    })

    return c.json({ success: true, data: install }, 201)
  })

  app.get("/:installId", async (c) => {
    const installId = c.req.param("installId")
    const install = await installsRepo.findById(installId)
    if (!install) {
      return c.json({ success: false, code: API_ERROR_CODES.INSTALL_NOT_FOUND }, 404)
    }
    return c.json({ success: true, data: install })
  })

  app.patch("/:installId/status", zValidator("json", updateInstallStatusSchema), async (c) => {
    const installId = c.req.param("installId")
    const { status } = c.req.valid("json")

    const install = await installsRepo.findById(installId)
    if (!install) {
      return c.json({ success: false, code: API_ERROR_CODES.INSTALL_NOT_FOUND }, 404)
    }

    const now = new Date()
    const updated = await installsRepo.update(installId, {
      status: status as InstallStatus,
      installedAt: status === "installed" ? now : install.installedAt,
    })

    return c.json({ success: true, data: updated })
  })

  app.get("/:installId/config", async (c) => {
    const installId = c.req.param("installId")
    const install = await installsRepo.findById(installId)
    if (!install) {
      return c.json({ success: false, code: API_ERROR_CODES.INSTALL_NOT_FOUND }, 404)
    }

    const versionRecord = await versionsRepo.findBySkillAndVersion(install.skillId, install.version)
    if (!versionRecord) {
      return c.json({ success: false, code: API_ERROR_CODES.VERSION_NOT_FOUND }, 404)
    }

    return c.json({
      success: true,
      data: {
        installId: install.id,
        skillId: install.skillId,
        version: install.version,
        runtimeConfig: versionRecord.runtimeConfig,
        inputSchema: versionRecord.inputSchema,
        outputSchema: versionRecord.outputSchema,
        dependencies: versionRecord.dependencies,
        permissions: install.permissions,
        customConfig: install.customConfig,
        assetRefs: versionRecord.assetRefs,
      },
    })
  })

  app.post("/:installId/approve", async (c) => {
    const installId = c.req.param("installId")
    const install = await installsRepo.findById(installId)
    if (!install) {
      return c.json({ success: false, code: API_ERROR_CODES.INSTALL_NOT_FOUND }, 404)
    }

    const updated = await installsRepo.update(installId, {
      status: "approved",
      installedAt: new Date(),
    })

    return c.json({ success: true, data: updated })
  })

  app.post("/:installId/reject", async (c) => {
    const installId = c.req.param("installId")
    const install = await installsRepo.findById(installId)
    if (!install) {
      return c.json({ success: false, code: API_ERROR_CODES.INSTALL_NOT_FOUND }, 404)
    }

    const updated = await installsRepo.update(installId, {
      status: "rejected",
    })

    return c.json({ success: true, data: updated })
  })

  return app
}
