import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { hash } from "bcrypt"
import {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
  resetUserPasswordSchema,
  API_ERROR_CODES,
} from "@skill-platform/api"
import type { AuthVariables } from "../../middleware/auth"
import { createUserRepository } from "../../repositories/users"
import { createSkillRepository } from "../../repositories/skills"
import { snowflakeId } from "../../lib/snowflake"

const SALT_ROUNDS = 12

function serializeUser(user: {
  id: string
  username: string
  email: string
  role: string
  status: string
  lastLoginAt: Date | null | undefined
  createdAt: Date | null | undefined
  skillCount?: number
}) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    status: user.status,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt?.toISOString() ?? null,
    skillCount: user.skillCount ?? 0,
  }
}

export function createUserRoutes(
  usersRepo = createUserRepository(),
  skillsRepo = createSkillRepository()
) {
  const app = new Hono<{ Variables: AuthVariables }>()

  app.get("/", zValidator("query", listUsersQuerySchema), async (c) => {
    const query = c.req.valid("query")
    const { items, total } = await usersRepo.list({
      query: query.query,
      status: query.status,
      role: query.role,
      sort: query.sort ?? "createdAt",
      limit: query.limit ?? 20,
      offset: query.offset ?? 0,
    })

    const limit = query.limit ?? 20
    const offset = query.offset ?? 0

    return c.json({
      success: true,
      data: {
        items,
        total,
        limit,
        offset,
        hasMore: offset + items.length < total,
      },
    })
  })

  app.get("/:id", async (c) => {
    const id = c.req.param("id")
    const user = await usersRepo.findById(id)
    if (!user) {
      return c.json({ success: false, code: API_ERROR_CODES.USER_NOT_FOUND }, 404)
    }

    const { items } = await skillsRepo.list({ userId: id, limit: 1, offset: 0 })
    const skillCount = items.length

    return c.json({
      success: true,
      data: serializeUser({ ...user, skillCount }),
    })
  })

  app.post("/", zValidator("json", createUserSchema), async (c) => {
    const body = c.req.valid("json")
    const email = body.email.toLowerCase()

    const existingEmail = await usersRepo.findByEmail(email)
    if (existingEmail) {
      return c.json({ success: false, code: API_ERROR_CODES.EMAIL_EXISTS }, 409)
    }

    const existingUsername = await usersRepo.findByUsername(body.username)
    if (existingUsername) {
      return c.json({ success: false, code: API_ERROR_CODES.USERNAME_EXISTS }, 409)
    }

    const passwordHash = await hash(body.password, SALT_ROUNDS)
    const now = new Date()

    const user = await usersRepo.create({
      id: snowflakeId(),
      username: body.username,
      email,
      passwordHash,
      role: body.role,
      status: body.status,
      failedLoginAttempts: 0,
      createdAt: now,
      updatedAt: now,
    })

    return c.json({
      success: true,
      data: serializeUser({ ...user, skillCount: 0 }),
    })
  })

  app.patch("/:id", zValidator("json", updateUserSchema), async (c) => {
    const id = c.req.param("id")
    const body = c.req.valid("json")

    const existing = await usersRepo.findById(id)
    if (!existing) {
      return c.json({ success: false, code: API_ERROR_CODES.USER_NOT_FOUND }, 404)
    }

    if (body.username && body.username !== existing.username) {
      const existingUsername = await usersRepo.findByUsername(body.username)
      if (existingUsername) {
        return c.json({ success: false, code: API_ERROR_CODES.USERNAME_EXISTS }, 409)
      }
    }

    const user = await usersRepo.update(id, body)
    if (!user) {
      return c.json({ success: false, code: API_ERROR_CODES.UPDATE_FAILED }, 500)
    }

    const { items } = await skillsRepo.list({ userId: id, limit: 1, offset: 0 })

    return c.json({
      success: true,
      data: serializeUser({ ...user, skillCount: items.length }),
    })
  })

  app.delete("/:id", async (c) => {
    const id = c.req.param("id")
    const currentUserId = c.get("userId")

    if (id === currentUserId) {
      return c.json({ success: false, code: API_ERROR_CODES.CANNOT_DELETE_SELF }, 403)
    }

    const existing = await usersRepo.findById(id)
    if (!existing) {
      return c.json({ success: false, code: API_ERROR_CODES.USER_NOT_FOUND }, 404)
    }

    const user = await usersRepo.remove(id)
    if (!user) {
      return c.json({ success: false, code: API_ERROR_CODES.DELETE_FAILED }, 500)
    }

    return c.json({
      success: true,
      data: serializeUser({ ...user, skillCount: 0 }),
    })
  })

  app.post("/:id/reset-password", zValidator("json", resetUserPasswordSchema), async (c) => {
    const id = c.req.param("id")
    const body = c.req.valid("json")

    const existing = await usersRepo.findById(id)
    if (!existing) {
      return c.json({ success: false, code: API_ERROR_CODES.USER_NOT_FOUND }, 404)
    }

    const passwordHash = await hash(body.newPassword, SALT_ROUNDS)
    await usersRepo.update(id, { passwordHash })

    return c.json({ success: true, data: null })
  })

  app.get("/:id/skills", async (c) => {
    const id = c.req.param("id")
    const limit = 20
    const offset = 0
    const { items, total } = await skillsRepo.list({ userId: id, limit, offset })

    return c.json({
      success: true,
      data: {
        items,
        total,
        limit,
        offset,
        hasMore: offset + items.length < total,
      },
    })
  })

  return app
}
