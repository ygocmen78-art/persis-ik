import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "path";

const isProd = process.env.NODE_ENV === "production";
const dbDirectory = process.env.USERDATA_PATH || process.cwd();
const dbPath = path.join(dbDirectory, "sqlite.db");

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

// Auto-migrate in production
if (isProd) {
    const migrationPath = path.join(process.env.RESOURCES_PATH || "", "drizzle");
    try {
        migrate(db, { migrationsFolder: migrationPath });
    } catch (e) {
        console.error("Migration failed:", e);
    }
}
