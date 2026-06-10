import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getEmployees } from "@/actions/employees"
import { getDisciplinaryRecords } from "@/actions/disciplinary"
import { DisciplinaryForm } from "@/components/disciplinary/disciplinary-form"
import { DisciplinaryList } from "@/components/disciplinary/disciplinary-list"

export default async function DisciplinaryPage() {
    const [employees, records] = await Promise.all([
        getEmployees(),
        getDisciplinaryRecords(),
    ])

    const employeeList = employees.map(e => ({
        id: e.id,
        firstName: e.firstName,
        lastName: e.lastName,
    }))

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="mb-6">
                <h2 className="text-3xl font-bold tracking-tight">Disiplin Tutanakları</h2>
                <p className="text-muted-foreground">
                    Personel disiplin olaylarını kayıt altına alın ve tutanak oluşturun.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Yeni Tutanak</CardTitle>
                        <CardDescription>Disiplin olayını kayıt altına alın.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DisciplinaryForm employees={employeeList} />
                    </CardContent>
                </Card>

                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Tutanak Listesi</CardTitle>
                        <CardDescription>{records.length} kayıt bulundu.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DisciplinaryList records={records} />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
