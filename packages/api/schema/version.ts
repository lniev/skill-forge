import { z } from "zod"
import { createSkillSchema } from "./skill.js"
import { assetRefSchema, skillDependencySchema, versionStatusSchema } from "./core.js"

/**
 * Skill 版本领域模型。
 * 对应数据库表 `skill_versions`。
 */
export const skillVersionSchema = z.object({
  id: z.string(),
  skillId: z.string(),
  version: z.string(),
  runtimeConfig: z.record(z.unknown()).optional(),
  inputSchema: z.array(z.record(z.unknown())).optional(),
  outputSchema: z.array(z.record(z.unknown())).optional(),
  dependencies: z.array(skillDependencySchema).optional(),
  permissions: z.array(z.string()).optional(),
  evaluation: z.record(z.string()).optional(),
  assetRefs: z.array(assetRefSchema).optional(),
  status: versionStatusSchema,
  isLatest: z.boolean(),
  publishedAt: z.date().optional(),
  createdAt: z.coerce.date(),
})

/**
 * 创建 Skill 版本的入参校验 schema。
 * 用于 `POST /api/skills/:id/versions`。
 */
export const createVersionSchema = z.object({
  version: z.string().min(1),
  runtimeConfig: z.record(z.unknown()).optional(),
  inputSchema: z.array(z.record(z.unknown())).optional(),
  outputSchema: z.array(z.record(z.unknown())).optional(),
  dependencies: z.array(skillDependencySchema).optional(),
  permissions: z.array(z.string()).optional(),
  evaluation: z.record(z.string()).optional(),
  assetRefs: z.array(assetRefSchema).optional(),
  status: versionStatusSchema.optional(),
})

/**
 * 更新 Skill 版本的入参校验 schema。
 */
export const updateVersionSchema = createVersionSchema.partial()

/**
 * 同时创建 Skill 和版本的入参校验 schema。
 * 用于 `POST /api/skills/create-with-version`。
 */
export const createWithVersionSchema = z.object({
  skill: createSkillSchema,
  version: createVersionSchema,
})

/**
 * 设置版本标签的入参校验 schema。
 * 用于 `POST /api/skills/:id/versions/:version/tags`。
 */
export const setLatestSchema = z.object({
  tag: z.enum(["latest", "stable", "beta"]),
})

/** Skill 版本领域模型。 */
export type SkillVersion = z.infer<typeof skillVersionSchema>

/** 创建 Skill 版本的请求 payload。 */
export type CreateVersionPayload = z.infer<typeof createVersionSchema>

/** 更新 Skill 版本的请求 payload。 */
export type UpdateVersionPayload = z.infer<typeof updateVersionSchema>

/** 同时创建 Skill 和版本的请求 payload。 */
export type CreateWithVersionPayload = z.infer<typeof createWithVersionSchema>

/** 设置版本标签的请求 payload。 */
export type SetLatestPayload = z.infer<typeof setLatestSchema>
