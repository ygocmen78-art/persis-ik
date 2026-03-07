const Database = require('better-sqlite3');
const db = new Database('./sqlite.db');

db.exec(`
    CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL REFERENCES employees(id),
        date TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
`);

db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, date)`);

db.exec(`
    CREATE TABLE IF NOT EXISTS attendance_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    )
`);

db.exec(`INSERT OR IGNORE INTO attendance_settings (key, value) VALUES ('sunday_pay_rate', '500')`);

console.log('Tables created successfully');
db.close();
