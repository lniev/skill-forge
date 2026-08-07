import { and, eq } from "drizzle-orm"
import { db } from "../db/index"
import { skillInstalls, type NewSkillInstall, type SkillInstall } from "../db/schema/index"

export function createInstallRepository() {
  return {
    async create(data: NewSkillInstall): Promise<SkillInstall> {
      await db.insert(skillInstalls).values(data)
      const install = await db.query.skillInstalls.findFirst({
        where: eq(skillInstalls.id, data.id),
      })
      if (!install) {
        throw new Error("Failed to create install")
      }
      return install
    },

    async findById(id: string): Promise<SkillInstall | undefined> {
      return db.query.skillInstalls.findFirst({
        where: eq(skillInstalls.id, id),
      })
    },

    async findBySkillAndApp(skillId: string, appId: string, env: string): Promise<SkillInstall | undefined> {
      return db.query.skillInstalls.findFirst({
        where: and(
          eq(skillInstalls.skillId, skillId),
          eq(skillInstalls.targetAppId, appId),
          eq(skillInstalls.targetEnv, env)
        ),
      })
    },

    async list(params?: { skillId?: string; appId?: string; limit?: number; offset?: number }): Promise<SkillInstall[]> {
      const { skillId, appId, limit = 20, offset = 0 } = params ?? {}
      const conditions = []
      if (skillId) conditions.push(eq(skillInstalls.skillId, skillId))
      if (appId) conditions.push(eq(skillInstalls.targetAppId, appId))

      const where = conditions.length > 0 ? and(...conditions) : undefined

      return db.query.skillInstalls.findMany({
        where,
        limit,
        offset,
        orderBy: (skillInstalls, { desc }) => [desc(skillInstalls.createdAt)],
      })
    },

    async update(id: string, data: Partial<NewSkillInstall>): Promise<SkillInstall | undefined> {
      await db.update(skillInstalls).set(data).where(eq(skillInstalls.id, id))
      return this.findById(id)
    },

    async delete(id: string): Promise<void> {
      await db.delete(skillInstalls).where(eq(skillInstalls.id, id))
    },
  }
}

export type InstallRepository = ReturnType<typeof createInstallRepository>
