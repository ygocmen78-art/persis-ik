"use server"

import { db } from "@/db"
import { leaves, employees } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { calculateAnnualLeaveEntitlement } from "@/lib/leave-utils"
import { format } from "date-fns"
import { calculateLeaveDays } from "@/lib/holiday-utils"

export async function addLeaveRequest(data: {
    employeeId: number;
    type: string;
    startDate: string;
    endDate: string;
    returnDate: string;
    description?: string;
    status?: string;
}) {
    const startDateObj = new Date(data.startDate)
    const endDateObj = new Date(data.endDate)
    const daysCount = calculateLeaveDays(startDateObj, endDateObj)

    const status = data.status || "approved"

    try {
        // Check for overlapping leave dates
        const existingLeaves = await db.select()
            .from(leaves)
            .where(eq(leaves.employeeId, data.employeeId))

        for (const existingLeave of existingLeaves) {
            const existingStart = new Date(existingLeave.startDate)
            const existingEnd = new Date(existingLeave.endDate)

            // Check if dates overlap
            const hasOverlap = (
                (startDateObj >= existingStart && startDateObj <= existingEnd) ||
                (endDateObj >= existingStart && endDateObj <= existingEnd) ||
                (startDateObj <= existingStart && endDateObj >= existingEnd)
            )

            if (hasOverlap) {
                return {
                    success: false,
                    message: `Bu tarihler için zaten izin kaydı var (${format(existingStart, "dd.MM.yyyy")} - ${format(existingEnd, "dd.MM.yyyy")})`
                }
            }
        }

        // Annual leave check (informational, no longer blocking)
        if (data.type === "annual" && status === "approved") {
            const balance = await getEmployeeLeaveBalance(data.employeeId)
            if (daysCount > balance.remaining) {
                console.warn(`Yetersiz bakiye uyarısı: ${data.employeeId} nolu personel için ${daysCount} gün talep edildi, kalan ${balance.remaining} gün. İşleme devam ediliyor...`)
            }
        }

        await db.insert(leaves).values({
            employeeId: data.employeeId,
            type: data.type,
            startDate: data.startDate,
            endDate: data.endDate,
            returnDate: data.returnDate,
            daysCount,
            description: data.description,
            status,
        })
        revalidatePath("/leave")
        revalidatePath(`/employees/${data.employeeId}`)
        return { success: true, message: "İzin kaydı eklendi." }
    } catch (error) {
        console.error("Add leave error:", error)
        return { success: false, message: "İzin eklenirken hata oluştu." }
    }
}

export async function updateLeaveRequest(id: number, data: {
    type: string;
    startDate: string;
    endDate: string;
    returnDate: string;
    description?: string;
    status?: string;
}) {
    const startDateObj = new Date(data.startDate)
    const endDateObj = new Date(data.endDate)
    const daysCount = calculateLeaveDays(startDateObj, endDateObj)

    try {
        const existingLeave = await db.query.leaves.findFirst({
            where: eq(leaves.id, id)
        })

        if (!existingLeave) {
            return { success: false, message: "İzin kaydı bulunamadı." }
        }

        if (data.type === "annual" && (data.status || existingLeave.status) === "approved") {
            const balance = await getEmployeeLeaveBalance(existingLeave.employeeId)

            // Adjust balance if the existing leave was also annual and approved
            let availableBalance = balance.remaining
            if (existingLeave.type === "annual" && existingLeave.status === "approved") {
                availableBalance += existingLeave.daysCount
            }

            if (daysCount > availableBalance) {
                console.warn(`Yetersiz bakiye uyarısı: ${existingLeave.employeeId} nolu personel için ${daysCount} gün talep edildi, kalan ${availableBalance} gün. İşleme devam ediliyor...`)
            }
        }

        await db.update(leaves)
            .set({
                type: data.type,
                startDate: data.startDate,
                endDate: data.endDate,
                returnDate: data.returnDate,
                daysCount,
                description: data.description,
                status: data.status || existingLeave.status,
            })
            .where(eq(leaves.id, id))

        revalidatePath("/leave")
        revalidatePath(`/employees/${existingLeave.employeeId}`)
        return { success: true, message: "İzin kaydı güncellendi." }
    } catch (error) {
        console.error("Update leave error:", error)
        return { success: false, message: "İzin güncellenirken hata oluştu." }
    }
}

export async function deleteLeaveRequest(id: number) {
    try {
        const existingLeave = await db.query.leaves.findFirst({
            where: eq(leaves.id, id)
        })

        if (!existingLeave) {
            return { success: false, message: "İzin kaydı bulunamadı." }
        }

        await db.delete(leaves).where(eq(leaves.id, id))

        revalidatePath("/leave")
        revalidatePath(`/employees/${existingLeave.employeeId}`)
        return { success: true, message: "İzin kaydı silindi." }
    } catch (error) {
        console.error("Delete leave error:", error)
        return { success: false, message: "İzin silinirken hata oluştu." }
    }
}

