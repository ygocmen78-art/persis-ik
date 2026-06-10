"use server"

import { db } from "@/db"
import { employmentHistory, employees, branches } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { alias } from "drizzle-orm/sqlite-core"

const sgkBranches = alias(branches, "sgk_branches_hist")

export async function getEmploymentHistory(employeeId: number) {
    try {
        return await db.select({
            id: employmentHistory.id,
            employeeId: employmentHistory.employeeId,
            branchId: employmentHistory.branchId,
            department: employmentHistory.department,
            position: employmentHistory.position,
            startDate: employmentHistory.startDate,
            endDate: employmentHistory.endDate,
            terminationReason: employmentHistory.terminationReason,
            sgkExitCode: employmentHistory.sgkExitCode,
            salary: employmentHistory.salary,
            createdAt: employmentHistory.createdAt,
            branchName: branches.name,
        })
        .from(employmentHistory)
        .leftJoin(branches, eq(employmentHistory.branchId, branches.id))
        .where(eq(employmentHistory.employeeId, employeeId))
        .orderBy(desc(employmentHistory.startDate))
    } catch(e) {
        return []
    }
}

export async function rehireEmployee(employeeId: number, data: {
    branchId?: number
    sgkBranchId?: number
    department?: string
    position?: string
    startDate: string
    salary?: number
}) {
    try {
        // Get current employee data to save to history
        const employee = await db.select().from(employees).where(eq(employees.id, employeeId)).get()
        if (!employee) return { success: false, message: "Personel bulunamadı." }

        // Save current employment to history
        await db.insert(employmentHistory).values({
            employeeId: employee.id,
            branchId: employee.branchId,
            sgkBranchId: employee.sgkBranchId,
            department: employee.department,
            position: employee.position,
            startDate: employee.startDate,
            endDate: employee.terminationDate,
            terminationReason: employee.terminationReason,
            sgkExitCode: employee.sgkExitCode,
            salary: employee.salary,
        })

        // Update employee with new employment details
        await db.update(employees).set({
            branchId: data.branchId,
            sgkBranchId: data.sgkBranchId || data.branchId,
            department: data.department,
            position: data.position,
            startDate: data.startDate,
            salary: data.salary,
            status: "active",
            terminationDate: null,
            terminationReason: null,
            sgkExitCode: null,
            updatedAt: new Date().toISOString(),
        }).where(eq(employees.id, employeeId))

        revalidatePath(`/employees/${employeeId}`)
        revalidatePath("/employees")
        return { success: true, message: "Personel başarıyla yeniden işe alındı." }
    } catch(e: any) {
        return { success: false, message: e.message }
    }
}
