import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'sqlite.db');
const db = new Database(dbPath);

try {
    console.log('Adding missing columns...');

    // Check and add iban column to garnishments
    const garnishmentsInfo = db.prepare("PRAGMA table_info(garnishments)").all();
    const hasIban = garnishmentsInfo.some((col: any) => col.name === 'iban');

    if (!hasIban) {
        db.prepare('ALTER TABLE garnishments ADD COLUMN iban TEXT').run();
        console.log('✓ iban column added to garnishments table');
    } else {
        console.log('✓ iban column already exists in garnishments');
    }

    // Check and add document_type_id column to isg_records
    const isgRecordsInfo = db.prepare("PRAGMA table_info(isg_records)").all();
    const hasDocTypeId = isgRecordsInfo.some((col: any) => col.name === 'document_type_id');

    if (!hasDocTypeId) {
        db.prepare('ALTER TABLE isg_records ADD COLUMN document_type_id INTEGER').run();
        console.log('✓ document_type_id column added to isg_records table');
    } else {
        console.log('✓ document_type_id column already exists in isg_records');
    }

    db.close();
    console.log('Migration completed successfully');
} catch (error) {
    console.error('Migration failed:', error);
    db.close();
    process.exit(1);
}
