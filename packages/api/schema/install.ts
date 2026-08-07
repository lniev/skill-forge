import { z } from "zod"
import { installStatusSchema } from "./core.js"

/**
 * Skill 安装记录领域模型。
 * 对应数据库表 `skill_installs`。
 */
export const skillInstallSchema = z.object({
  id: z.string(),
  skillId: z.string(),
  version: z.string(),
  targetAppId: z.string(),
  targetEnv: z.enum(["dev", "staging", "prod"]),
  customConfig: z.record(z.unknown()).optional(),
  permissions: z.array(z.string()).optional(),
  status: installStatusSchema,
  installedAt: z.date().optional(),
  createdAt: z.coerce.date(),
})

/**
 * 创建 Skill 安装记录的入参校验 schema。
 * 用于 `POST /api/skills/:id/install`。
 */
export const createInstallSchema = z.object({
  version: z.string().min(1),
  targetAppId: z.string().min(1),
  targetEnv: z.enum(["dev", "staging", "prod"]).default("dev"),
  customConfig: z.record(z.unknown()).optional(),
  permissions: z.array(z.string()).optional(),
})

/**
 * 更新安装记录状态的入参校验 schema。
 * 用于 `PATCH /api/skills/:installId/status`。
 */
export const updateInstallStatusSchema = z.object({
  status: installStatusSchema,
})

/** Skill 安装记录领域模型。 */
export type SkillInstall = z.infer<typeof skillInstallSchema>

/** 创建 Skill 安装记录的请求 payload。 */
export type CreateInstallPayload = z.infer<typeof createInstallSchema>

/** 更新安装记录状态的请求 payload。 */
export type UpdateInstallStatusPayload = z.infer<typeof updateInstallStatusSchema>
