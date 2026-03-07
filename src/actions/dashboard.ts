"use server"

import { db } from "@/db"
import { employees, leaves, expenses } from "@/db/schema"
import { count, eq, and, gte, lte, sql } from "drizzle-orm"
import { startOfWeek, endOfWeek } from "date-fns"

export async function getDashboardStats() {
    try {
        // Total active employees
        const totalEmployees = await db
            .select({ count: count() })
            .from(employees)
            .where(eq(employees.status, "active"))

        // Employees currently on leave (today's date falls within leave period)
        const today = new Date()
        const todayStr = today.toISOString().split('T')[0] // YYYY-MM-DD

        const onLeaveCount = await db
            .select({ count: count() })
            .from(leaves)
            .where(
                and(
                    eq(leaves.status, "approved"),
                    lte(leaves.startDate, todayStr),
                    gte(leaves.endDate, todayStr)
                )
            )

        // Pending approvals (leaves only - expenses don't have status)
        const pendingLeaves = await db
            .select({ count: count() })
            .from(leaves)
            .where(eq(leaves.status, "pending"))

        // For expenses, we'll count all recent ones (last 30 days) as a proxy
        // since there's no status field in the schema
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

        const recentExpenses = await db
            .select({ count: count() })
            .from(expenses)
            .where(gte(expenses.date, thirtyDaysAgoStr))

        // New hires this week (using startDate instead of hireDate)
        const weekStart = startOfWeek(today, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 })
        const weekStartStr = weekStart.toISOString().split('T')[0]
        const weekEndStr = weekEnd.toISOString().split('T')[0]

        const newHiresThisWeek = await db
            .select({ count: count() })
            .from(employees)
            .where(
                and(
                    eq(employees.status, "active"),
                    gte(employees.startDate, weekStartStr),
                    lte(employees.startDate, weekEndStr)
                )
            )

        return {
            totalEmployees: totalEmployees[0]?.count || 0,
            onLeave: onLeaveCount[0]?.count || 0,
            pendingApprovals: {
                total: (pendingLeaves[0]?.count || 0),
                leaves: pendingLeaves[0]?.count || 0,
                expenses: 0, // Expenses don't have status in current schema
            },
            newHires: newHiresThisWeek[0]?.count || 0,
        }
    } catch (error) {
        console.error("Error fetching dashboard stats:", error)
        return {
            totalEmployees: 0,
            onLeave: 0,
            pendingApprovals: { total: 0, leaves: 0, expenses: 0 },
            newHires: 0,
        }
    }
}

export async function getDepartmentStats() {
    try {
        const departmentStats = await db
            .select({
                department: employees.department,
                count: count()
            })
            .from(employees)
            .where(eq(employees.status, "active"))
            .groupBy(employees.department)
            .orderBy(employees.department)

        return departmentStats.map(stat => ({
            name: stat.department,
            value: stat.count
        }))
    } catch (error) {
        console.error("Error fetching department stats:", error)
        return []
    }
}
