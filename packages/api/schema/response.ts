import type { Skill, SkillListItem, CreateSkillPayload } from "./skill.js"
import type { CreateVersionPayload } from "./version.js"
import type { SkillVersion } from "./version.js"
import type { SkillInstall } from "./install.js"
import type { AssetRef } from "./core.js"
import type { ApiErrorCode } from "../src/errors.js"

/** 通用 API 响应结构。 */
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

/** 健康检查响应。 */
export interface HealthCheckResponse {
  status: "ok" | "error"
  timestamp: string
}

/** 应用基础信息响应。 */
export interface AppInfo {
  name: string
  version: string
}

/** 通用错误响应。 */
export interface ApiErrorResponse {
  success: false
  code: ApiErrorCode
  message?: string
}

/** Skill 输入/输出字段定义。 */
export interface SkillSchemaField {
  name: string
  type: string
  required?: boolean
  description?: string
}

/** LLM Prompt 运行时配置。 */
export interface LlmRuntimeConfig {
  model?: string
  temperature?: number
  [key: string]: unknown
}

/** 通用运行时配置。 */
export type RuntimeConfig = Record<string, unknown>

/** Skill 列表查询参数。 */
export interface ListSkillsQuery {
  query?: string
  /** 能力类型，多值用逗号分隔 */
  category?: string
  /** 业务场景，多值用逗号分隔 */
  subCategory?: string
  /** 作者，用于「我的技能」筛选（兼容旧字段） */
  author?: string
  /** 创建者用户 ID，用于「我的技能」筛选 */
  userId?: string
  /** 状态，用于「我的技能」状态筛选 */
  status?: string
  /** 排序方式：hot / newest / mostUsed / updatedAt / createdAt / name */
  sort?: "hot" | "newest" | "mostUsed" | "updatedAt" | "createdAt" | "name"
  limit?: number
  offset?: number
}

/** 创建 Skill 并同时创建版本的请求体。 */
export interface CreateSkillWithVersionRequest {
  skill: CreateSkillPayload
  version: CreateVersionPayload
}

/** 创建 Skill 并同时创建版本的响应数据。 */
export interface CreateSkillWithVersionData {
  skill: Skill
  version: SkillVersion
  assets?: AssetRef[]
}

/** 分页返回的 Skill 列表数据。 */
export interface PaginatedSkillsData {
  items: SkillListItem[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

/** 各接口响应结构。 */
export type ListSkillsResponse = ApiResponse<PaginatedSkillsData>
export type SkillResponse = ApiResponse<Skill>
export type SkillVersionListResponse = ApiResponse<SkillVersion[]>
export type SkillVersionResponse = ApiResponse<SkillVersion>
export type DeleteSkillResponse = ApiResponse<null>
export type CreateVersionResponse = ApiResponse<SkillVersion>
export type PublishVersionResponse = ApiResponse<SkillVersion>
export type SetLatestResponse = ApiResponse<SkillVersion>
export type CreateInstallResponse = ApiResponse<SkillInstall>
export type UpdateInstallStatusResponse = ApiResponse<SkillInstall>
export type CreateSkillWithVersionResponse = ApiResponse<CreateSkillWithVersionData>
