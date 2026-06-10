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

    // Migration: Yeni kolonlar ekle (mevcut DB için)
    const migrations = [
        "ALTER TABLE employees ADD COLUMN ehliyet_class TEXT",
        "ALTER TABLE employees ADD COLUMN ehliyet_expiry TEXT",
        "ALTER TABLE employees ADD COLUMN src_expiry TEXT",
        "ALTER TABLE employees ADD COLUMN psikoteknik_expiry TEXT",
    ]
    for (const sql of migrations) {
        try { sqlite.exec(sql) } catch (e) { /* kolon zaten var */ }
    }

    // Migration: Yeni tablolar oluştur
    try {
        sqlite.exec(`
            CREATE TABLE IF NOT EXISTS disciplinary_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employee_id INTEGER NOT NULL REFERENCES employees(id),
                violation_type TEXT NOT NULL,
                incident_date TEXT NOT NULL,
                description TEXT,
                status TEXT DEFAULT 'active',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `)
    } catch (e) { /* tablo zaten var */ }

    try { sqlite.exec(`ALTER TABLE employees ADD COLUMN employment_status TEXT DEFAULT 'Daimi'`); } catch(e) {}

    try {
        sqlite.exec(`CREATE TABLE IF NOT EXISTS custom_occupation_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT NOT NULL,
            description TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`);
    } catch(e) {}

    try {
        sqlite.exec(`CREATE TABLE IF NOT EXISTS employment_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER NOT NULL REFERENCES employees(id),
            branch_id INTEGER REFERENCES branches(id),
            sgk_branch_id INTEGER REFERENCES branches(id),
            department TEXT,
            position TEXT,
            start_date TEXT,
            end_date TEXT,
            termination_reason TEXT,
            sgk_exit_code TEXT,
            salary REAL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`);
    } catch(e) { console.log('employment_history migration:', (e as any).message); }

    try {
        sqlite.exec('DROP INDEX IF EXISTS employees_tc_number_unique');
    } catch(e) { console.log('drop tc unique:', (e as any).message); }
    try { sqlite.exec("ALTER TABLE branches ADD COLUMN authorized_user_code TEXT"); } catch(e) {}
    try { sqlite.exec("ALTER TABLE branches ADD COLUMN authorized_user_code_suffix TEXT"); } catch(e) {}
    try { sqlite.exec("ALTER TABLE branches ADD COLUMN authorized_user_password TEXT"); } catch(e) {}

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
