import { getEmployee, getUniquePositions } from "@/actions/employees"
import { getBranches } from "@/actions/branches"
import { getUniqueDepartments } from "@/actions/departments"
import { EmployeeForm } from "@/components/employees/employee-form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { notFound } from "next/navigation"
import { getEmployeeLeaves } from "@/actions/leaves"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SeveranceCalculator } from "@/components/employees/severance-calculator"
import { Separator } from "@/components/ui/separator"
import { getEmployeeDocuments } from "@/actions/documents"
import { getDocumentCategories } from "@/actions/document-categories"
import { DocumentList } from "@/components/employees/document-list"
import { LeaveHistory } from "@/components/leave/leave-history"
import { getISGRecords } from "@/actions/isg"
import { getDocumentTypes as getISGDocumentTypes } from "@/actions/isg-document-types"
import { EmployeeISGHistory } from "@/components/isg/employee-isg-history"

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic'

interface EmployeeDetailPageProps {
    params: Promise<{
        employeeId: string
    }>
}

export default async function EmployeeDetailPage({ params }: EmployeeDetailPageProps) {
    const { employeeId } = await params
    const [employee, branches, employeeLeaves, positions, employeeGarnishments, departments, employeeDocuments, documentCategories, employeeISGRecords, isgDocumentTypes] = await Promise.all([
        getEmployee(parseInt(employeeId)),
        getBranches(),
        getEmployeeLeaves(parseInt(employeeId)),
        getUniquePositions(),
        (await import("@/actions/garnishments")).GetEmployeeGarnishments(parseInt(employeeId)),
        getUniqueDepartments(),
        getEmployeeDocuments(parseInt(employeeId)),
        getDocumentCategories(),
        getISGRecords(parseInt(employeeId)),
        getISGDocumentTypes()
    ])

    let availableAnnualLeave = 0
    if (employee) {
        const { getEmployeeLeaveBalance } = await import("@/actions/leaves")
        const balance = await getEmployeeLeaveBalance(employee.id)
        availableAnnualLeave = balance.remaining
    }

    if (!employee) {
        notFound()
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/employees">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-3xl font-bold tracking-tight">Personel Detay</h2>
                        {employee.status === "passive" && <Badge variant="destructive">Pasif</Badge>}
                        {employee.status === "active" && <Badge className="bg-green-500 hover:bg-green-600">Aktif</Badge>}
                        <Badge variant="outline" className="border-blue-500 text-blue-600 font-bold">
                            Kalan İzin: {availableAnnualLeave} Gün
                        </Badge>
                    </div>
                    <p className="text-muted-foreground">
                        {employee.firstName} {employee.lastName}
                    </p>
                </div>
            </div>

            <Tabs defaultValue="profile" className="space-y-4">
                <TabsList>
                    <TabsTrigger
                        value="profile"
                        className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                    >
                        Profil & İzinler
                    </TabsTrigger>
                    <TabsTrigger
                        value="garnishments"
                        className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
                    >
                        İcralar
                    </TabsTrigger>
                    <TabsTrigger
                        value="severance"
                        className="data-[state=active]:bg-green-500 data-[state=active]:text-white"
                    >
                        Tazminat Hesaplama
                    </TabsTrigger>
                    <TabsTrigger
                        value="documents"
                        className="data-[state=active]:bg-purple-500 data-[state=active]:text-white"
                    >
                        Özlük Evrakları
                    </TabsTrigger>
                    <TabsTrigger
                        value="isg"
                        className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white"
                    >
                        İSG Evrakları
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-4">
                    {employee.status === "passive" && (
                        <Card className="border-red-200 bg-red-50/50">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="destructive">İşten Çıkarıldı</Badge>
                                        <CardTitle className="text-red-800">Çıkış Bilgileri</CardTitle>
                                    </div>
                                    <div className="text-sm font-medium text-red-700">
                                        {employee.terminationDate && format(new Date(employee.terminationDate), "d MMMM yyyy", { locale: tr })}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">SGK Çıkış Kodu</p>
                                        <p className="text-sm font-medium mt-1">{employee.sgkExitCode || "Bilinmiyor"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Çıkış Nedeni</p>
                                        <p className="text-sm mt-1">{employee.terminationReason || "Belirtilmedi"}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card className="col-span-1">
                            <CardHeader>
                                <CardTitle>Personel Bilgileri</CardTitle>
                                <CardDescription>Personel bilgilerini düzenleyin</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <EmployeeForm
                                    branches={branches}
                                    initialData={employee}
                                    existingPositions={positions}
                                    existingDepartments={departments}
                                />
                            </CardContent>
                        </Card>

                        <Card className="col-span-1">
                            <CardHeader>
                                <CardTitle>İzin Geçmişi</CardTitle>
                                <CardDescription>Personelin kullandığı izinler</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <LeaveHistory
                                    employeeId={parseInt(employeeId)}
                                    initialLeaves={employeeLeaves}
                                    availableBalance={availableAnnualLeave}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="garnishments" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>İcra Dosyaları</CardTitle>
                            <CardDescription>Bu personelin icra dosyaları ve kesintileri</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {employeeGarnishments.length > 0 ? (
                                <div className="space-y-4">
                                    {employeeGarnishments.map((garnishment) => (
                                        <div key={garnishment.id} className="border rounded-lg p-4 space-y-2">
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="font-bold">
                                                            Sıra {garnishment.priorityOrder}
                                                        </Badge>
                                                        <span className="font-semibold">{garnishment.officeName}</span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Dosya No: {garnishment.fileNumber}
                                                    </p>
                                                    {garnishment.notificationDate && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Teslim Tarihi: {format(new Date(garnishment.notificationDate), "dd MMMM yyyy", { locale: tr })}
                                                        </p>
                                                    )}
                                                </div>
                                                <Badge variant={garnishment.status === "active" ? "default" : "outline"}>
                                                    {garnishment.status === "active" ? "Aktif" : "Kapatıldı"}
                                                </Badge>
                                            </div>
                                            <Separator />
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-muted-foreground">Toplam Borç:</span>
                                                    <p className="font-medium">
                                                        {garnishment.totalAmount.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Kalan Borç:</span>
                                                    <p className="font-bold text-red-600">
                                                        {garnishment.remainingAmount.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                                                    </p>
                                                </div>
                                            </div>
                                            {garnishment.iban && (
                                                <p className="text-xs font-mono text-muted-foreground">
                                                    IBAN: {garnishment.iban}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-muted-foreground py-8">
                                    Bu personel için icra kaydı bulunmuyor.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="severance">
                    <SeveranceCalculator
                        startDate={employee.startDate || new Date().toISOString()}
                        terminationDate={employee.terminationDate}
                        grossSalary={employee.salary || 0}
                        unusedLeaveDays={availableAnnualLeave}
                    />
                </TabsContent>

                <TabsContent value="documents">
                    <DocumentList
                        employeeId={parseInt(employeeId)}
                        initialDocuments={employeeDocuments}
                        initialCategories={documentCategories}
                    />
                </TabsContent>

                <TabsContent value="isg">
                    <Card>
                        <CardHeader>
                            <CardTitle>İSG Evrakları</CardTitle>
                            <CardDescription>Personelin iş sağlığı ve güvenliği belgeleri</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <EmployeeISGHistory
                                employeeId={parseInt(employeeId)}
                                initialRecords={employeeISGRecords}
                                employees={[employee]} // For pre-selection in form
                                documentTypes={isgDocumentTypes}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
