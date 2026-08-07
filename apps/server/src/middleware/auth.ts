import { createMiddleware } from "hono/factory"
import { jwtVerify } from "jose"
import { API_ERROR_CODES } from "@skill-platform/api"

export interface AuthVariables {
  userId: string
  userRole: "user" | "admin"
}

const textEncoder = new TextEncoder()

export const authMiddleware = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const authHeader = c.req.header("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ success: false, code: API_ERROR_CODES.UNAUTHORIZED }, 401)
  }

  const token = authHeader.slice(7)
  const secret = textEncoder.encode(process.env.JWT_SECRET)

  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] })
    if (!payload.sub) {
      return c.json({ success: false, code: API_ERROR_CODES.INVALID_TOKEN }, 401)
    }

    c.set("userId", payload.sub)
    c.set("userRole", (payload.role as "user" | "admin") ?? "user")
    await next()
  } catch {
    return c.json({ success: false, code: API_ERROR_CODES.INVALID_TOKEN }, 401)
  }
})
