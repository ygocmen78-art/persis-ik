import { GarnishmentForm } from "@/components/garnishments/garnishment-form"
import { GarnishmentList } from "@/components/garnishments/garnishment-list"
import { GarnishmentFilters } from "@/components/garnishments/garnishment-filters"
import { getEmployees } from "@/actions/employees"
import { getGarnishments, getEmployeesWithGarnishments } from "@/actions/garnishments"
import { getBranches } from "@/actions/branches"
import { FixPrioritiesButton } from "@/components/garnishments/fix-priorities-button"

export default async function GarnishmentsPage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const resolvedParams = await searchParams;

    const filters = {
        branchId: resolvedParams.branch ? parseInt(resolvedParams.branch as string) : undefined,
        year: resolvedParams.year ? parseInt(resolvedParams.year as string) : undefined,
        month: resolvedParams.month ? parseInt(resolvedParams.month as string) : undefined,
        employeeId: resolvedParams.employee ? parseInt(resolvedParams.employee as string) : undefined,
    }

    const [employees, garnishments, branches, employeesWithGarnishments] = await Promise.all([
        getEmployees(),
        getGarnishments(filters),
        getBranches(),
        getEmployeesWithGarnishments()
    ])

    const employeeList = employees.map(e => ({
        id: e.id,
        firstName: e.firstName,
        lastName: e.lastName
    }))

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">İcra Takip</h2>
                    <p className="text-muted-foreground">
                        Personel icra dosyalarını ve kesintileri yönetin.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <FixPrioritiesButton />
                    <GarnishmentForm employees={employeeList} />
                </div>
            </div>

            <GarnishmentFilters branches={branches} employees={employeesWithGarnishments} />
            <GarnishmentList garnishments={garnishments} />
        </div>
    )
}
