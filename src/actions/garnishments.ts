"use server"

import { db } from "@/db"
import { garnishments, garnishmentInstallments, employees, branches } from "@/db/schema"
import { eq, desc, and, like } from "drizzle-orm"
import { revalidatePath } from "next/cache"

// getGarnishments removed from here, it is defined below


export async function getGarnishmentInstallments(garnishmentId: number) {
    return await db.select().from(garnishmentInstallments)
        .where(eq(garnishmentInstallments.garnishmentId, garnishmentId))
        .orderBy(garnishmentInstallments.paymentDate)
}

export async function addGarnishment(data: {
    employeeId: number
    fileNumber: string
    officeName: string
    totalAmount: number
    deductionAmount?: number
    iban?: string
    notificationDate?: string
    creditor?: string
}) {
    try {
        // Get existing garnishments for this employee to determine next priority
        const existingGarnishments = await db.select()
            .from(garnishments)
            .where(eq(garnishments.employeeId, data.employeeId))

        const nextPriority = existingGarnishments.length + 1

        await db.insert(garnishments).values({
            employeeId: data.employeeId,
            fileNumber: data.fileNumber,
            officeName: data.officeName,
            totalAmount: data.totalAmount,
            deductionAmount: data.deductionAmount,
            iban: data.iban,
            notificationDate: data.notificationDate,
            creditor: data.creditor,
            remainingAmount: data.totalAmount, // Initially remaining = total
            priorityOrder: nextPriority, // Auto-assign next priority
            status: "active"
        })
        revalidatePath("/garnishments")
        return { success: true, message: "İcra dosyası eklendi." }
    } catch (error) {
        console.error("Error adding garnishment:", error)
        return { success: false, message: "İcra dosyası eklenirken hata oluştu." }
    }
}

// Yeni: Taksit/Plan Ekleme
export async function addGarnishmentInstallment(data: {
    garnishmentId: number
    paymentDate: string
    amount: number
}) {
    try {
        await db.insert(garnishmentInstallments).values({
            garnishmentId: data.garnishmentId,
            paymentDate: data.paymentDate,
            amount: data.amount,
            status: "pending"
        })
        revalidatePath("/garnishments")
        return { success: true, message: "Ödeme planı eklendi." }
    } catch (error) {
        return { success: false, message: "Hata oluştu." }
    }
}

export async function addGarnishmentRefund(data: {
    garnishmentId: number
    amount: number
    date: string
    description?: string
}) {
    try {
        await db.insert(garnishmentInstallments).values({
            garnishmentId: data.garnishmentId,
            paymentDate: data.date,
            amount: -Math.abs(data.amount), // Ensure it is negative
            status: "paid",
            paidAt: new Date().toISOString(),
            description: data.description || "İade"
        })

        const garnishment = await db.query.garnishments.findFirst({
            where: eq(garnishments.id, data.garnishmentId)
        })

        if (garnishment) {
            const newRemaining = garnishment.remainingAmount + Math.abs(data.amount)
            const newStatus = newRemaining > 0 ? "active" : garnishment.status

            await db.update(garnishments)
                .set({ remainingAmount: newRemaining, status: newStatus })
                .where(eq(garnishments.id, data.garnishmentId))
        }

        revalidatePath("/garnishments")
        return { success: true, message: "İade işlemi kaydedildi." }
    } catch (error) {
        console.error("Refund error:", error)
        return { success: false, message: "İade eklenirken hata oluştu." }
    }
}

/*
export async function addGarnishmentPayment(data: {
    garnishmentId: number
    amount: number
    description?: string
}) {
    // ... broken implementation relying on missing table ...
    return { success: false, message: "Not implemented" }
}
*/

export async function getGarnishments(filters?: { branchId?: number, year?: number, month?: number, employeeId?: number }) {
    let query = db.select({
        id: garnishments.id,
        employeeId: garnishments.employeeId,
        firstName: employees.firstName,
        lastName: employees.lastName,
        fileNumber: garnishments.fileNumber,
        officeName: garnishments.officeName,
        totalAmount: garnishments.totalAmount,
        remainingAmount: garnishments.remainingAmount,
        deductionAmount: garnishments.deductionAmount,
        iban: garnishments.iban,
        status: garnishments.status,
        notificationDate: garnishments.notificationDate,
        priorityOrder: garnishments.priorityOrder, // Added priority order
        creditor: garnishments.creditor,
    })
        .from(garnishments)
        .leftJoin(employees, eq(garnishments.employeeId, employees.id))

    const conditions = []

    if (filters?.employeeId) {
        conditions.push(eq(garnishments.employeeId, filters.employeeId))
    }

    if (filters?.branchId) {
        conditions.push(eq(employees.sgkBranchId, filters.branchId))
    }

    if (filters?.year) {
        if (filters.month) {
            const monthStr = filters.month.toString().padStart(2, '0')
            conditions.push(like(garnishments.notificationDate, `${filters.year}-${monthStr}-%`))
        } else {
            conditions.push(like(garnishments.notificationDate, `${filters.year}-%`))
        }
    }

    if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any
    }

    return await query.orderBy(desc(garnishments.createdAt))
}

