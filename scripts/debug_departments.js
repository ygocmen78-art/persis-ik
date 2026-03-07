const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

try {
    console.log("Fetching departments directly from DB...");
    const depts = db.prepare("SELECT name FROM departments").all();
    console.log("Departments table rows:", depts);

    console.log("Fetching unique departments from employees...");
    const employees = db.prepare("SELECT department FROM employees").all();
    const uniqueFromEmp = [...new Set(employees.map(e => e.department).filter(d => d))];
    console.log("Unique from employees:", uniqueFromEmp);

} catch (error) {
    console.error("Error:", error.message);
}
