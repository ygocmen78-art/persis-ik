
import { db } from "../src/db"
import { employees } from "../src/db/schema"

async function main() {
    console.log("Fetching employees...")
    const result = await db.select({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        startDate: employees.startDate,
        birthDate: employees.birthDate
    }).from(employees).limit(5)

    console.log("Employees found:", result.length)
    result.forEach(emp => {
        console.log(`ID: ${emp.id}, Name: ${emp.firstName} ${emp.lastName}`)
        console.log(`  Start Date (Raw): ${emp.startDate}`)
        console.log(`  Birth Date (Raw): ${emp.birthDate}`)

        if (emp.startDate) {
            const date = new Date(emp.startDate)
            console.log(`  Start Date (Parsed): ${date.toString()}`)
        }
    })
}

main().catch(console.error)
