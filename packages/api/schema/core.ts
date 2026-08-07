import { z } from "zod"

/**
 * Skill 的运行时类型。
 * 决定 Skill 在运行侧以何种方式执行。
 */
export const runtimeTypeSchema = z.enum(["llm_prompt", "python_script", "api_call", "workflow"])

/**
 * Skill 生命周期状态。
 */
export const skillStatusSchema = z.enum(["draft", "pending_review", "published", "deprecated"])

/**
 * Skill 版本生命周期状态。
 */
export const versionStatusSchema = z.enum(["draft", "beta", "stable", "deprecated"])

/**
 * Skill 安装记录状态。
 */
export const installStatusSchema = z.enum(["applying", "approved", "rejected", "installed", "uninstalled"])

/**
 * Skill 可见性范围。
 * - public：公开
 * - private：仅自己可见
 * - team：团队内可见
 */
export const visibilitySchema = z.enum(["public", "private", "team"])

/**
 * 版本关联的资源引用，例如 prompt 文件、图标、脚本等。
 * @property type - 资源类型，由前端/业务方自定义，例如 "prompt" | "icon"
 * @property path - 资源在存储中的路径
 */
export const assetRefSchema = z.object({
  type: z.string(),
  path: z.string(),
})

/**
 * Skill 依赖项，声明当前 Skill 依赖的另一个 Skill 及其版本。
 */
export const skillDependencySchema = z.object({
  skill: z.string(),
  version: z.string(),
})

/** Skill 运行时类型。 */
export type RuntimeType = z.infer<typeof runtimeTypeSchema>

/** Skill 生命周期状态。 */
export type SkillStatus = z.infer<typeof skillStatusSchema>

/** Skill 版本生命周期状态。 */
export type VersionStatus = z.infer<typeof versionStatusSchema>

/** Skill 安装记录状态。 */
export type InstallStatus = z.infer<typeof installStatusSchema>

/** Skill 可见性范围。 */
export type Visibility = z.infer<typeof visibilitySchema>

/** 版本关联的资源引用。 */
export type AssetRef = z.infer<typeof assetRefSchema>

/** Skill 依赖项。 */
export type SkillDependency = z.infer<typeof skillDependencySchema>
