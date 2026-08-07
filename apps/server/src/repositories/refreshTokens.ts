import { eq } from "drizzle-orm"
import { db } from "../db/index"
import { refreshTokens } from "../db/schema/index"

export type RefreshToken = typeof refreshTokens.$inferSelect
export type NewRefreshToken = typeof refreshTokens.$inferInsert

export function createRefreshTokenRepository() {
  return {
    async findByTokenHash(tokenHash: string) {
      const [token] = await db
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.tokenHash, tokenHash))
        .limit(1)
      return token
    },

    async create(data: NewRefreshToken) {
      const [token] = await db.insert(refreshTokens).values(data).returning()
      return token
    },

    async deleteById(id: string) {
      await db.delete(refreshTokens).where(eq(refreshTokens.id, id))
    },

    async deleteByUserId(userId: string) {
      await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId))
    },
  }
}

export type RefreshTokenRepository = ReturnType<typeof createRefreshTokenRepository>
