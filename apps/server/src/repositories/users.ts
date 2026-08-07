import { and, count, eq, like, ne, or, sql } from "drizzle-orm"
import type { ListUsersQuery, UserListItem } from "@skill-platform/api"
import { db } from "../db/index"
import { users, type User, type NewUser } from "../db/schema/index"


export function createUserRepository() {
  return {
    async findByEmail(email: string) {
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
      return user
    },

    async findById(id: string) {
      const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1)
      return user
    },

    async findByUsername(username: string) {
      const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1)
      return user
    },

    async count(): Promise<number> {
      const [result] = await db.select({ count: count() }).from(users)
      return result?.count ?? 0
    },

    async create(data: NewUser) {
      const [user] = await db.insert(users).values(data).returning()
      return user
    },

    async update(id: string, data: Partial<NewUser>) {
      const [user] = await db
        .update(users)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning()
      return user
    },

    async incrementFailedAttempts(id: string) {
      const [user] = await db
        .update(users)
        .set({ failedLoginAttempts: sql`${users.failedLoginAttempts} + 1` })
        .where(eq(users.id, id))
        .returning()
      return user
    },

    async resetFailedAttempts(id: string) {
      const [user] = await db
        .update(users)
        .set({ failedLoginAttempts: 0, lockedUntil: null })
        .where(eq(users.id, id))
        .returning()
      return user
    },

    async lockAccount(id: string, until: Date) {
      const [user] = await db
        .update(users)
        .set({ lockedUntil: until })
        .where(eq(users.id, id))
        .returning()
      return user
    },

    async updateLastLoginAt(id: string) {
      const [user] = await db
        .update(users)
        .set({ lastLoginAt: new Date(), updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning()
      return user
    },

    async list(params: ListUsersQuery = {}): Promise<{ items: UserListItem[]; total: number }> {
      const { query, status, role, sort = "createdAt", limit = 20, offset = 0 } = params

      const conditions = []

      if (status === "deleted") {
        conditions.push(eq(users.status, "deleted"))
      } else {
        // 默认过滤掉已删除用户
        conditions.push(ne(users.status, "deleted"))
      }

      if (role) {
        conditions.push(eq(users.role, role as User["role"]))
      }

      if (query) {
        const searchPattern = `%${query}%`
        conditions.push(
          or(
            like(users.username, searchPattern),
            like(users.email, searchPattern),
            like(users.id, searchPattern)
          )
        )
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined

      const orderBy = (() => {
        switch (sort) {
          case "createdAt":
            return [sql`${users.createdAt} DESC`
]
          case "updatedAt":
            return [sql`${users.updatedAt} DESC`
]
          case "username":
            return [sql`${users.username} ASC`
]
          default:
            return [sql`${users.createdAt} DESC`
]
        }
      })()

      const skillCountSub = sql<number>`(SELECT COUNT(*) FROM skills WHERE skills.user_id = ${users.id})`.as("skill_count")

      const rows = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          role: users.role,
          status: users.status,
          lastLoginAt: users.lastLoginAt,
          createdAt: users.createdAt,
          skillCount: skillCountSub,
        })
        .from(users)
        .where(where)
        .orderBy(...orderBy)
        .limit(limit)
        .offset(offset)

      const totalResult = await db
        .select({ count: count() })
        .from(users)
        .where(where)

      const total = totalResult[0]?.count ?? 0

      const items = rows.map((row) => ({
        ...row,
        createdAt: row.createdAt ? row.createdAt.toISOString() : null,
        lastLoginAt: row.lastLoginAt ? row.lastLoginAt.toISOString() : null,
      }))

      return { items, total }
    },

    async remove(id: string) {
      const [user] = await db
        .update(users)
        .set({ status: "deleted", updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning()
      return user
    },
  }
}

export type UserRepository = ReturnType<typeof createUserRepository>