export async function updateGarnishment(id: number, data: {
    fileNumber: string
    officeName: string
    totalAmount: number
    deductionAmount?: number
    iban?: string
    notificationDate?: string
    remainingAmount?: number
    creditor?: string
}) {
    try {
        await db.update(garnishments)
            .set({
                fileNumber: data.fileNumber,
                officeName: data.officeName,
                totalAmount: data.totalAmount,
                deductionAmount: data.deductionAmount,
                iban: data.iban,
                notificationDate: data.notificationDate,
                creditor: data.creditor,
                remainingAmount: data.remainingAmount // Allow manual correction if needed
            })
            .where(eq(garnishments.id, id))

        revalidatePath("/garnishments")
        return { success: true, message: "İcra dosyası güncellendi." }
    } catch (error) {
        console.error("Error updating garnishment:", error)
        return { success: false, message: "Güncelleme sırasında hata oluştu." }
    }
}

export async function deleteGarnishment(id: number) {
    try {
        await db.delete(garnishments).where(eq(garnishments.id, id))
        revalidatePath("/garnishments")
        return { success: true, message: "İcra dosyası silindi." }
    } catch (error) {
        console.error("Error deleting garnishment:", error)
        return { success: false, message: "İcra dosyası silinirken hata oluştu." }
    }
}

// Yeni: İcra Sıralamasını Değiştir
export async function updateGarnishmentPriority(employeeId: number, garnishmentId: number, newPriority: number) {
    try {
        // Get all garnishments for employee, ordered by current priority
        const employeeGarnishments = await db.select()
            .from(garnishments)
            .where(eq(garnishments.employeeId, employeeId))
            .orderBy(garnishments.priorityOrder)

        // Find the garnishment being moved
        const targetIndex = employeeGarnishments.findIndex(g => g.id === garnishmentId)
        if (targetIndex === -1) return { success: false, message: "İcra bulunamadı" }

        // Remove from current position
        const [movedItem] = employeeGarnishments.splice(targetIndex, 1)

        // Insert at new position (newPriority - 1 because array is 0-indexed)
        employeeGarnishments.splice(newPriority - 1, 0, movedItem)

        // Update all priorities
        for (let i = 0; i < employeeGarnishments.length; i++) {
            await db.update(garnishments)
                .set({ priorityOrder: i + 1 })
                .where(eq(garnishments.id, employeeGarnishments[i].id))
        }

        revalidatePath("/garnishments")
        return { success: true, message: "Sıralama güncellendi" }
    } catch (error) {
        console.error("Error updating priority:", error)
        return { success: false, message: "Sıralama güncellenirken hata oluştu" }
    }
}

// Yeni: İcrayı Kapat
export async function closeGarnishment(id: number) {
    try {
        await db.update(garnishments)
            .set({
                status: "completed",
                remainingAmount: 0
            })
            .where(eq(garnishments.id, id))

        revalidatePath("/garnishments")
        return { success: true, message: "İcra kapatıldı" }
    } catch (error) {
        console.error("Error closing garnishment:", error)
        return { success: false, message: "İcra kapatılırken hata oluştu" }
    }
}

// Yeni: Personele ait icraları getir
export async function GetEmployeeGarnishments(employeeId: number) {
    return await db.select()
        .from(garnishments)
        .where(eq(garnishments.employeeId, employeeId))
        .orderBy(garnishments.priorityOrder)
}

// Yeni: UYAP Cevap Yazısı için Veri Getir
export async function getGarnishmentResponseData(garnishmentId: number) {
    try {
        const garnish = await db.select().from(garnishments).where(eq(garnishments.id, garnishmentId)).get()
        if (!garnish) return null

        const employee = await db.select({
            id: employees.id,
            firstName: employees.firstName,
            lastName: employees.lastName,
            tcNumber: employees.tcNumber,
            salary: employees.salary,
            startDate: employees.startDate,
            terminationDate: employees.terminationDate,
            sgkBranchId: employees.sgkBranchId
        }).from(employees).where(eq(employees.id, garnish.employeeId)).get()

        if (!employee) return null

        // Get SGK Branch Name (Official Company Name)
        let companyName = "Şirket Bilgisi Yok"
        if (employee.sgkBranchId) {
            const branch = await db.select().from(branches).where(eq(branches.id, employee.sgkBranchId)).get()
            if (branch) companyName = branch.name
        }

        // Get other ACTIVE garnishments for this employee (for prioritization queue)
        // Exclude the current one, and sort by priority
        const otherGarnishments = await db.select()
            .from(garnishments)
            .where(eq(garnishments.employeeId, employee.id))
            .orderBy(garnishments.priorityOrder)

        // Filter active/ongoing ones that are NOT the current one and have higher priority (lower priorityOrder number)
        const priorGarnishments = otherGarnishments.filter(g =>
            g.id !== garnishmentId &&
            g.status === 'active' &&
            g.priorityOrder < garnish.priorityOrder
        )

        // Filter subsequent ones (those in queue after this one)
        const nextGarnishments = otherGarnishments.filter(g =>
            g.id !== garnishmentId &&
            g.status === 'active' &&
            g.priorityOrder > garnish.priorityOrder
        )

        return {
            garnishment: garnish,
            employee,
            companyName,
            priorGarnishments,
            nextGarnishments
        }
    } catch (error) {
        console.error("Error fetching response data:", error)
        return null
    }
}

