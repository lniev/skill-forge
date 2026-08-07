import type { InferInsertModel, InferSelectModel } from "drizzle-orm"
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
import type { AssetRef, Dependency, VersionStatus } from "./skill"
import { skills } from "./skill"

export const skillVersions = sqliteTable("skill_versions", {
  id: text("id").primaryKey(),
  skillId: text("skill_id")
    .notNull()
    .references(() => skills.id, { onDelete: "cascade" }),
  version: text("version").notNull(),
  runtimeConfig: text("runtime_config", { mode: "json" }).$type<Record<string, unknown>>(),
  inputSchema: text("input_schema", { mode: "json" }).$type<Record<string, unknown>[]>(),
  outputSchema: text("output_schema", { mode: "json" }).$type<Record<string, unknown>[]>(),
  dependencies: text("dependencies", { mode: "json" }).$type<Dependency[]>(),
  permissions: text("permissions", { mode: "json" }).$type<string[]>(),
  evaluation: text("evaluation", { mode: "json" }).$type<Record<string, string>>(),
  assetRefs: text("asset_refs", { mode: "json" }).$type<AssetRef[]>(),
  status: text("status").$type<VersionStatus>().notNull().default("draft"),
  isLatest: integer("is_latest", { mode: "boolean" }).default(false),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (table) => ({
  idxSkillVersionsSkillId: index("idx_skill_versions_skill_id").on(table.skillId),
  idxSkillVersionsIsLatest: index("idx_skill_versions_is_latest").on(table.skillId, table.isLatest),
}))

export type SkillVersion = InferSelectModel<typeof skillVersions>
export type NewSkillVersion = InferInsertModel<typeof skillVersions>
