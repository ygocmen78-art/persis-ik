const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

const queries = [
    `ALTER TABLE branches ADD COLUMN sgk_system_password TEXT;`,
    `ALTER TABLE branches ADD COLUMN sgk_workplace_password TEXT;`,
    `ALTER TABLE branches ADD COLUMN sgk_user_code TEXT;`,
    `ALTER TABLE branches ADD COLUMN sgk_code TEXT;`
];

for (const query of queries) {
    try {
        db.exec(query);
        console.log('Successfully ran:', query);
    } catch (e) {
        if (e.message.includes('duplicate column name')) {
            console.log('Column already exists, skipping:', query);
        } else {
            console.error('Error running:', query, e.message);
        }
    }
}
console.log('Migration complete');
