import { Suspense } from "react"
import { getEmployees } from "@/actions/employees"
import { getBranches } from "@/actions/branches"
import { EmployeeList } from "@/components/employees/employee-list"

export default async function EmployeesPage() {
    const employeesData = await getEmployees()
    const branchesData = await getBranches()

    return (
        <div className="flex-1 flex flex-col space-y-4 p-8 pt-6 h-full overflow-hidden">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Personel</h2>
                    <p className="text-muted-foreground">
                        Çalışanlarınızı buradan yönetebilirsiniz.
                    </p>
                </div>
            </div>
            <Suspense fallback={<div>Yükleniyor...</div>}>
                <EmployeeList data={employeesData} branches={branchesData} />
            </Suspense>
        </div>
    )
}