export async function getEmployeesWithGarnishments() {
    const allGarnishments = await db.select({
        employeeId: garnishments.employeeId,
        firstName: employees.firstName,
        lastName: employees.lastName,
    })
        .from(garnishments)
        .innerJoin(employees, eq(garnishments.employeeId, employees.id));

    const map = new Map<number, { id: number, firstName: string, lastName: string }>();
    for (const g of allGarnishments) {
        if (!map.has(g.employeeId)) {
            map.set(g.employeeId, { id: g.employeeId, firstName: g.firstName || "", lastName: g.lastName || "" });
        }
    }

    return Array.from(map.values()).sort((a, b) => {
        const nameA = a.firstName + " " + a.lastName;
        const nameB = b.firstName + " " + b.lastName;
        return nameA.localeCompare(nameB, 'tr');
    });
}

export async function addGarnishmentResidualBalance(data: {
    id: number,
    amount: number
}) {
    try {
        const garnish = await db.query.garnishments.findFirst({
            where: eq(garnishments.id, data.id)
        })

        if (!garnish) return { success: false, message: "İcra dosyası bulunamadı." }

        // 1. Update Amount and Status
        const newTotal = garnish.totalAmount + data.amount
        const newRemaining = garnish.remainingAmount + data.amount

        // 2. Reprioritization Logic (Move to Rank 1)
        const employeeGarnishments = await db.select()
            .from(garnishments)
            .where(eq(garnishments.employeeId, garnish.employeeId))
            .orderBy(garnishments.priorityOrder)

        // Filter out the current one and re-insert at top
        const others = employeeGarnishments.filter(g => g.id !== garnish.id)

        // Update current one to Rank 1 and reactivate
        await db.update(garnishments)
            .set({
                totalAmount: newTotal,
                remainingAmount: newRemaining,
                status: "active",
                priorityOrder: 1
            })
            .where(eq(garnishments.id, garnish.id))

        // Update others to start from Rank 2
        for (let i = 0; i < others.length; i++) {
            await db.update(garnishments)
                .set({ priorityOrder: i + 2 })
                .where(eq(garnishments.id, others[i].id))
        }

        // 3. Add a traceable installment record
        await db.insert(garnishmentInstallments).values({
            garnishmentId: garnish.id,
            paymentDate: new Date().toISOString().split('T')[0],
            amount: data.amount,
            status: "paid", // It's an adjustment, so it's "paid" in reverse (added to debt)
            paidAt: new Date().toISOString(),
            description: "Bakiye Artışı"
        })

        revalidatePath("/garnishments")
        return { success: true, message: "Bakiye eklendi ve icra 1. sıraya taşındı." }
    } catch (error) {
        console.error("Error adding residual balance:", error)
        return { success: false, message: "Bakiye eklenirken hata oluştu." }
    }
}

export async function deleteGarnishmentInstallment(id: number) {
    try {
        const item = await db.query.garnishmentInstallments.findFirst({
            where: eq(garnishmentInstallments.id, id)
        })

        if (!item) return { success: false, message: "Kayıt bulunamadı." }

        const garnishmentId = item.garnishmentId
        const amount = item.amount

        // Delete the installment
        await db.delete(garnishmentInstallments).where(eq(garnishmentInstallments.id, id))

        // Revert the impact on the garnishment
        const garnish = await db.query.garnishments.findFirst({
            where: eq(garnishments.id, garnishmentId)
        })

        if (garnish) {
            let newRemaining = garnish.remainingAmount
            let newTotal = garnish.totalAmount

            if (item.description === "Bakiye Artışı") {
                // If it was a balance increase, subtract from both total and remaining
                newTotal -= amount
                newRemaining -= amount
            } else {
                // If it was a payment (positive amount) or refund (negative amount), revert it
                newRemaining += amount
            }

            // Ensure status is updated if remaining > 0
            const newStatus = newRemaining > 0 ? "active" : garnish.status

            await db.update(garnishments)
                .set({
                    remainingAmount: newRemaining,
                    totalAmount: newTotal,
                    status: newStatus
                })
                .where(eq(garnishments.id, garnishmentId))
        }

        revalidatePath("/garnishments")
        return { success: true, message: "Kayıt silindi ve borç güncellendi." }
    } catch (error) {
        console.error("Error deleting installment:", error)
        return { success: false, message: "Hata oluştu." }
    }
}
