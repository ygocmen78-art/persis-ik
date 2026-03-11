const Database = require('better-sqlite3');
try {
    const db = new Database('sqlite.db');
    db.prepare("DROP INDEX IF EXISTS branches_name_unique").run();
    console.log("Index dropped successfully or did not exist.");
    db.close();
} catch (e) {
    console.error("Failed to drop index:", e.message);
}
