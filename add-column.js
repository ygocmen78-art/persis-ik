const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

try {
    const info = db.prepare('ALTER TABLE garnishments ADD COLUMN notification_date text').run();
    console.log('Column added successfully:', info);
} catch (error) {
    if (error.message.includes('duplicate column name')) {
        console.log('Column already exists.');
    } else {
        console.error('Error adding column:', error);
    }
}
