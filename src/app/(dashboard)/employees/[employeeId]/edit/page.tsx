import { getBranches } from "@/actions/branches"
import { getEmployee, getUniquePositions } from "@/actions/employees"
import { getUniqueDepartments } from "@/actions/departments"
import { EmployeeForm } from "@/components/employees/employee-form"
import { notFound } from "next/navigation"

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic'

interface EditEmployeePageProps {
    params: Promise<{
        employeeId: string
    }>
}

export default async function EditEmployeePage({ params }: EditEmployeePageProps) {
    const { employeeId } = await params
    const employee = await getEmployee(parseInt(employeeId))
    const branches = await getBranches()
    const positions = await getUniquePositions()
    const departments = await getUniqueDepartments()

    if (!employee) {
        notFound()
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Personel Düzenle</h2>
                    <p className="text-muted-foreground">
                        Personel bilgilerini güncelleyin.
                    </p>
                </div>
            </div>
            <EmployeeForm
                branches={branches}
                initialData={employee}
                existingPositions={positions}
                existingDepartments={departments}
            />
        </div>
    )
}