export async function getLeaves() {
    return await db.select({
        id: leaves.id,
        employeeName: employees.firstName,
        employeeSurname: employees.lastName,
        type: leaves.type,
        startDate: leaves.startDate,
        endDate: leaves.endDate,
        daysCount: leaves.daysCount,
        status: leaves.status,
    })
        .from(leaves)
        .leftJoin(employees, eq(leaves.employeeId, employees.id))
        .orderBy(desc(leaves.createdAt))
}

export async function getEmployeeLeaves(employeeId: number) {
    return await db.select({
        id: leaves.id,
        type: leaves.type,
        startDate: leaves.startDate,
        endDate: leaves.endDate,
        daysCount: leaves.daysCount,
        returnDate: leaves.returnDate,
        description: leaves.description,
        status: leaves.status,
    })
        .from(leaves)
        .where(eq(leaves.employeeId, employeeId))
        .orderBy(desc(leaves.startDate))
}

export async function getEmployeeLeaveBalance(employeeId: number) {
    const employee = await db.query.employees.findFirst({
        where: eq(employees.id, employeeId),
        columns: {
            birthDate: true,
            startDate: true,
            leaveCarryover: true
        }
    })

    if (!employee || !employee.startDate) {
        return { entitlement: 0, used: 0, remaining: 0, carryover: 0 }
    }

    // Default birth date to 30 years ago if missing (to avoid <18 or >50 rule triggering unexpectedly)
    const birthDate = employee.birthDate ? new Date(employee.birthDate) : new Date(new Date().setFullYear(new Date().getFullYear() - 30))

    const entitlement = calculateAnnualLeaveEntitlement(
        birthDate,
        new Date(employee.startDate)
    )

    const previouslyUsed = employee.leaveCarryover || 0

    // Calculate used leaves (only "annual" type)
    const usedLeaves = await db.select().from(leaves).where(eq(leaves.employeeId, employeeId))

    // Simple calculation: just count days for now. 
    // In reality, we need to skip weekends/holidays, but start simple.
    let usedDays = 0
    usedLeaves.forEach(leave => {
        if (leave.type === "annual" && leave.status === "approved") {
            const start = new Date(leave.startDate)
            const end = new Date(leave.endDate)
            const diffTime = Math.abs(end.getTime() - start.getTime())
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // Inclusive
            usedDays += diffDays
        }
    })

    const totalUsed = previouslyUsed + usedDays

    return {
        entitlement,
        used: totalUsed,
        remaining: entitlement - totalUsed
    }
}

export async function getLeaveDetails(leaveId: number) {
    const data = await db.select({
        leave: leaves,
        employee: employees
    })
        .from(leaves)
        .leftJoin(employees, eq(leaves.employeeId, employees.id))
        .where(eq(leaves.id, leaveId))
        .limit(1)

    return data[0] || null
}

export async function getAllEmployeeLeaveBalances() {
    // 1. Fetch all active employees (we might want 'passive' ones too if needed, but 'active' is standard)
    const allEmployees = await db.select({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        startDate: employees.startDate,
        birthDate: employees.birthDate,
        leaveCarryover: employees.leaveCarryover,
        tcNumber: employees.tcNumber,
        department: employees.department,
        status: employees.status
    }).from(employees).where(eq(employees.status, "active"));

    // 2. Fetch all annual leaves for active employees
    const allLeaves = await db.select({
        employeeId: leaves.employeeId,
        type: leaves.type,
        status: leaves.status,
        startDate: leaves.startDate,
        endDate: leaves.endDate,
    }).from(leaves)
        .where(eq(leaves.type, "annual"));

    const reportData = allEmployees.map(emp => {
        if (!emp.startDate) {
            return {
                id: emp.id,
                fullName: `${emp.firstName} ${emp.lastName}`,
                department: emp.department || "-",
                startDate: "-",
                entitlement: 0,
                used: 0,
                carryover: emp.leaveCarryover || 0,
                remaining: 0
            }
        }

        const birthDate = emp.birthDate ? new Date(emp.birthDate) : new Date(new Date().setFullYear(new Date().getFullYear() - 30));
        const entitlement = calculateAnnualLeaveEntitlement(birthDate, new Date(emp.startDate));
        const previouslyUsed = emp.leaveCarryover || 0;

        // Sum up all approved annual leaves for this employee
        const empLeaves = allLeaves.filter(l => l.employeeId === emp.id && l.status === "approved");
        let usedDays = 0;
        empLeaves.forEach(leave => {
            const start = new Date(leave.startDate);
            const end = new Date(leave.endDate);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            usedDays += (Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
        });

        const totalUsed = previouslyUsed + usedDays;
        const remaining = entitlement - totalUsed;

        return {
            id: emp.id,
            fullName: `${emp.firstName} ${emp.lastName}`,
            department: emp.department || "-",
            startDate: emp.startDate,
            entitlement,
            used: totalUsed,
            carryover: previouslyUsed,
            remaining
        };
    });

    // Sort by remaining days ascending or by name
    return reportData.sort((a, b) => a.fullName.localeCompare(b.fullName));
}
