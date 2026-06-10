"use server"

import { db } from "@/db"
import { disciplinaryRecords, employees } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { VIOLATION_TYPES } from "@/lib/disciplinary-constants"

export async function getDisciplinaryRecords() {
    const records = await db
        .select({
            id: disciplinaryRecords.id,
            employeeId: disciplinaryRecords.employeeId,
            employeeFirstName: employees.firstName,
            employeeLastName: employees.lastName,
            violationType: disciplinaryRecords.violationType,
            incidentDate: disciplinaryRecords.incidentDate,
            description: disciplinaryRecords.description,
            status: disciplinaryRecords.status,
            createdAt: disciplinaryRecords.createdAt,
        })
        .from(disciplinaryRecords)
        .leftJoin(employees, eq(disciplinaryRecords.employeeId, employees.id))
        .orderBy(desc(disciplinaryRecords.incidentDate))
    return records
}

export async function addDisciplinaryRecord(data: {
    employeeId: number
    violationType: string
    incidentDate: string
    description?: string
}) {
    try {
        await db.insert(disciplinaryRecords).values({
            employeeId: data.employeeId,
            violationType: data.violationType,
            incidentDate: data.incidentDate,
            description: data.description || null,
            status: "active",
        })
        revalidatePath("/disciplinary")
        return { success: true, message: "Disiplin tutanağı oluşturuldu." }
    } catch (e) {
        return { success: false, message: "Kayıt oluşturulamadı." }
    }
}

export async function deleteDisciplinaryRecord(id: number) {
    try {
        await db.delete(disciplinaryRecords).where(eq(disciplinaryRecords.id, id))
        revalidatePath("/disciplinary")
        return { success: true }
    } catch (e) {
        return { success: false }
    }
}
