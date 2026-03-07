const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

try {
    const info = db.prepare('ALTER TABLE garnishment_installments ADD COLUMN description text').run();
    console.log('Column description added successfully:', info);
} catch (error) {
    if (error.message.includes('duplicate column name')) {
        console.log('Column description already exists.');
    } else {
        console.error('Error adding column:', error);
    }
}
