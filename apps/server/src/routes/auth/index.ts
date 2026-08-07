import { compare, hash } from "bcrypt"
import { SignJWT, jwtVerify } from "jose"
import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  API_ERROR_CODES,
} from "@skill-platform/api"
import { createRefreshTokenRepository } from "../../repositories/refreshTokens"
import { createUserRepository } from "../../repositories/users"
import { snowflakeId } from "../../lib/snowflake"
import { authMiddleware } from "../../middleware/auth"
import type { AuthVariables } from "../../middleware/auth"

const SALT_ROUNDS = 12
const MAX_FAILED_ATTEMPTS = 5
const LOCK_DURATION_MS = 15 * 60 * 1000 // 15 minutes

const textEncoder = new TextEncoder()

interface TokenPayload {
  sub: string
  role: "user" | "admin"
  type: "access" | "refresh"
}

function createJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error("JWT_SECRET is not configured")
  }
  return textEncoder.encode(secret)
}

function createJwtRefreshSecret() {
  const secret = process.env.JWT_REFRESH_SECRET
  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET is not configured")
  }
  return textEncoder.encode(secret)
}

async function signAccessToken(userId: string, role: "user" | "admin"): Promise<string> {
  const expiration = process.env.JWT_ACCESS_EXPIRATION ?? "15m"
  return new SignJWT({ sub: userId, role, type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiration)
    .sign(createJwtSecret())
}

async function signRefreshToken(userId: string): Promise<string> {
  const expiration = process.env.JWT_REFRESH_EXPIRATION ?? "7d"
  return new SignJWT({ sub: userId, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiration)
    .sign(createJwtRefreshSecret())
}

async function hashRefreshToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

function isLocked(user: { lockedUntil: Date | null | undefined }) {
  return user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()
}

export function createAuthRoutes(
  usersRepo = createUserRepository(),
  refreshTokensRepo = createRefreshTokenRepository()
) {
  const app = new Hono<{ Variables: AuthVariables }>()

  app.post("/register", zValidator("json", registerSchema), async (c) => {
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

    // 第一个注册的用户自动设为管理员
    const userCount = await usersRepo.count()

    const user = await usersRepo.create({
      id: snowflakeId(),
      username: body.username,
      email,
      passwordHash,
      role: userCount === 0 ? "admin" : "user",
      status: "active",
      failedLoginAttempts: 0,
      createdAt: now,
      updatedAt: now,
    })

    const accessToken = await signAccessToken(user.id, user.role)
    const rawRefreshToken = await signRefreshToken(user.id)
    const tokenHash = await hashRefreshToken(rawRefreshToken)

    await refreshTokensRepo.create({
      id: snowflakeId(),
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: now,
    })

    return c.json({
      success: true,
      data: {
        accessToken,
        refreshToken: rawRefreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      },
    })
  })

  app.post("/login", zValidator("json", loginSchema), async (c) => {
    const body = c.req.valid("json")
    const email = body.email.toLowerCase()

    const user = await usersRepo.findByEmail(email)
    if (!user) {
      return c.json({ success: false, code: API_ERROR_CODES.INVALID_CREDENTIALS }, 401)
    }

    if (isLocked(user)) {
      return c.json({ success: false, code: API_ERROR_CODES.ACCOUNT_LOCKED }, 403)
    }

    if (user.status !== "active") {
      return c.json({ success: false, code: API_ERROR_CODES.ACCOUNT_INACTIVE }, 403)
    }

    const isPasswordValid = await compare(body.password, user.passwordHash)
    if (!isPasswordValid) {
      const updatedUser = await usersRepo.incrementFailedAttempts(user.id)
      if ((updatedUser?.failedLoginAttempts ?? 0) >= MAX_FAILED_ATTEMPTS) {
        await usersRepo.lockAccount(user.id, new Date(Date.now() + LOCK_DURATION_MS))
        return c.json({ success: false, code: API_ERROR_CODES.TOO_MANY_ATTEMPTS }, 403)
      }
      return c.json({ success: false, code: API_ERROR_CODES.INVALID_CREDENTIALS }, 401)
    }

    if (user.failedLoginAttempts > 0) {
      await usersRepo.resetFailedAttempts(user.id)
    }

    await usersRepo.updateLastLoginAt(user.id)

    const accessToken = await signAccessToken(user.id, user.role)
    const rawRefreshToken = await signRefreshToken(user.id)
    const tokenHash = await hashRefreshToken(rawRefreshToken)

    await refreshTokensRepo.create({
      id: snowflakeId(),
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    })

    return c.json({
      success: true,
      data: {
        accessToken,
        refreshToken: rawRefreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      },
    })
  })

  app.post("/logout", authMiddleware, async (c) => {
    const userId = c.get("userId")
    await refreshTokensRepo.deleteByUserId(userId)
    return c.json({ success: true, data: null })
  })

  app.post("/refresh", async (c) => {
    const { refreshToken } = (await c.req.json()) as { refreshToken?: string }
    if (!refreshToken) {
      return c.json({ success: false, code: API_ERROR_CODES.MISSING_REFRESH_TOKEN }, 401)
    }

    let payload: TokenPayload
    try {
      const secret = createJwtRefreshSecret()
      const result = await jwtVerify(refreshToken, secret, { algorithms: ["HS256"] })
      payload = result.payload as unknown as TokenPayload
      if (payload.type !== "refresh") {
        throw new Error("Invalid token type")
      }
    } catch {
      return c.json({ success: false, code: API_ERROR_CODES.INVALID_REFRESH_TOKEN }, 401)
    }

    const tokenHash = await hashRefreshToken(refreshToken)
    const storedToken = await refreshTokensRepo.findByTokenHash(tokenHash)
    if (!storedToken || new Date(storedToken.expiresAt) < new Date()) {
      return c.json({ success: false, code: API_ERROR_CODES.REFRESH_TOKEN_EXPIRED }, 401)
    }

    const user = await usersRepo.findById(payload.sub)
    if (!user || user.status !== "active") {
      return c.json({ success: false, code: API_ERROR_CODES.USER_NOT_FOUND }, 401)
    }

    const accessToken = await signAccessToken(user.id, user.role)

    return c.json({
      success: true,
      data: {
        accessToken,
        refreshToken, // keep same refresh token in MVP
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      },
    })
  })

  app.post("/forgot-password", zValidator("json", forgotPasswordSchema), async (c) => {
    const body = c.req.valid("json")
    // MVP: just log the code and return success. Real email sending can be added later.
    console.log(`[Forgot password] email=${body.email.toLowerCase()} code=123456`)
    return c.json({ success: true, data: null })
  })

  app.post("/reset-password", zValidator("json", resetPasswordSchema), async (c) => {
    const body = c.req.valid("json")
    // MVP: accept any 6-digit code. Real code verification can be added later.
    const email = body.email.toLowerCase()
    const user = await usersRepo.findByEmail(email)
    if (!user) {
      return c.json({ success: false, code: API_ERROR_CODES.USER_NOT_FOUND }, 404)
    }

    const passwordHash = await hash(body.newPassword, SALT_ROUNDS)
    await usersRepo.update(user.id, { passwordHash })
    await refreshTokensRepo.deleteByUserId(user.id)

    return c.json({ success: true, data: null })
  })

  app.post("/change-password", authMiddleware, zValidator("json", changePasswordSchema), async (c) => {
    const userId = c.get("userId")
    const body = c.req.valid("json")

    const user = await usersRepo.findById(userId)
    if (!user) {
      return c.json({ success: false, code: API_ERROR_CODES.USER_NOT_FOUND }, 404)
    }

    const isCurrentValid = await compare(body.currentPassword, user.passwordHash)
    if (!isCurrentValid) {
      return c.json({ success: false, code: API_ERROR_CODES.CURRENT_PASSWORD_INCORRECT }, 400)
    }

    const passwordHash = await hash(body.newPassword, SALT_ROUNDS)
    await usersRepo.update(userId, { passwordHash })
    await refreshTokensRepo.deleteByUserId(userId)

    return c.json({ success: true, data: null })
  })

  app.get("/me", authMiddleware, async (c) => {
    const userId = c.get("userId")
    const user = await usersRepo.findById(userId)
    if (!user) {
      return c.json({ success: false, code: API_ERROR_CODES.USER_NOT_FOUND }, 404)
    }

    return c.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    })
  })

  return app
}
