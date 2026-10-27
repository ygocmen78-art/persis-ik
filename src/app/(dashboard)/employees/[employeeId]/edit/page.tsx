import { getBranches } from "@/actions/branches"
import { getEmployee, getUniquePositions } from "@/actions/employees"
import { getUniqueDepartments } from "@/actions/departments"
import { EmployeeForm } from "@/components/employees/employee-form"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

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
        <div className="flex-1 space-y-4 p-6 pt-5 overflow-y-auto">
            <div className="flex items-center gap-3">
                <Link href={`/employees/${employeeId}`}>
                    <Button variant="outline" size="icon-sm" className="border-slate-200 text-slate-600 hover:bg-slate-50">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Personel Düzenle</h2>
                    <p className="text-sm text-slate-500">Personel bilgilerini güncelleyin.</p>
                </div>
            </div>

            <Card className="border-slate-200 shadow-sm max-w-5xl">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-slate-800">Tüm Bilgiler</CardTitle>
                    <CardDescription>{employee.firstName} {employee.lastName} için tüm bilgileri düzenleyin.</CardDescription>
                </CardHeader>
                <CardContent>
                    <EmployeeForm
                        branches={branches}
                        initialData={employee}
                        existingPositions={positions}
                        existingDepartments={departments}
                        activeTab="all"
                    />
                </CardContent>
            </Card>
        </div>
    )
}
