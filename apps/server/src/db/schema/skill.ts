import type { InferInsertModel, InferSelectModel } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { users } from "./user"

/** Skill 生命周期状态。 */
export type SkillStatus = "draft" | "pending_review" | "published" | "deprecated"

/** Skill 版本状态。 */
export type VersionStatus = "draft" | "beta" | "stable" | "deprecated"

/** Skill 安装状态。 */
export type InstallStatus = "applying" | "approved" | "rejected" | "installed" | "uninstalled"

/** Skill 运行时类型。 */
export type RuntimeType = "llm_prompt" | "python_script" | "api_call" | "workflow"

/** Skill 可见性。 */
export type Visibility = "public" | "private" | "team"

/** 资源引用，用于关联 version 的文件资产。 */
export interface AssetRef {
  type: string
  path: string
}

/** 依赖的 skill 及其版本。 */
export interface Dependency {
  skill: string
  version: string
}

export const skills = sqliteTable("skills", {
  id: text("id").primaryKey(),
  skillId: text("skill_id").notNull().unique(),
  name: text("name").notNull(),
  shortDescription: text("short_description"),
  description: text("description"),
  author: text("author"),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  category: text("category"),
  subCategory: text("sub_category"),
  tags: text("tags", { mode: "json" }).$type<string[]>(),
  iconUrl: text("icon_url"),
  runtimeType: text("runtime_type").$type<RuntimeType>(),
  visibility: text("visibility").$type<Visibility>(),
  status: text("status").$type<SkillStatus>().notNull().default("draft"),
  latestVersion: text("latest_version"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})

export type Skill = InferSelectModel<typeof skills>
export type NewSkill = InferInsertModel<typeof skills>
