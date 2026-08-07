import { createMiddleware } from "hono/factory"
import { API_ERROR_CODES } from "@skill-platform/api"
import type { AuthVariables } from "./auth"

export const adminMiddleware = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const userRole = c.get("userRole")
  if (userRole !== "admin") {
    return c.json({ success: false, code: API_ERROR_CODES.FORBIDDEN }, 403)
  }
  await next()
})
