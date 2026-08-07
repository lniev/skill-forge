import dotenv from "dotenv"
dotenv.config()

import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { db } from "./db/index"
import { createInstallRepository } from "./repositories/installs"
import { createSkillRepository } from "./repositories/skills"
import { createVersionRepository } from "./repositories/versions"
import { createAssetRoutes } from "./routes/assets/index"
import { createAuthRoutes } from "./routes/auth/index"
import { createInstallRoutes } from "./routes/installs/index"
import { createInvokeRoutes } from "./routes/invoke/index"
import { healthRoutes } from "./routes/health/index"
import { createSkillRoutes } from "./routes/skills/index"
import { createUserRoutes } from "./routes/users/index"
import { authMiddleware } from "./middleware/auth"
import { adminMiddleware } from "./middleware/admin"
import { createStorageService } from "./services/storage"

const skillsRepo = createSkillRepository()
const versionsRepo = createVersionRepository()
const installsRepo = createInstallRepository()
const storage = createStorageService()

const app = new Hono().basePath("/api")

app.use(
  cors({
    origin: ["http://localhost:1420", "http://localhost:3000", "http://127.0.0.1:1420"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
)

app.get("/", (c) => {
  return c.json({ name: "SkillForge API", version: "0.0.1" })
})

app.route("/health", healthRoutes)
app.route("/auth", createAuthRoutes())

// 保护业务路由
app.use("/skills/*", authMiddleware)
app.use("/installs/*", authMiddleware)
app.use("/users/*", authMiddleware, adminMiddleware)

app.route("/users", createUserRoutes())
app.route("/skills", createSkillRoutes(skillsRepo, versionsRepo, storage))
app.route("/skills", createAssetRoutes(skillsRepo, versionsRepo, storage))
app.route("/installs", createInstallRoutes(installsRepo, versionsRepo))
app.route("/skills", createInvokeRoutes(skillsRepo, versionsRepo, installsRepo))

const port = Number(process.env.PORT) || 3000

serve({
  fetch: app.fetch,
  port,
})

console.log(`🚀 Server running at http://localhost:${port}`)

export { app, db }
