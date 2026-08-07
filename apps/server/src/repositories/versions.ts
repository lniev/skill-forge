import { and, eq } from "drizzle-orm"
import { db } from "../db/index"
import { skillVersions, type NewSkillVersion, type SkillVersion } from "../db/schema/index"

export function createVersionRepository() {
  return {
    async create(data: NewSkillVersion): Promise<SkillVersion> {
      await db.insert(skillVersions).values(data)
      const version = await db.query.skillVersions.findFirst({
        where: eq(skillVersions.id, data.id),
      })
      if (!version) {
        throw new Error("Failed to create skill version")
      }
      return version
    },

    async findById(id: string): Promise<SkillVersion | undefined> {
      return db.query.skillVersions.findFirst({
        where: eq(skillVersions.id, id),
      })
    },

    async findBySkillAndVersion(skillId: string, version: string): Promise<SkillVersion | undefined> {
      return db.query.skillVersions.findFirst({
        where: and(eq(skillVersions.skillId, skillId), eq(skillVersions.version, version)),
      })
    },

    async findLatest(skillId: string): Promise<SkillVersion | undefined> {
      return db.query.skillVersions.findFirst({
        where: and(eq(skillVersions.skillId, skillId), eq(skillVersions.isLatest, true)),
      })
    },

    async listBySkill(skillId: string): Promise<SkillVersion[]> {
      return db.query.skillVersions.findMany({
        where: eq(skillVersions.skillId, skillId),
        orderBy: (skillVersions, { desc }) => [desc(skillVersions.createdAt)],
      })
    },

    async update(id: string, data: Partial<NewSkillVersion>): Promise<SkillVersion | undefined> {
      await db.update(skillVersions).set(data).where(eq(skillVersions.id, id))
      return this.findById(id)
    },

    markLatest(skillId: string, versionId: string): void {
      db.transaction((tx) => {
        tx.update(skillVersions).set({ isLatest: false }).where(eq(skillVersions.skillId, skillId)).run()
        tx.update(skillVersions).set({ isLatest: true }).where(eq(skillVersions.id, versionId)).run()
      })
    },

    async delete(id: string): Promise<void> {
      await db.delete(skillVersions).where(eq(skillVersions.id, id))
    },
  }
}

export type VersionRepository = ReturnType<typeof createVersionRepository>
