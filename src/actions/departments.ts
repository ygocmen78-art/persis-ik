"use server"

import { db } from "@/db"
import { departments, employees } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { unstable_noStore as noStore } from 'next/cache'

// Get all departments from the departments table
export async function getDepartments() {
    const allDepartments = await db.select().from(departments).orderBy(departments.name)
    return allDepartments
}

// Get unique department names (combines departments table + employee departments)
export async function getUniqueDepartments() {
    noStore() // Disable caching for this function
    try {
        // Get departments from departments table
        const deptTable = await db.select({ name: departments.name }).from(departments)

        // Get departments from employees table
        const allEmployees = await db
            .select({ department: employees.department })
            .from(employees)

        // Combine and get unique
        const deptFromTable = deptTable.map(d => d.name)
        const deptFromEmployees = allEmployees
            .map(e => e.department)
            .filter(d => d !== null && d !== undefined && d !== '')

        const uniqueDepts = [...new Set([...deptFromTable, ...deptFromEmployees as string[]])].sort()

        return uniqueDepts
    } catch (error: any) {
        console.error("Error fetching departments:", error)
        return [`HATA: ${error.message}`]
    }
}

// Add a new department
export async function addDepartment(data: { name: string; description?: string }) {
    try {
        await db.insert(departments).values({
            name: data.name,
            description: data.description,
        })
        revalidatePath("/settings")
        revalidatePath("/employees/new")
        return { success: true, message: "Departman başarıyla eklendi." }
    } catch (error: any) {
        console.error("Add department error:", error)
        if (error.message?.includes("UNIQUE constraint failed")) {
            return { success: false, message: "Bu departman zaten mevcut." }
        }
        return { success: false, message: "Departman eklenirken bir hata oluştu." }
    }
}

// Delete a department
export async function deleteDepartment(id: number) {
    try {
        // Check if any employees use this department
        const dept = await db.select().from(departments).where(eq(departments.id, id))
        if (dept.length === 0) {
            return { success: false, message: "Departman bulunamadı." }
        }

        const employeesInDept = await db
            .select()
            .from(employees)
            .where(eq(employees.department, dept[0].name))

        if (employeesInDept.length > 0) {
            return {
                success: false,
                message: `Bu departmanda ${employeesInDept.length} personel var. Önce onları başka departmana taşıyın.`
            }
        }

        await db.delete(departments).where(eq(departments.id, id))
        revalidatePath("/settings")
        revalidatePath("/employees/new")
        return { success: true, message: "Departman başarıyla silindi." }
    } catch (error) {
        console.error("Delete department error:", error)
        return { success: false, message: "Departman silinirken bir hata oluştu." }
    }
}

export async function updateDepartment(id: number, data: { name: string; description?: string }) {
    try {
        // Validation: Check if name exists (excluding current id)
        // Drizzle doesn't have a simple "not equal" for update constraints easily without raw sql sometimes, 
        // but we can catch the unique constraint error.

        await db.update(departments).set({
            name: data.name,
            description: data.description,
        }).where(eq(departments.id, id))

        revalidatePath("/settings")
        revalidatePath("/employees/new")
        return { success: true, message: "Departman güncellendi." }
    } catch (error: any) {
        console.error("Update department error:", error)
        if (error.message?.includes("UNIQUE constraint failed")) {
            return { success: false, message: "Bu departman adı zaten kullanılıyor." }
        }
        return { success: false, message: "Departman güncellenirken hata oluştu." }
    }
}
