import type { InferInsertModel, InferSelectModel } from "drizzle-orm"
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
import type { InstallStatus } from "./skill"

export const skillInstalls = sqliteTable("skill_installs", {
  id: text("id").primaryKey(),
  skillId: text("skill_id").notNull(),
  version: text("version").notNull(),
  targetAppId: text("target_app_id").notNull(),
  targetEnv: text("target_env").notNull().default("dev"),
  customConfig: text("custom_config", { mode: "json" }).$type<Record<string, unknown>>(),
  permissions: text("permissions", { mode: "json" }).$type<string[]>(),
  status: text("status").$type<InstallStatus>().notNull().default("applying"),
  installedAt: integer("installed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (table) => ({
  idxInstallsSkill: index("idx_installs_skill").on(table.skillId, table.targetAppId),
}))

export type SkillInstall = InferSelectModel<typeof skillInstalls>
export type NewSkillInstall = InferInsertModel<typeof skillInstalls>
