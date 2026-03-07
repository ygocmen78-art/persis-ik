import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";

const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
const isProd = process.env.NODE_ENV === "production";

let dbInstance: any;

if (isBuild) {
    // Mock for build phase to avoid better-sqlite3 loading errors
    dbInstance = {
        query: {},
        select: () => ({ from: () => ({ where: () => ({}) }) }),
        insert: () => ({ values: () => ({}) }),
        update: () => ({ set: () => ({ where: () => ({}) }) }),
        delete: () => ({ where: () => ({}) }),
    };
} else {
    const Database = require("better-sqlite3");
    const dbDirectory = process.env.USERDATA_PATH || process.cwd();
    const dbPath = path.join(dbDirectory, "sqlite.db");
    const sqlite = new Database(dbPath);
    dbInstance = drizzle(sqlite, { schema });
}

export const db = dbInstance;

// Auto-migrate in production (skip if build)
if (isProd && !isBuild) {
    const migrationPath = path.join(process.env.RESOURCES_PATH || "", "drizzle");
    try {
        const { migrate } = require("drizzle-orm/better-sqlite3/migrator");
        migrate(db, { migrationsFolder: migrationPath });
    } catch (e) {
        console.error("Migration failed:", e);
    }
}
