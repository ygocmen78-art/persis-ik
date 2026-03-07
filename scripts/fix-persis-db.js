const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(process.cwd(), 'sqlite.db');
console.log('Database path:', dbPath);

if (!fs.existsSync(dbPath)) {
    console.error('Database file not found!');
    process.exit(1);
}

try {
    const db = new Database(dbPath);
    console.log('Connected to database.');

    // 1. Check if table exists
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='garnishments'").get();

    if (!tableExists) {
        console.log('Table "garnishments" missing. Creating it...');
        db.exec(`
            CREATE TABLE garnishments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employee_id INTEGER NOT NULL REFERENCES employees(id),
                file_number TEXT NOT NULL,
                office_name TEXT NOT NULL,
                total_amount REAL NOT NULL,
                deduction_amount REAL,
                remaining_amount REAL NOT NULL,
                iban TEXT,
                priority_order INTEGER NOT NULL,
                status TEXT DEFAULT 'active',
                notification_date TEXT,
                creditor TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Table created.');

        // Create installments too if missing
        db.exec(`
            CREATE TABLE IF NOT EXISTS garnishment_installments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                garnishment_id INTEGER NOT NULL REFERENCES garnishments(id),
                payment_date TEXT NOT NULL,
                amount REAL NOT NULL,
                status TEXT DEFAULT 'pending',
                paid_at TEXT,
                description TEXT
            )
        `);
        console.log('Installments table created.');

    } else {
        console.log('Table "garnishments" exists.');

        // 2. Check for creditor column
        const columns = db.prepare("PRAGMA table_info(garnishments)").all();
        const hasCreditor = columns.some(c => c.name === 'creditor');

        if (!hasCreditor) {
            console.log('Adding "creditor" column...');
            db.exec("ALTER TABLE garnishments ADD COLUMN creditor TEXT");
            console.log('Column added.');
        } else {
            console.log('Column "creditor" already exists.');
        }
    }

    db.close();

} catch (error) {
    console.error('Error:', error);
}
