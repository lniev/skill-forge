import { and, count, eq, getTableColumns, inArray, like, or, sql } from "drizzle-orm"
import type { SkillListItem } from "@skill-platform/api"
import { db } from "../db/index"
import { skills, skillInstalls, type NewSkill, type Skill, type SkillStatus } from "../db/schema/index"

export function createSkillRepository() {
  return {
    async create(data: NewSkill): Promise<Skill> {
      await db.insert(skills).values(data)
      const skill = await db.query.skills.findFirst({
        where: eq(skills.id, data.id),
      })
      if (!skill) {
        throw new Error("Failed to create skill")
      }
      return skill
    },

    async findById(id: string): Promise<Skill | undefined> {
      return db.query.skills.findFirst({
        where: eq(skills.id, id),
      })
    },

    async findBySkillId(skillId: string): Promise<Skill | undefined> {
      return db.query.skills.findFirst({
        where: eq(skills.skillId, skillId),
      })
    },

    async update(id: string, data: Partial<NewSkill>): Promise<Skill | undefined> {
      await db.update(skills).set(data).where(eq(skills.id, id))
      return this.findById(id)
    },

    async list(params?: {
      query?: string
      category?: string
      subCategory?: string
      author?: string
      userId?: string
      status?: string
      sort?: "hot" | "newest" | "mostUsed" | "updatedAt" | "createdAt" | "name"
      limit?: number
      offset?: number
    }): Promise<{ items: SkillListItem[]; total: number }> {
      const { query, category, subCategory, author, userId, status, sort = "hot", limit = 20, offset = 0 } = params ?? {}

      const conditions = []

      // 默认只展示已上架的公开 skill；传入 author/userId 时代表查看自己的 skill，不限制状态/可见性
      if (userId) {
        conditions.push(eq(skills.userId, userId))
      } else if (author) {
        conditions.push(eq(skills.author, author))
      } else {
        conditions.push(eq(skills.status, "published"))
      }

      if (status) {
        conditions.push(eq(skills.status, status as SkillStatus))
      }

      if (query) {
        const searchPattern = `%${query}%`
        conditions.push(
          or(
            like(skills.name, searchPattern),
            like(skills.shortDescription ?? "", searchPattern),
            like(skills.tags ?? "", searchPattern)
          )
        )
      }

      if (category) {
        const categoryList = category.split(",").map((c) => c.trim()).filter(Boolean)
        if (categoryList.length > 0) {
          conditions.push(inArray(skills.category, categoryList))
        }
      }

      if (subCategory) {
        const subCategoryList = subCategory.split(",").map((c) => c.trim()).filter(Boolean)
        if (subCategoryList.length > 0) {
          conditions.push(inArray(skills.subCategory, subCategoryList))
        }
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined

      const orderBy = (() => {
        switch (sort) {
          case "newest":
            return [sql`${skills.createdAt} DESC`]
          case "mostUsed":
          case "hot":
          default:
            return [sql`${skills.createdAt} DESC`]
          case "updatedAt":
            return [sql`${skills.updatedAt} DESC`]
          case "createdAt":
            return [sql`${skills.createdAt} DESC`]
          case "name":
            return [sql`${skills.name} ASC`]
        }
      })()

      const rows = await db
        .select({
          ...getTableColumns(skills),
        })
        .from(skills)
        .where(where)
        .orderBy(...orderBy)
        .limit(limit)
        .offset(offset)

      let downloadCounts = new Map<string, number>()
      if (rows.length > 0) {
        const skillIds = rows.map((row) => row.id)
        const counts = await db
          .select({
            skillId: skillInstalls.skillId,
            count: count(skillInstalls.id),
          })
          .from(skillInstalls)
          .where(inArray(skillInstalls.skillId, skillIds))
          .groupBy(skillInstalls.skillId)

        downloadCounts = new Map(counts.map((item) => [item.skillId, item.count]))
      }

      const totalResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(skills)
        .where(where)

      const total = totalResult[0]?.count ?? 0

      return {
        items: rows.map((row) => ({
          ...row,
          downloadCount: downloadCounts.get(row.id) ?? 0,
        })) as SkillListItem[],
        total,
      }
    },

    async delete(id: string): Promise<void> {
      await db.delete(skills).where(eq(skills.id, id))
    },
  }
}

export type SkillsRepository = ReturnType<typeof createSkillRepository>
