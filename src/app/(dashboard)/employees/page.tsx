import { getEmployees } from "@/actions/employees"
import { getBranches } from "@/actions/branches"
import { EmployeeList } from "@/components/employees/employee-list"

export default async function EmployeesPage() {
    const [employeesData, branchesData] = await Promise.all([getEmployees(), getBranches()])

    return (
        <div className="flex-1 min-h-0 overflow-y-auto">
            <EmployeeList data={employeesData} branches={branchesData} />
        </div>
    )
}
