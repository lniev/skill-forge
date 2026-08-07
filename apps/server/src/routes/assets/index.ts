import { Hono } from "hono"
import path from "node:path"
import { API_ERROR_CODES } from "@skill-platform/api"
import type { SkillsRepository } from "../../repositories/skills"
import type { VersionRepository } from "../../repositories/versions"
import type { StorageProvider } from "../../services/storage"

export function createAssetRoutes(skillsRepo: SkillsRepository, versionsRepo: VersionRepository, storage: StorageProvider) {
  const app = new Hono()

  app.post("/:id/versions/:version/assets", async (c) => {
    const skillId = c.req.param("id")
    const version = c.req.param("version")

    const skill = await skillsRepo.findById(skillId)
    if (!skill) {
      return c.json({ success: false, code: API_ERROR_CODES.SKILL_NOT_FOUND }, 404)
    }

    const versionRecord = await versionsRepo.findBySkillAndVersion(skillId, version)
    if (!versionRecord) {
      return c.json({ success: false, code: API_ERROR_CODES.VERSION_NOT_FOUND }, 404)
    }

    const formData = await c.req.formData()
    const files = formData.getAll("file") as File[]
    const storedAssets = []

    for (const file of files) {
      if (!(file instanceof File)) continue
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const filename = file.name
      const contentType = file.type || undefined
      const asset = await storage.write(skill.skillId, version, filename, buffer, contentType)
      storedAssets.push(asset)
    }

    const currentAssetRefs = versionRecord.assetRefs ?? []
    const newAssetRefs = [...currentAssetRefs, ...storedAssets.map((asset) => ({ type: asset.type, path: asset.path }))]
    await versionsRepo.update(versionRecord.id, { assetRefs: newAssetRefs })

    return c.json({ success: true, data: storedAssets }, 201)
  })

  app.get("/:id/versions/:version/assets/:name", async (c) => {
    const skillId = c.req.param("id")
    const version = c.req.param("version")
    const name = c.req.param("name")

    const skill = await skillsRepo.findById(skillId)
    if (!skill) {
      return c.json({ success: false, code: API_ERROR_CODES.SKILL_NOT_FOUND }, 404)
    }

    const data = await storage.read(skill.skillId, version, name)
    if (!data) {
      return c.json({ success: false, code: API_ERROR_CODES.ASSET_NOT_FOUND }, 404)
    }

    const ext = path.extname(name).toLowerCase()
    const contentTypeMap: Record<string, string> = {
      ".txt": "text/plain",
      ".py": "text/plain",
      ".js": "text/plain",
      ".json": "application/json",
      ".jsonl": "application/json",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".svg": "image/svg+xml",
    }

    c.header("Content-Type", contentTypeMap[ext] ?? "application/octet-stream")
    return c.body(data as unknown as ReadableStream)
  })

  app.delete("/:id/versions/:version/assets/:name", async (c) => {
    const skillId = c.req.param("id")
    const version = c.req.param("version")
    const name = c.req.param("name")

    const skill = await skillsRepo.findById(skillId)
    if (!skill) {
      return c.json({ success: false, code: API_ERROR_CODES.SKILL_NOT_FOUND }, 404)
    }

    const versionRecord = await versionsRepo.findBySkillAndVersion(skillId, version)
    if (!versionRecord) {
      return c.json({ success: false, code: API_ERROR_CODES.VERSION_NOT_FOUND }, 404)
    }

    const removed = await storage.remove(skill.skillId, version, name)
    if (!removed) {
      return c.json({ success: false, code: API_ERROR_CODES.ASSET_NOT_FOUND }, 404)
    }

    const currentAssetRefs = versionRecord.assetRefs ?? []
    const newAssetRefs = currentAssetRefs.filter((ref) => !ref.path.endsWith(name))
    await versionsRepo.update(versionRecord.id, { assetRefs: newAssetRefs })

    return c.json({ success: true, data: null })
  })

  return app
}
