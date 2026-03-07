const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

try {
    console.log("Adding sgk_branch_id column to employees table...");
    db.prepare("ALTER TABLE employees ADD COLUMN sgk_branch_id INTEGER REFERENCES branches(id)").run();
    console.log("Column added successfully.");

    // Optional: Copy existing branch_id to sgk_branch_id for existing records
    console.log("Backfilling sgk_branch_id with existing branch_id...");
    db.prepare("UPDATE employees SET sgk_branch_id = branch_id WHERE sgk_branch_id IS NULL").run();
    console.log("Backfill complete.");

} catch (error) {
    if (error.message.includes("duplicate column name")) {
        console.log("Column already exists, skipping.");
    } else {
        console.error("Error:", error.message);
    }
}
