import Database from "better-sqlite3"
import type BetterSqlite3Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import * as schema from "./schema/index"

const sqliteDatabasePath = process.env.DATABASE_URL ?? "./data/skill-platform.sqlite"

export const sqlite: BetterSqlite3Database.Database = new Database(sqliteDatabasePath)

export const db = drizzle(sqlite, { schema })

export type Database = typeof db
