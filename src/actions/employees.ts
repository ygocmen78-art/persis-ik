"use server"

import { db } from "@/db"
import { employees, branches, leaves, garnishments, garnishmentInstallments, isgRecords, documents, expenses, customOccupationCodes, employmentHistory, attendance, disciplinaryRecords } from "@/db/schema"
import { eq, desc, inArray, isNotNull } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { alias } from "drizzle-orm/sqlite-core"

const sgkBranches = alias(branches, "sgk_branches")

// Personel Listesi (Branch bilgisiyle beraber)
export async function getEmployees() {
    const result = await db.select({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        branchId: employees.branchId,
        branchName: branches.name,
        sgkBranchId: employees.sgkBranchId,
        sgkBranchName: sgkBranches.name,
        department: employees.department,
        position: employees.position,
        status: employees.status,
        email: employees.email,
        phone: employees.phone,
        avatarUrl: employees.avatarUrl,
        startDate: employees.startDate,
        birthDate: employees.birthDate,
        gender: employees.gender,
        tcNumber: employees.tcNumber,
        salary: employees.salary,
        iban: employees.iban,
        terminationDate: employees.terminationDate,
    })
        .from(employees)
        .leftJoin(branches, eq(employees.branchId, branches.id))
        .leftJoin(sgkBranches, eq(employees.sgkBranchId, sgkBranches.id))
        .orderBy(desc(employees.createdAt))

    return result
}

// Tek Personel Getir
export async function getEmployee(id: number) {
    const result = await db.select().from(employees).where(eq(employees.id, id)).get()
    return result
}

