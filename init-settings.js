const Database = require('better-sqlite3');

try {
    const db = new Database('sqlite.db', { verbose: console.log });

    console.log("Creating settings table if not exists...");
    db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    console.log("Success: settings table ready.");
} catch (error) {
    console.error("Migration failed:", error);
}
