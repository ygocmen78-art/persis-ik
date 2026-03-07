import { Suspense } from "react"
import { getEmployees } from "@/actions/employees"
import { getBranches } from "@/actions/branches"
import { getAttendance, getSundayPayRate } from "@/actions/attendance"
import { AttendanceGrid } from "@/components/attendance/attendance-grid"

export default async function AttendancePage() {
    const employees = await getEmployees()
    const branches = await getBranches()

    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    const attendanceData = await getAttendance(null, currentYear, currentMonth)
    const sundayPayRate = await getSundayPayRate()

    // Sadece aktif personel
    const activeEmployees = employees.filter((e: any) => e.status === "active")

    return (
        <div className="flex-1 flex flex-col space-y-4 p-8 pt-6 h-full overflow-hidden">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Puantaj</h2>
                    <p className="text-muted-foreground">
                        Aylık personel devam takibi ve pazar çalışma hesaplama
                    </p>
                </div>
            </div>
            <Suspense fallback={<div>Yükleniyor...</div>}>
                <AttendanceGrid
                    employees={activeEmployees}
                    branches={branches}
                    initialAttendance={attendanceData}
                    initialSundayPayRate={sundayPayRate}
                    initialMonth={currentMonth}
                    initialYear={currentYear}
                />
            </Suspense>
        </div>
    )
}
