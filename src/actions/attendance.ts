"use server"

import { db } from "@/db"
import { attendance, attendanceSettings, employees } from "@/db/schema"
import { eq, and, gte, lte } from "drizzle-orm"
import { revalidatePath } from "next/cache"


// Belirli ay için puantaj verilerini getir
export async function getAttendance(branchId: number | null, year: number, month: number) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    const records = await db.select()
        .from(attendance)
        .where(
            and(
                gte(attendance.date, startDate),
                lte(attendance.date, endDate)
            )
        )

    return records
}

// Tek bir gün için durum kaydet/güncelle
export async function setAttendanceStatus(employeeId: number, date: string, status: string | null) {
    try {
        if (status === null) {
            // Sil
            await db.delete(attendance)
                .where(and(
                    eq(attendance.employeeId, employeeId),
                    eq(attendance.date, date)
                ))
        } else {
            // Mevcut kayıt var mı?
            const existing = await db.select()
                .from(attendance)
                .where(and(
                    eq(attendance.employeeId, employeeId),
                    eq(attendance.date, date)
                ))

            if (existing.length > 0) {
                await db.update(attendance)
                    .set({ status, updatedAt: new Date().toISOString() })
                    .where(and(
                        eq(attendance.employeeId, employeeId),
                        eq(attendance.date, date)
                    ))
            } else {
                await db.insert(attendance).values({
                    employeeId,
                    date,
                    status,
                })
            }
        }

        revalidatePath("/attendance")
        return { success: true }
    } catch (error) {
        console.error("Attendance error:", error)
        return { success: false, message: "Kayıt hatası" }
    }
}

// Pazar ücreti ayarlarını getir
export async function getSundayPayRate(): Promise<number> {
    const result = await db.select()
        .from(attendanceSettings)
        .where(eq(attendanceSettings.key, "sunday_pay_rate"))

    return result.length > 0 ? parseFloat(result[0].value) : 500
}

// Pazar ücretini güncelle
export async function setSundayPayRate(amount: number) {
    const existing = await db.select()
        .from(attendanceSettings)
        .where(eq(attendanceSettings.key, "sunday_pay_rate"))

    if (existing.length > 0) {
        await db.update(attendanceSettings)
            .set({ value: amount.toString() })
            .where(eq(attendanceSettings.key, "sunday_pay_rate"))
    } else {
        await db.insert(attendanceSettings).values({
            key: "sunday_pay_rate",
            value: amount.toString(),
        })
    }

    revalidatePath("/attendance")
    return { success: true }
}

// Pazar çalışma raporu - kişi bazlı özet
export async function getAttendanceReport(branchId: number | null, year: number, month: number) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    const records = await db.select()
        .from(attendance)
        .where(
            and(
                gte(attendance.date, startDate),
                lte(attendance.date, endDate)
            )
        )

    const sundayRate = await getSundayPayRate()

    // Kişi bazlı özet
    const employeeSummary: Record<number, {
        sundayWorked: number
        sundayLeaveUsed: number
        netSundayPay: number
        presentDays: number
        annualLeave: number
        sickLeave: number
        unpaidLeave: number
        absent: number
    }> = {}

    // Benzersiz personel ID'lerini al (Bu ay kaydı olanlar veya tüm aktif personeli almamız gerekirdi)
    // Şube filtresine göre tüm personeli alalım çünkü hiç kaydı olmayanların da "Geldi" sayılması lazım
    let employeesQuery = db.select({ id: employees.id }).from(employees).where(eq(employees.status, "active"))
    const activeEmployees = await employeesQuery

    activeEmployees.forEach(emp => {
        employeeSummary[emp.id] = {
            sundayWorked: 0,
            sundayLeaveUsed: 0,
            netSundayPay: 0,
            presentDays: 0,
            annualLeave: 0,
            sickLeave: 0,
            unpaidLeave: 0,
            absent: 0,
        }
    })

    // Kayıtları bir haritaya koy
    const recordMap: Record<string, string> = {}
    records.forEach(r => {
        recordMap[`${r.employeeId}-${r.date}`] = r.status || ""
    })

    // Her gün için hesapla
    activeEmployees.forEach(emp => {
        const s = employeeSummary[emp.id]

        for (let day = 1; day <= lastDay; day++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const date = new Date(year, month - 1, day)
            const isSunday = date.getDay() === 0

            let status = recordMap[`${emp.id}-${dateStr}`]

            // Eğer kayıt yoksa ve pazar değilse, varsayılan olarak "present" kabul et
            if (!status && !isSunday) {
                status = "present"
            }

            switch (status) {
                case "present": s.presentDays++; break
                case "sunday_work": s.sundayWorked++; break
                case "sunday_leave_used": s.sundayLeaveUsed++; break
                case "annual_leave": s.annualLeave++; break
                case "sick_leave": s.sickLeave++; break
                case "unpaid_leave": s.unpaidLeave++; break
                case "absent": s.absent++; break
            }
        }

        // Net pazar ücreti hesapla
        s.netSundayPay = Math.max(0, s.sundayWorked - s.sundayLeaveUsed) * sundayRate
    })

    return { employeeSummary, sundayRate }
}
