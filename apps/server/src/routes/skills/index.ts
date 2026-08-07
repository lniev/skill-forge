import { zValidator } from "@hono/zod-validator"
import {
  createSkillSchema,
  createVersionSchema,
  createWithVersionSchema,
  setLatestSchema,
  updateSkillSchema,
  updateVersionSchema,
  API_ERROR_CODES,
  type CreateWithVersionPayload,
} from "@skill-platform/api"
import { Hono } from "hono"
import { snowflakeId } from "../../lib/snowflake"
import type { SkillStatus, RuntimeType, VersionStatus, Visibility } from "../../db/schema/index"
import type { SkillsRepository } from "../../repositories/skills"
import type { VersionRepository } from "../../repositories/versions"
import type { StorageProvider } from "../../services/storage"
import type { AuthVariables } from "../../middleware/auth"

function bumpVersion(version: string): string {
  const parts = version.split(".")
  const last = parts[parts.length - 1]
  const lastNum = Number(last)
  if (!Number.isNaN(lastNum)) {
    parts[parts.length - 1] = String(lastNum + 1)
    return parts.join(".")
  }
  return `${version}.1`
}

export function createSkillRoutes(skillsRepo: SkillsRepository, versionsRepo: VersionRepository, storage: StorageProvider) {
  const app = new Hono<{ Variables: AuthVariables }>()

  app.get("/", async (c) => {
    const query = c.req.query("query") ?? undefined
    const category = c.req.query("category") ?? undefined
    const subCategory = c.req.query("subCategory") ?? undefined
    const author = c.req.query("author") ?? undefined
    const userId = c.req.query("userId") ?? undefined
    const status = c.req.query("status") ?? undefined
    const sort = c.req.query("sort") ?? "hot"
    const limit = Number(c.req.query("limit") ?? 20)
    const offset = Number(c.req.query("offset") ?? 0)

    const validSortValues = ["hot", "newest", "mostUsed", "updatedAt", "createdAt", "name"] as const
    const validSort = validSortValues.includes(sort as (typeof validSortValues)[number]) ? sort : "hot"
    const { items, total } = await skillsRepo.list({
      query,
      category,
      subCategory,
      author,
      userId,
      status,
      sort: validSort as "hot" | "newest" | "mostUsed" | "updatedAt" | "createdAt" | "name",
      limit,
      offset,
    })

    return c.json({
      success: true,
      data: {
        items,
        total,
        limit,
        offset,
        hasMore: offset + items.length < total,
      },
    })
  })

  app.post("/", zValidator("json", createSkillSchema), async (c) => {
    const body = c.req.valid("json")
    const userId = c.get("userId")

    const existing = await skillsRepo.findBySkillId(body.skillId)
    if (existing) {
      return c.json({ success: false, code: API_ERROR_CODES.SKILL_ALREADY_EXISTS }, 409)
    }

    const now = new Date()
    const skill = await skillsRepo.create({
      id: snowflakeId(),
      skillId: body.skillId,
      name: body.name,
      shortDescription: body.shortDescription,
      description: body.description,
      author: userId,
      userId,
      category: body.category,
      subCategory: body.subCategory,
      tags: body.tags ?? [],
      iconUrl: body.iconUrl,
      runtimeType: body.runtimeType as RuntimeType,
      visibility: body.visibility as Visibility,
      status: (body.status as SkillStatus) ?? "draft",
      latestVersion: undefined,
      createdAt: now,
      updatedAt: now,
    })
    return c.json({ success: true, data: skill }, 201)
  })

  app.get("/:id", async (c) => {
    const id = c.req.param("id")
    const skill = await skillsRepo.findById(id)
    if (!skill) {
      return c.json({ success: false, code: API_ERROR_CODES.SKILL_NOT_FOUND }, 404)
    }
    return c.json({ success: true, data: skill })
  })

  app.patch("/:id", zValidator("json", updateSkillSchema), async (c) => {
    const id = c.req.param("id")
    const body = c.req.valid("json")
    const updateData: Partial<typeof body> & { updatedAt: Date; runtimeType?: RuntimeType; status?: SkillStatus; visibility?: Visibility } = {
      ...body,
      runtimeType: body.runtimeType as RuntimeType | undefined,
      status: body.status as SkillStatus | undefined,
      visibility: body.visibility as Visibility | undefined,
      updatedAt: new Date(),
    }
    const skill = await skillsRepo.update(id, updateData)
    if (!skill) {
      return c.json({ success: false, code: API_ERROR_CODES.SKILL_NOT_FOUND }, 404)
    }
    return c.json({ success: true, data: skill })
  })

  app.delete("/:id", async (c) => {
    const id = c.req.param("id")
    await skillsRepo.delete(id)
    return c.json({ success: true, data: null })
  })

  app.get("/:id/versions", async (c) => {
    const skillId = c.req.param("id")
    const list = await versionsRepo.listBySkill(skillId)
    return c.json({ success: true, data: list })
  })

  app.get("/:id/versions/:version", async (c) => {
    const skillId = c.req.param("id")
    const version = c.req.param("version")
    const record = await versionsRepo.findBySkillAndVersion(skillId, version)
    if (!record) {
      return c.json({ success: false, code: API_ERROR_CODES.VERSION_NOT_FOUND }, 404)
    }
    return c.json({ success: true, data: record })
  })

  app.get("/:id/edit-version", async (c) => {
    const skillId = c.req.param("id")

    const allVersions = await versionsRepo.listBySkill(skillId)
    if (allVersions.length === 0) {
      return c.json({ success: false, code: API_ERROR_CODES.NO_VERSIONS_FOUND }, 404)
    }

    const draft = allVersions.find((v) => v.status === "draft")
    if (draft) {
      return c.json({ success: true, data: draft })
    }

    const latest = allVersions[0]
    const newVersion = bumpVersion(latest.version)

    const newDraft = await versionsRepo.create({
      id: snowflakeId(),
      skillId,
      version: newVersion,
      runtimeConfig: latest.runtimeConfig,
      inputSchema: latest.inputSchema,
      outputSchema: latest.outputSchema,
      dependencies: latest.dependencies,
      permissions: latest.permissions,
      evaluation: latest.evaluation,
      assetRefs: latest.assetRefs,
      status: "draft",
      isLatest: false,
      publishedAt: undefined,
      createdAt: new Date(),
    })

    return c.json({ success: true, data: newDraft })
  })

  app.patch("/:id/versions/:version", zValidator("json", updateVersionSchema), async (c) => {
    const skillId = c.req.param("id")
    const version = c.req.param("version")
    const body = c.req.valid("json")

    const record = await versionsRepo.findBySkillAndVersion(skillId, version)
    if (!record) {
      return c.json({ success: false, code: API_ERROR_CODES.VERSION_NOT_FOUND }, 404)
    }

    const updated = await versionsRepo.update(record.id, {
      ...body,
      runtimeConfig: body.runtimeConfig,
      inputSchema: body.inputSchema,
      outputSchema: body.outputSchema,
      dependencies: body.dependencies,
      permissions: body.permissions,
      evaluation: body.evaluation,
      assetRefs: body.assetRefs,
    })

    if (!updated) {
      return c.json({ success: false, code: API_ERROR_CODES.VERSION_UPDATE_FAILED }, 500)
    }

    return c.json({ success: true, data: updated })
  })

  async function createSkillAndVersion(payload: CreateWithVersionPayload, files: File[] = [], userId?: string) {
    const { skill: skillBody, version: versionBody } = payload

    const existing = await skillsRepo.findBySkillId(skillBody.skillId)
    if (existing) {
      throw new Error(`Skill with skillId "${skillBody.skillId}" already exists`)
    }

    const now = new Date()
    const skill = await skillsRepo.create({
      id: snowflakeId(),
      skillId: skillBody.skillId,
      name: skillBody.name,
      shortDescription: skillBody.shortDescription,
      description: skillBody.description,
      author: userId,
      userId,
      category: skillBody.category,
      subCategory: skillBody.subCategory,
      tags: skillBody.tags ?? [],
      iconUrl: skillBody.iconUrl,
      runtimeType: skillBody.runtimeType as RuntimeType,
      visibility: skillBody.visibility as Visibility,
      status: (skillBody.status as SkillStatus) ?? "draft",
      latestVersion: versionBody.version,
      createdAt: now,
      updatedAt: now,
    })

    let version = await versionsRepo.create({
      id: snowflakeId(),
      skillId: skill.id,
      version: versionBody.version,
      runtimeConfig: versionBody.runtimeConfig,
      inputSchema: versionBody.inputSchema,
      outputSchema: versionBody.outputSchema,
      dependencies: versionBody.dependencies,
      permissions: versionBody.permissions,
      evaluation: versionBody.evaluation,
      assetRefs: versionBody.assetRefs,
      status: (versionBody.status as VersionStatus) ?? "draft",
      isLatest: false,
      createdAt: now,
    })

    const storedAssets = []
    for (const file of files) {
      if (!(file instanceof File)) continue
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const filename = file.name
      const contentType = file.type || undefined
      const asset = await storage.write(skill.skillId, version.version, filename, buffer, contentType)
      storedAssets.push(asset)
    }

    if (storedAssets.length > 0) {
      const currentAssetRefs = version.assetRefs ?? []
      const newAssetRefs = [
        ...currentAssetRefs,
        ...storedAssets.map((asset) => ({ type: asset.type, path: asset.path })),
      ]
      version = { ...version, assetRefs: newAssetRefs }
      await versionsRepo.update(version.id, { assetRefs: newAssetRefs })
    }

    return { skill, version, assets: storedAssets }
  }

  app.post("/create-with-version", async (c) => {
    const contentType = c.req.header("content-type") ?? ""

    let payload: CreateWithVersionPayload
    let files: File[] = []

    if (contentType.includes("multipart/form-data")) {
      const formData = await c.req.formData()

      const dataField = formData.get("data")
      if (typeof dataField !== "string") {
        return c.json({ success: false, code: API_ERROR_CODES.MISSING_DATA_FIELD }, 400)
      }

      try {
        payload = JSON.parse(dataField) as CreateWithVersionPayload
      } catch {
        return c.json({ success: false, code: API_ERROR_CODES.INVALID_DATA_JSON }, 400)
      }

      files = formData.getAll("file").filter((item): item is File => item instanceof File)
    } else {
      const parseResult = createWithVersionSchema.safeParse(await c.req.json())
      if (!parseResult.success) {
        return c.json({ success: false, message: parseResult.error.message }, 400)
      }
      payload = parseResult.data
    }

    const validateResult = createWithVersionSchema.safeParse(payload)
    if (!validateResult.success) {
      return c.json({ success: false, message: validateResult.error.message }, 400)
    }

    try {
      const userId = c.get("userId")
      const result = await createSkillAndVersion(validateResult.data, files, userId)
      return c.json({ success: true, data: result }, 201)
    } catch (error) {
      const message = error instanceof Error ? error.message : undefined
      return c.json({ success: false, code: API_ERROR_CODES.INTERNAL_ERROR, message }, 409)
    }
  })

  app.post("/:id/versions", zValidator("json", createVersionSchema), async (c) => {
    const skillId = c.req.param("id")
    const skill = await skillsRepo.findById(skillId)
    if (!skill) {
      return c.json({ success: false, code: API_ERROR_CODES.SKILL_NOT_FOUND }, 404)
    }

    const body = c.req.valid("json")
    const now = new Date()
    const version = await versionsRepo.create({
      id: snowflakeId(),
      skillId,
      version: body.version,
      runtimeConfig: body.runtimeConfig,
      inputSchema: body.inputSchema,
      outputSchema: body.outputSchema,
      dependencies: body.dependencies,
      permissions: body.permissions,
      evaluation: body.evaluation,
      assetRefs: body.assetRefs,
      status: (body.status as VersionStatus) ?? "draft",
      isLatest: false,
      createdAt: now,
    })

    return c.json({ success: true, data: version }, 201)
  })

  app.post("/:id/versions/:version/publish", async (c) => {
    const skillId = c.req.param("id")
    const version = c.req.param("version")
    const record = await versionsRepo.findBySkillAndVersion(skillId, version)
    if (!record) {
      return c.json({ success: false, code: API_ERROR_CODES.VERSION_NOT_FOUND }, 404)
    }

    await versionsRepo.update(record.id, {
      status: "stable",
      publishedAt: new Date(),
    })

    await versionsRepo.markLatest(skillId, record.id)
    await skillsRepo.update(skillId, {
      latestVersion: version,
      status: "published",
      updatedAt: new Date(),
    })

    const updated = await versionsRepo.findById(record.id)
    return c.json({ success: true, data: updated })
  })

  app.post("/:id/versions/:version/tags", zValidator("json", setLatestSchema), async (c) => {
    const skillId = c.req.param("id")
    const version = c.req.param("version")
    const { tag } = c.req.valid("json")

    const record = await versionsRepo.findBySkillAndVersion(skillId, version)
    if (!record) {
      return c.json({ success: false, code: API_ERROR_CODES.VERSION_NOT_FOUND }, 404)
    }

    if (tag === "latest") {
      await versionsRepo.markLatest(skillId, record.id)
      await skillsRepo.update(skillId, {
        latestVersion: version,
        updatedAt: new Date(),
      })
    }

    const status: VersionStatus = tag === "stable" ? "stable" : tag === "beta" ? "beta" : "stable"
    await versionsRepo.update(record.id, { status })

    const updated = await versionsRepo.findById(record.id)
    return c.json({ success: true, data: updated })
  })

  return app
}
