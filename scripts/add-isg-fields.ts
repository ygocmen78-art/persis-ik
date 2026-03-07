import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'sqlite.db');
const db = new Database(dbPath);

try {
    console.log('Adding ISG schema enhancements...');

    // Add validityMonths and description to isg_document_types
    const docTypesInfo = db.prepare("PRAGMA table_info(isg_document_types)").all();
    const hasValidityMonths = docTypesInfo.some((col: any) => col.name === 'validity_months');
    const hasDescription = docTypesInfo.some((col: any) => col.name === 'description');

    if (!hasValidityMonths) {
        db.prepare('ALTER TABLE isg_document_types ADD COLUMN validity_months INTEGER DEFAULT 12').run();
        console.log('✓ validity_months column added to isg_document_types');
    } else {
        console.log('✓ validity_months already exists in isg_document_types');
    }

    if (!hasDescription) {
        db.prepare('ALTER TABLE isg_document_types ADD COLUMN description TEXT').run();
        console.log('✓ description column added to isg_document_types');
    } else {
        console.log('✓ description already exists in isg_document_types');
    }

    // Add new fields to isg_records
    const recordsInfo = db.prepare("PRAGMA table_info(isg_records)").all();
    const hasDocumentDate = recordsInfo.some((col: any) => col.name === 'document_date');
    const hasExpiryDate = recordsInfo.some((col: any) => col.name === 'expiry_date');
    const hasFilePath = recordsInfo.some((col: any) => col.name === 'file_path');
    const hasFileType = recordsInfo.some((col: any) => col.name === 'file_type');

    if (!hasDocumentDate) {
        db.prepare('ALTER TABLE isg_records ADD COLUMN document_date TEXT').run();
        console.log('✓ document_date column added to isg_records');
    } else {
        console.log('✓ document_date already exists in isg_records');
    }

    if (!hasExpiryDate) {
        db.prepare('ALTER TABLE isg_records ADD COLUMN expiry_date TEXT').run();
        console.log('✓ expiry_date column added to isg_records');
    } else {
        console.log('✓ expiry_date already exists in isg_records');
    }

    if (!hasFilePath) {
        db.prepare('ALTER TABLE isg_records ADD COLUMN file_path TEXT').run();
        console.log('✓ file_path column added to isg_records');
    } else {
        console.log('✓ file_path already exists in isg_records');
    }

    if (!hasFileType) {
        db.prepare('ALTER TABLE isg_records ADD COLUMN file_type TEXT').run();
        console.log('✓ file_type column added to isg_records');
    } else {
        console.log('✓ file_type already exists in isg_records');
    }

    db.close();
    console.log('Migration completed successfully');
} catch (error) {
    console.error('Migration failed:', error);
    db.close();
    process.exit(1);
}
