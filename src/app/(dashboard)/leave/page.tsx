import { LeaveRequestForm } from "@/components/leave/leave-request-form"
import { BulkLeaveForm } from "@/components/leave/bulk-leave-form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { getEmployees } from "@/actions/employees"
import { getLeaves, getAllEmployeeLeaveBalances } from "@/actions/leaves"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { LeaveCalendar } from "@/components/leave/leave-calendar"
import { PdfDownloadButton } from "@/components/leave/pdf-download-button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnnualLeaveReport } from "@/components/leave/annual-leave-report"

export default async function LeavePage() {
    // Fetch data in parallel
    const [employees, leaves, leaveBalances] = await Promise.all([
        getEmployees(),
        getLeaves(),
        getAllEmployeeLeaveBalances()
    ])

    // Filter properties for the form
    const employeeList = employees.map(e => ({
        id: e.id,
        firstName: e.firstName,
        lastName: e.lastName
    }))

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">İzin Yönetimi</h2>
                    <p className="text-muted-foreground">
                        İzin talepleri oluşturun ve raporları görüntüleyin.
                    </p>
                </div>
                <BulkLeaveForm employees={employeeList} />
            </div>

            <Tabs defaultValue="management" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="management">İzin Yönetimi & Takvim</TabsTrigger>
                    <TabsTrigger value="report">Yıllık İzin Raporu</TabsTrigger>
                </TabsList>

                <TabsContent value="management" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="col-span-4">
                            <CardHeader>
                                <CardTitle>Yeni İzin Talebi</CardTitle>
                                <CardDescription>
                                    Personel için yeni bir izin kaydı oluşturun.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <LeaveRequestForm employees={employeeList} />
                            </CardContent>
                        </Card>

                        <div className="col-span-3 space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>İzin Takvimi</CardTitle>
                                </CardHeader>
                                <CardContent className="flex justify-center">
                                    <LeaveCalendar leaves={leaves} />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Son İzinler</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {leaves.slice(0, 5).map((leave, i) => (
                                            <div key={i} className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium leading-none">
                                                        {leave.employeeName} {leave.employeeSurname}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {format(new Date(leave.startDate), "d MMM", { locale: tr })} - {format(new Date(leave.endDate), "d MMM yyyy", { locale: tr })}
                                                        {leave.daysCount && <span className="ml-2 font-semibold">({leave.daysCount} gün)</span>}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={leave.status === "approved" ? "default" : "secondary"}>
                                                        {leave.status === "approved" ? "Onaylı" : "Bekliyor"}
                                                    </Badge>
                                                    <PdfDownloadButton leaveId={leave.id} />
                                                </div>
                                            </div>
                                        ))}
                                        {leaves.length === 0 && (
                                            <p className="text-sm text-muted-foreground text-center">Henüz izin kaydı yok.</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="report">
                    <AnnualLeaveReport data={leaveBalances} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