// Yeni Personel Ekle
export async function addEmployee(data: {
    branchId?: number
    sgkBranchId?: number
    firstName: string
    lastName: string
    tcNumber: string
    phone?: string
    birthDate?: string
    gender?: string
    startDate?: string
    salary?: number
    grossSalary?: number
    iban?: string
    email?: string
    position?: string
    department?: string
    besStatus?: string
    ehliyetClass?: string
    ehliyetExpiry?: string
    srcExpiry?: string
    psikoteknikExpiry?: string
    employmentStatus?: string
}) {
    try {
        await db.insert(employees).values({
            branchId: data.branchId,
            sgkBranchId: data.sgkBranchId || data.branchId, // Default to working branch if not set
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email || null,
            phone: data.phone,
            tcNumber: data.tcNumber,
            birthDate: data.birthDate,
            gender: data.gender || "male",
            startDate: data.startDate,
            position: data.position,
            department: data.department,
            salary: data.salary,
            grossSalary: data.grossSalary,
            iban: data.iban,
            besStatus: data.besStatus || "voluntary",
            ehliyetClass: data.ehliyetClass || null,
            ehliyetExpiry: data.ehliyetExpiry || null,
            srcExpiry: data.srcExpiry || null,
            psikoteknikExpiry: data.psikoteknikExpiry || null,
            employmentStatus: data.employmentStatus || "Daimi",
            status: "active",
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.firstName}${data.lastName}&${data.gender === "female"
                ? "top[]=longHair,longHairBigHair,longHairBob,longHairBun,longHairCurly,longHairCurvy,longHairDreads,longHairFrida,longHairFro,longHairFroBand,longHairNotTooLong,longHairMiaWallace,longHairStraight,longHairStraight2,longHairStraightStrand&facialHairProbability=0"
                : "top[]=shortHair,shortHairDreads01,shortHairDreads02,shortHairFrizzle,shortHairShaggyMullet,shortHairShortCurly,shortHairShortFlat,shortHairShortRound,shortHairShortWaved,shortHairSides,shortHairTheCaesar,shortHairTheCaesarSidePart&facialHairProbability=40"
                }`
        })

        revalidatePath("/employees")
        return { success: true, message: "Personel başarıyla eklendi." }
    } catch (error: any) {
        console.error("Add employee error:", error)
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.message?.includes('UNIQUE constraint failed: employees.tc_number')) {
            return { success: false, message: "Bu TC Kimlik Numarası ile kayıtlı bir personel zaten var." }
        }
        return { success: false, message: "Personel eklenirken hata oluştu." }
    }
}

// Personel Güncelle
export async function updateEmployee(id: number, data: {
    branchId?: number
    sgkBranchId?: number
    firstName?: string
    lastName?: string
    tcNumber?: string
    phone?: string
    birthDate?: string
    gender?: string
    startDate?: string
    email?: string
    position?: string
    department?: string
    salary?: number
    grossSalary?: number
    iban?: string
    besStatus?: string
    leaveCarryover?: number
    ehliyetClass?: string
    ehliyetExpiry?: string
    srcExpiry?: string
    psikoteknikExpiry?: string
    employmentStatus?: string
}) {
    try {
        await db.update(employees)
            .set({
                ...data,
                updatedAt: new Date().toISOString()
            })
            .where(eq(employees.id, id))
        revalidatePath("/employees")
        revalidatePath(`/employees/${id}`)
        return { success: true, message: "Personel başarıyla güncellendi." }
    } catch (error: any) {
        console.error("Update employee error:", error)
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.message?.includes('UNIQUE constraint failed: employees.tc_number')) {
            return { success: false, message: "Bu TC Kimlik Numarası ile kayıtlı bir personel zaten var." }
        }
        return { success: false, message: "Personel güncellenirken hata oluştu." }
    }
}

// Pozisyonları getir (Auto-complete için)
export async function getUniquePositions() {
    try {
        const [dbPositions, customCodes] = await Promise.all([
            db.selectDistinct({ position: employees.position })
                .from(employees)
                .where(isNotNull(employees.position)),
            db.select({ code: customOccupationCodes.code, description: customOccupationCodes.description })
                .from(customOccupationCodes)
        ])

        const fromDb = dbPositions
            .map(r => r.position)
            .filter((p): p is string => typeof p === 'string' && p.length > 0)

        const fromCustom = customCodes.map(c => c.description ? `${c.code} - ${c.description}` : c.code)

        return [...new Set([...fromCustom, ...fromDb])].sort()
    } catch (error) {
        console.error("Get positions error:", error)
        return []
    }
}

// Personel Pasife Çek / Çıkar
export async function terminateEmployee(id: number, data: { date: Date, reason: string, code: string }) {
    await db.update(employees).set({
        status: "passive",
        terminationDate: data.date.toISOString(),
        terminationReason: data.reason,
        sgkExitCode: data.code,
    }).where(eq(employees.id, id))

    revalidatePath("/employees")
    return { success: true, message: "Personel işten çıkarıldı." }
}

// Personel Çıkışı İptal Et (Geri Al)
export async function cancelTermination(id: number) {
    await db.update(employees).set({
        status: "active",
        terminationDate: null,
        terminationReason: null,
        sgkExitCode: null,
    }).where(eq(employees.id, id))

    revalidatePath("/employees")
    return { success: true, message: "Personel çıkış işlemi iptal edildi, tekrar aktif." }
}

export async function deleteEmployee(id: number) {
    try {
        db.transaction((tx) => {
            // 1. İcraları ve Taksitlerini Sil
            const empGarnishments = tx.select({ id: garnishments.id }).from(garnishments).where(eq(garnishments.employeeId, id)).all();
            if (empGarnishments.length > 0) {
                const garnishmentIds = empGarnishments.map(g => g.id);
                // Bu icralara ait taksitleri sil
                tx.delete(garnishmentInstallments)
                    .where(inArray(garnishmentInstallments.garnishmentId, garnishmentIds))
                    .run();

                // İcraları sil
                tx.delete(garnishments).where(eq(garnishments.employeeId, id)).run();
            }

            // 2. İzinleri Sil
            tx.delete(leaves).where(eq(leaves.employeeId, id)).run();

            // 3. İSG Kayıtlarını Sil
            tx.delete(isgRecords).where(eq(isgRecords.employeeId, id)).run();

            // 3b. Devam ve Disiplin Kayıtlarını Sil
            tx.delete(attendance).where(eq(attendance.employeeId, id)).run();
            tx.delete(disciplinaryRecords).where(eq(disciplinaryRecords.employeeId, id)).run();

            // 4. Dokümanları Sil
            tx.delete(documents).where(eq(documents.employeeId, id)).run();

            // 5. Harcamaları Sil
            tx.delete(employmentHistory).where(eq(employmentHistory.employeeId, id)).run();
            tx.delete(expenses).where(eq(expenses.employeeId, id)).run();

            // 6. Personeli Sil
            tx.delete(employees).where(eq(employees.id, id)).run();
        });

        revalidatePath("/employees")
        return { success: true, message: "Personel ve ilgili tüm kayıtları silindi." }
    } catch (error: any) {
        console.error("Delete employee error:", error);
        return { success: false, message: `Silme işlemi sırasında hata oluştu: ${error.message}` }
    }
}

export async function deleteEmployees(ids: number[]) {
    try {
        db.transaction((tx) => {
            // 1. İcraları ve Taksitlerini Sil
            const empGarnishments = tx.select({ id: garnishments.id }).from(garnishments).where(inArray(garnishments.employeeId, ids)).all();
            if (empGarnishments.length > 0) {
                const garnishmentIds = empGarnishments.map(g => g.id);
                // Bu icralara ait taksitleri sil
                tx.delete(garnishmentInstallments)
                    .where(inArray(garnishmentInstallments.garnishmentId, garnishmentIds))
                    .run();

                // İcraları sil
                tx.delete(garnishments).where(inArray(garnishments.employeeId, ids)).run();
            }

            // 2. İzinleri Sil
            tx.delete(leaves).where(inArray(leaves.employeeId, ids)).run();

            // 3. İSG Kayıtlarını Sil
            tx.delete(isgRecords).where(inArray(isgRecords.employeeId, ids)).run();

            // 3b. Devam ve Disiplin Kayıtlarını Sil
            tx.delete(attendance).where(inArray(attendance.employeeId, ids)).run();
            tx.delete(disciplinaryRecords).where(inArray(disciplinaryRecords.employeeId, ids)).run();

            // 4. Dokümanları Sil
            tx.delete(documents).where(inArray(documents.employeeId, ids)).run();

            // 5. Harcamaları Sil
            tx.delete(employmentHistory).where(inArray(employmentHistory.employeeId, ids)).run();
            tx.delete(expenses).where(inArray(expenses.employeeId, ids)).run();

            // 6. Personeli Sil
            tx.delete(employees).where(inArray(employees.id, ids)).run();
        });

        revalidatePath("/employees")
        return { success: true, message: `${ids.length} personel ve ilgili tüm kayıtları silindi.` }
    } catch (error: any) {
        console.error("Bulk delete employee error:", error);
        return { success: false, message: `Toplu silme işlemi sırasında hata oluştu: ${error.message}` }
    }
}

// Ehliyet/SRC/Psikoteknik süresi yaklaşan personel
export async function getExpiringLicenses(daysAhead: number = 30) {
    const allEmployees = await db.select({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        ehliyetClass: employees.ehliyetClass,
        ehliyetExpiry: employees.ehliyetExpiry,
        srcExpiry: employees.srcExpiry,
        psikoteknikExpiry: employees.psikoteknikExpiry,
    }).from(employees).where(eq(employees.status, "active"))

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const limitDate = new Date(today)
    limitDate.setDate(limitDate.getDate() + daysAhead)

    const alerts: Array<{
        employeeId: number
        employeeName: string
        type: string
        expiryDate: string
        status: 'expired' | 'expiring'
    }> = []

    for (const emp of allEmployees) {
        const checks = [
            { type: 'Ehliyet', date: emp.ehliyetExpiry },
            { type: 'SRC Belgesi', date: emp.srcExpiry },
            { type: 'Psikoteknik', date: emp.psikoteknikExpiry },
        ]
        for (const check of checks) {
            if (!check.date) continue
            const expDate = new Date(check.date)
            expDate.setHours(0, 0, 0, 0)
            if (expDate <= limitDate) {
                alerts.push({
                    employeeId: emp.id,
                    employeeName: `${emp.firstName} ${emp.lastName}`,
                    type: check.type,
                    expiryDate: check.date,
                    status: expDate < today ? 'expired' : 'expiring',
                })
            }
        }
    }

    return alerts
}