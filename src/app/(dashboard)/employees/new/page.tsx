import { getUniquePositions } from "@/actions/employees"
import { getBranches } from "@/actions/branches"
import { getUniqueDepartments } from "@/actions/departments"
import { EmployeeForm } from "@/components/employees/employee-form"

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic'

export default async function NewEmployeePage() {
    const branches = await getBranches() // This was imported from @/actions/branches in valid file
    const positions = await getUniquePositions()
    const departments = await getUniqueDepartments()

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Yeni Personel Ekle</h2>
                    <p className="text-muted-foreground">
                        Şirketinize yeni bir çalışan ekleyin.
                    </p>
                </div>
            </div>
            <EmployeeForm
                branches={branches}
                existingPositions={positions}
                existingDepartments={departments}
            />
        </div>
    )
}
