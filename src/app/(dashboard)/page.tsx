import { OverviewChart } from "@/components/dashboard/overview-chart"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { DepartmentStats } from "@/components/dashboard/department-stats"
import { getDepartmentStats } from "@/actions/dashboard"
import { ISGAlerts } from "@/components/isg/isg-alerts"

export default async function DashboardPage() {
    const departmentData = await getDepartmentStats()

    return (
        <div className="flex-1 space-y-4 p-4 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Ana Sayfa</h2>
            </div>

            <ISGAlerts />

            <div className="space-y-4">
                <StatsCards />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <OverviewChart />
                    <DepartmentStats data={departmentData.map(d => ({ ...d, name: d.name || 'Belirtilmemiş' }))} />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <RecentActivity />
                </div>
            </div>
        </div>
    )
}
