import { z } from "zod"
import { runtimeTypeSchema, skillStatusSchema, visibilitySchema } from "./core.js"

/**
 * Skill 领域模型。
 * 对应数据库表 `skills`，是前后端共享的核心数据契约。
 */
export const skillSchema = z.object({
  id: z.string(),
  skillId: z.string(),
  name: z.string(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  author: z.string().optional(),
  category: z.string().optional(),
  subCategory: z.string().optional(),
  tags: z.array(z.string()).optional(),
  iconUrl: z.string().optional(),
  runtimeType: runtimeTypeSchema.optional(),
  visibility: visibilitySchema.optional(),
  status: skillStatusSchema,
  latestVersion: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

/**
 * 创建 Skill 的入参校验 schema。
 * 用于 `POST /api/skills`。
 */
export const createSkillSchema = z.object({
  skillId: z.string().min(1),
  name: z.string().min(1),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  author: z.string().optional(),
  category: z.string().optional(),
  subCategory: z.string().optional(),
  tags: z.array(z.string()).optional(),
  iconUrl: z.string().optional(),
  runtimeType: runtimeTypeSchema.optional(),
  visibility: visibilitySchema.optional(),
  status: skillStatusSchema.optional(),
})

/**
 * 更新 Skill 的入参校验 schema。
 * `skillId` 不可修改。
 */
export const updateSkillSchema = createSkillSchema.partial().omit({ skillId: true })

/** Skill 领域模型。 */
export type Skill = z.infer<typeof skillSchema>

/** 列表页展示用的 Skill 项，包含统计字段。 */
export interface SkillListItem extends Skill {
  downloadCount: number
}

/** 创建 Skill 的请求 payload。 */
export type CreateSkillPayload = z.infer<typeof createSkillSchema>

/** 更新 Skill 的请求 payload。 */
export type UpdateSkillPayload = z.infer<typeof updateSkillSchema>
