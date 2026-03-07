import { db } from "@/db"
import { employees } from "@/db/schema"
import { sql } from "drizzle-orm"
import { OverviewChartClient } from "./overview-chart-client"

async function getEmployeeCountsByMonth() {
    try {
        // Get employee counts by month for the current year
        const currentYear = new Date().getFullYear()

        const monthlyData = await db
            .select({
                month: sql<number>`CAST(substr(start_date, 6, 2) AS INTEGER)`,
                count: sql<number>`COUNT(*)`
            })
            .from(employees)
            .where(
                sql`substr(start_date, 1, 4) = ${currentYear.toString()} AND status = 'active'`
            )
            .groupBy(sql`substr(start_date, 6, 2)`)

        // Create array for all 12 months
        const monthNames = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağus", "Eyl", "Eki", "Kas", "Ara"]
        const chartData = monthNames.map((name, index) => {
            const monthData = monthlyData.find(m => m.month === index + 1)
            return {
                name,
                total: monthData?.count || 0
            }
        })

        return chartData
    } catch (error) {
        console.error("Error fetching employee chart data:", error)
        // Return empty data for all months
        return ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağus", "Eyl", "Eki", "Kas", "Ara"].map(name => ({
            name,
            total: 0
        }))
    }
}

export async function OverviewChart() {
    const data = await getEmployeeCountsByMonth()
    return <OverviewChartClient data={data} />
}
