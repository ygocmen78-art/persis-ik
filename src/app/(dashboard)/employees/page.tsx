import { Suspense } from "react"
import { getEmployees } from "@/actions/employees"
import { getBranches } from "@/actions/branches"
import { EmployeeList } from "@/components/employees/employee-list"
import { LicenseAlerts } from "@/components/employees/license-alerts"
import { Card, CardContent } from "@/components/ui/card"

export default async function EmployeesPage() {
    const employeesData = await getEmployees()
    const branchesData = await getBranches()

    return (
        <div className="flex-1 flex flex-col space-y-4 p-6 pt-5 overflow-y-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Personel Listesi</h2>
                    <p className="text-sm text-slate-500">Tüm çalışanlarınızı buradan yönetebilirsiniz.</p>
                </div>
            </div>

            <LicenseAlerts />

            <Suspense fallback={
                <Card className="border-slate-200">
                    <CardContent className="p-10 text-center text-slate-500">Yükleniyor...</CardContent>
                </Card>
            }>
                <EmployeeList data={employeesData} branches={branchesData} />
            </Suspense>
        </div>
    )
}
