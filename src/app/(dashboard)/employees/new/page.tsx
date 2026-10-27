import { getUniquePositions } from "@/actions/employees"
import { getBranches } from "@/actions/branches"
import { getUniqueDepartments } from "@/actions/departments"
import { EmployeeForm } from "@/components/employees/employee-form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function NewEmployeePage() {
    const branches = await getBranches()
    const positions = await getUniquePositions()
    const departments = await getUniqueDepartments()

    return (
        <div className="flex-1 space-y-4 p-6 pt-5 overflow-y-auto">
            <div className="flex items-center gap-3">
                <Link href="/employees">
                    <Button variant="outline" size="icon-sm" className="border-slate-200 text-slate-600 hover:bg-slate-50">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Yeni Personel Ekle</h2>
                    <p className="text-sm text-slate-500">Şirketinize yeni bir çalışan ekleyin.</p>
                </div>
            </div>

            <Card className="border-slate-200 shadow-sm max-w-5xl">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-slate-800">Personel Bilgileri</CardTitle>
                    <CardDescription>Tüm alanları eksiksiz doldurunuz.</CardDescription>
                </CardHeader>
                <CardContent>
                    <EmployeeForm
                        branches={branches}
                        existingPositions={positions}
                        existingDepartments={departments}
                        activeTab="all"
                    />
                </CardContent>
            </Card>
        </div>
    )
}
