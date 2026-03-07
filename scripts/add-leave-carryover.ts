import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'sqlite.db');
const db = new Database(dbPath);

try {
    console.log('Adding leave_carryover column to employees table...');

    // Check if column exists
    const tableInfo = db.prepare("PRAGMA table_info(employees)").all();
    const hasColumn = tableInfo.some((col: any) => col.name === 'leave_carryover');

    if (!hasColumn) {
        db.prepare('ALTER TABLE employees ADD COLUMN leave_carryover INTEGER DEFAULT 0').run();
        console.log('✓ leave_carryover column added successfully');
    } else {
        console.log('✓ leave_carryover column already exists');
    }

    db.close();
    console.log('Migration completed successfully');
} catch (error) {
    console.error('Migration failed:', error);
    db.close();
    process.exit(1);
}
