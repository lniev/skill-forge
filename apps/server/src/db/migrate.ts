import { migrate } from "drizzle-orm/better-sqlite3/migrator"
import { db } from "./index"

try {
  migrate(db, { migrationsFolder: "./drizzle" })
  console.log("✅ Database migrated")
} catch (error) {
  console.error("❌ Migration failed:", error)
  process.exit(1)
}
