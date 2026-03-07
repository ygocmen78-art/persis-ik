"use server"

import { db } from "@/db"
import { employees, leaves } from "@/db/schema"
import { eq } from "drizzle-orm"
import { calculateAnnualLeaveEntitlement } from "@/lib/leave-utils"

// 2026 defaults
const DEFAULT_GROSS_SALARY = 33030.00
const DEFAULT_SEVERANCE_CEILING = 65213.78
const STAMP_TAX_RATE = 0.00759
const INCOME_TAX_RATE = 0.15

interface CompensationRow {
    id: number
    fullName: string
    department: string | null
    startDate: string | null
    grossSalary: number
    serviceYears: number
    serviceMonths: number
    serviceDays: number
    kidemGross: number
    kidemNet: number
    ihbarWeeks: number
    ihbarGross: number
    ihbarNet: number
    leaveEntitlement: number
    leaveUsed: number
    leaveRemaining: number
    leavePayGross: number
    leavePayNet: number
    totalNet: number
}

function calculateTenure(startDate: Date, endDate: Date) {
    let years = endDate.getFullYear() - startDate.getFullYear()
    let months = endDate.getMonth() - startDate.getMonth()
    let days = endDate.getDate() - startDate.getDate()

    if (days < 0) {
        months -= 1
        const prevMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0)
        days += prevMonth.getDate()
    }
    if (months < 0) {
        years -= 1
        months += 12
    }

    return { years, months, days }
}

export async function getCompensationReport(severanceCeiling: number = DEFAULT_SEVERANCE_CEILING): Promise<CompensationRow[]> {
    const today = new Date()

    // Get all active employees
    const allEmployees = await db.select({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        department: employees.department,
        startDate: employees.startDate,
        birthDate: employees.birthDate,
        grossSalary: employees.grossSalary,
        leaveCarryover: employees.leaveCarryover,
    }).from(employees).where(eq(employees.status, "active"))

    // Get all approved annual leaves
    const allLeaves = await db.select({
        employeeId: leaves.employeeId,
        type: leaves.type,
        status: leaves.status,
        startDate: leaves.startDate,
        endDate: leaves.endDate,
    }).from(leaves).where(eq(leaves.type, "annual"))

    const results: CompensationRow[] = allEmployees.map(emp => {
        const salary = emp.grossSalary && emp.grossSalary > 0 ? emp.grossSalary : DEFAULT_GROSS_SALARY

        if (!emp.startDate) {
            return {
                id: emp.id,
                fullName: `${emp.firstName} ${emp.lastName}`,
                department: emp.department,
                startDate: null,
                grossSalary: salary,
                serviceYears: 0, serviceMonths: 0, serviceDays: 0,
                kidemGross: 0, kidemNet: 0,
                ihbarWeeks: 0, ihbarGross: 0, ihbarNet: 0,
                leaveEntitlement: 0, leaveUsed: 0, leaveRemaining: 0,
                leavePayGross: 0, leavePayNet: 0,
                totalNet: 0,
            }
        }

        const start = new Date(emp.startDate)
        const { years, months, days } = calculateTenure(start, today)

        // --- Kıdem Tazminatı ---
        const baseSalary = Math.min(salary, severanceCeiling)
        const totalYearRatio = years + (months / 12) + (days / 365)
        let kidemGross = years >= 1 ? totalYearRatio * baseSalary : 0
        const kidemTax = kidemGross * STAMP_TAX_RATE
        const kidemNet = kidemGross - kidemTax

        // --- İhbar Tazminatı ---
        const totalMonths = (years * 12) + months + (days / 30)
        let ihbarWeeks = 2
        if (totalMonths < 6) ihbarWeeks = 2
        else if (totalMonths < 18) ihbarWeeks = 4
        else if (totalMonths < 36) ihbarWeeks = 6
        else ihbarWeeks = 8

        const dailySalary = salary / 30
        const ihbarGross = dailySalary * (ihbarWeeks * 7)
        const ihbarIncomeTax = ihbarGross * INCOME_TAX_RATE
        const ihbarStampTax = ihbarGross * STAMP_TAX_RATE
        const ihbarNet = ihbarGross - ihbarIncomeTax - ihbarStampTax

        // --- Yıllık İzin Alacağı ---
        const birthDate = emp.birthDate ? new Date(emp.birthDate) : new Date(new Date().setFullYear(new Date().getFullYear() - 30))
        const entitlement = calculateAnnualLeaveEntitlement(birthDate, start)
        const previouslyUsed = emp.leaveCarryover || 0

        const empLeaves = allLeaves.filter(l => l.employeeId === emp.id && l.status === "approved")
        let usedDays = 0
        empLeaves.forEach(leave => {
            const ls = new Date(leave.startDate)
            const le = new Date(leave.endDate)
            usedDays += Math.ceil(Math.abs(le.getTime() - ls.getTime()) / (1000 * 60 * 60 * 24)) + 1
        })

        const totalUsed = previouslyUsed + usedDays
        const remaining = Math.max(0, entitlement - totalUsed)

        const leavePayGross = remaining * dailySalary
        const leavePayTax = leavePayGross * (INCOME_TAX_RATE + STAMP_TAX_RATE)
        const leavePayNet = leavePayGross - leavePayTax

        const totalNet = kidemNet + ihbarNet + leavePayNet

        return {
            id: emp.id,
            fullName: `${emp.firstName} ${emp.lastName}`,
            department: emp.department,
            startDate: emp.startDate,
            grossSalary: salary,
            serviceYears: years,
            serviceMonths: months,
            serviceDays: days,
            kidemGross, kidemNet,
            ihbarWeeks, ihbarGross, ihbarNet,
            leaveEntitlement: entitlement,
            leaveUsed: totalUsed,
            leaveRemaining: remaining,
            leavePayGross, leavePayNet,
            totalNet,
        }
    })

    return results.sort((a, b) => a.fullName.localeCompare(b.fullName, "tr"))
}
