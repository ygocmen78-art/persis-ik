import { getEmployee, getUniquePositions } from "@/actions/employees"
import { getBranches } from "@/actions/branches"
import { getUniqueDepartments } from "@/actions/departments"
import { EmployeeForm } from "@/components/employees/employee-form"
import { notFound } from "next/navigation"
import { getEmployeeLeaves } from "@/actions/leaves"
import { format, differenceInYears } from "date-fns"
import { tr } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Pencil, Mail, Phone, Briefcase, MapPin, Calendar, BadgeCheck, FileText, ShieldAlert, Coins, FileArchive, HeartPulse } from "lucide-react"
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
import { RehireDialog } from "@/components/employees/rehire-dialog"
import { EmploymentHistoryCard } from "@/components/employees/employment-history-card"
import { getEmploymentHistory } from "@/actions/employment-history"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export const dynamic = 'force-dynamic'

interface EmployeeDetailPageProps {
    params: Promise<{
        employeeId: string
    }>
}

export default async function EmployeeDetailPage({ params }: EmployeeDetailPageProps) {
    const { employeeId } = await params
    const [employee, branches, employeeLeaves, positions, employeeGarnishments, departments, employeeDocuments, documentCategories, employeeISGRecords, isgDocumentTypes, employmentHistoryRecords] = await Promise.all([
        getEmployee(parseInt(employeeId)),
        getBranches(),
        getEmployeeLeaves(parseInt(employeeId)),
        getUniquePositions(),
        (await import("@/actions/garnishments")).GetEmployeeGarnishments(parseInt(employeeId)),
        getUniqueDepartments(),
        getEmployeeDocuments(parseInt(employeeId)),
        getDocumentCategories(),
        getISGRecords(parseInt(employeeId)),
        getISGDocumentTypes(),
        getEmploymentHistory(parseInt(employeeId))
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

    const fullName = `${employee.firstName} ${employee.lastName}`
    const age = employee.birthDate ? differenceInYears(new Date(), new Date(employee.birthDate)) : null
    const initials = fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)

    const isActive = employee.status === "active"
    const isPassive = employee.status === "passive"

    const tabItems = [
        { value: "overview", label: "Genel Bakış", icon: Briefcase },
        { value: "profile", label: "Özlük Bilgileri", icon: FileText },
        { value: "job", label: "İş Bilgileri", icon: BadgeCheck },
        { value: "leaves", label: "İzinler", icon: Calendar },
        { value: "garnishments", label: "İcralar", icon: ShieldAlert },
        { value: "severance", label: "Tazminat", icon: Coins },
        { value: "documents", label: "Evraklar", icon: FileArchive },
        { value: "isg", label: "İSG", icon: HeartPulse },
    ]

    return (
        <div className="flex-1 space-y-5 p-6 pt-5 overflow-y-auto">
            {/* Üst başlık ve özet kart */}
            <div className="flex flex-col lg:flex-row gap-5">
                <Card className="flex-1 border-slate-200 shadow-sm">
                    <CardContent className="p-5">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <Link href="/employees">
                                <Button variant="outline" size="icon-sm" className="border-slate-200 text-slate-600 hover:bg-slate-50">
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            </Link>
                            <Avatar className="h-16 w-16 border-2 border-white shadow-md">
                                <AvatarImage src={employee.avatarUrl || undefined} alt={fullName} />
                                <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <h1 className="text-xl font-bold text-slate-800">{fullName}</h1>
                                    {isActive && <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">Aktif</Badge>}
                                    {isPassive && <Badge variant="destructive">Pasif</Badge>}
                                    {employee.status === "on_leave" && <Badge className="bg-amber-50 text-amber-700 border-amber-200">İzinli</Badge>}
                                </div>
                                <p className="text-sm text-slate-500">
                                    {employee.position || "Pozisyon belirtilmemiş"} · {employee.department || "Departman yok"}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <Link href={`/employees/${employee.id}/edit`}>
                                    <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 hover:bg-slate-50">
                                        <Pencil className="mr-2 h-4 w-4" /> Düzenle
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <Separator className="my-4" />

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <InfoItem icon={Calendar} label="İşe Giriş" value={employee.startDate ? format(new Date(employee.startDate), "dd.MM.yyyy") : "-"} />
                            <InfoItem icon={MapPin} label="Şube" value={employee.sgkBranchName || employee.branchName || "-"} />
                            <InfoItem icon={Briefcase} label="Departman" value={employee.department || "-"} />
                            <InfoItem icon={Calendar} label="Kalan İzin" value={`${availableAnnualLeave} gün`} valueClassName={availableAnnualLeave < 3 ? "text-rose-600" : "text-emerald-600"} />
                        </div>
                    </CardContent>
                </Card>

                {/* Hızlı İşlemler / Küçük Yan Kart */}
                <Card className="lg:w-80 border-slate-200 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-slate-700">Hızlı Bilgiler</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <QuickInfo icon={Mail} label="E-posta" value={employee.email || "-"} />
                        <QuickInfo icon={Phone} label="Telefon" value={employee.phone || "-"} />
                        <QuickInfo icon={FileText} label="TC Kimlik No" value={employee.tcNumber || "-"} />
                        <QuickInfo icon={Calendar} label="Doğum Tarihi" value={employee.birthDate ? `${format(new Date(employee.birthDate), "dd.MM.yyyy")} ${age ? `(${age} yaş)` : ""}` : "-"} />
                    </CardContent>
                </Card>
            </div>

            {isPassive && (
                <Card className="border-rose-200 bg-rose-50/50 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <Badge variant="destructive">İşten Çıkarıldı</Badge>
                                <span className="text-sm font-medium text-rose-800">
                                    {employee.terminationDate && format(new Date(employee.terminationDate), "dd.MM.yyyy")}
                                </span>
                                <span className="text-sm text-rose-700">— {employee.terminationReason || "Neden belirtilmemiş"}</span>
                            </div>
                            <RehireDialog
                                employeeId={employee.id}
                                employeeName={fullName}
                                branches={branches}
                                existingDepartments={departments}
                            />
                        </div>
                    </CardContent>
                </Card>
            )}

            {employmentHistoryRecords.length > 0 && (
                <EmploymentHistoryCard records={employmentHistoryRecords} />
            )}

            <Tabs defaultValue="overview" className="space-y-4">
                <Card className="border-slate-200 shadow-sm">
                    <CardContent className="p-2">
                        <TabsList className="w-full flex flex-wrap h-auto bg-transparent gap-1 justify-start">
                            {tabItems.map((tab) => (
                                <TabsTrigger
                                    key={tab.value}
                                    value={tab.value}
                                    className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
                                >
                                    <tab.icon className="h-4 w-4 mr-2" />
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </CardContent>
                </Card>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-semibold text-slate-800">Kişisel Bilgiler</CardTitle>
                                <CardDescription>Personelin temel kimlik bilgileri</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <DetailRow label="Ad Soyad" value={fullName} />
                                <DetailRow label="TC Kimlik No" value={employee.tcNumber || "-"} />
                                <DetailRow label="Doğum Tarihi" value={employee.birthDate ? format(new Date(employee.birthDate), "dd.MM.yyyy") : "-"} />
                                <DetailRow label="Cinsiyet" value={employee.gender === "female" ? "Kadın" : "Erkek"} />
                                <DetailRow label="Telefon" value={employee.phone || "-"} />
                                <DetailRow label="E-posta" value={employee.email || "-"} />
                                <DetailRow label="IBAN" value={employee.iban || "-"} />
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-semibold text-slate-800">İş Bilgileri</CardTitle>
                                <CardDescription>Şube, departman ve maaş bilgileri</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <DetailRow label="Şube / Firma" value={employee.sgkBranchName || employee.branchName || "-"} />
                                <DetailRow label="Departman" value={employee.department || "-"} />
                                <DetailRow label="Pozisyon" value={employee.position || "-"} />
                                <DetailRow label="İşe Giriş Tarihi" value={employee.startDate ? format(new Date(employee.startDate), "dd.MM.yyyy") : "-"} />
                                <DetailRow label="Net Maaş" value={employee.salary ? new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(employee.salary) : "-"} />
                                <DetailRow label="Brüt Maaş" value={employee.grossSalary ? new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(employee.grossSalary) : "-"} />
                                <DetailRow label="İstihdam Türü" value={employee.employmentStatus || "Daimi"} />
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-semibold text-slate-800">İzin Durumu</CardTitle>
                                <CardDescription>Güncel yıllık izin bakiyesi</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <DetailRow label="Yıllık İzin Hakkı" value={`${availableAnnualLeave + (employeeLeaves.filter((l: any) => l.type === "annual" && l.status === "approved").reduce((acc: number, l: any) => acc + (l.daysCount || 0), 0))} gün`} />
                                <DetailRow label="Kullanılan" value={`${employeeLeaves.filter((l: any) => l.type === "annual" && l.status === "approved").reduce((acc: number, l: any) => acc + (l.daysCount || 0), 0)} gün`} />
                                <DetailRow label="Kalan" value={`${availableAnnualLeave} gün`} valueClassName={availableAnnualLeave < 3 ? "text-rose-600 font-semibold" : "text-emerald-600 font-semibold"} />
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-semibold text-slate-800">Belgeler</CardTitle>
                                <CardDescription>Sürücü ve iş sağlığı belgeleri</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <DetailRow label="Ehliyet Sınıfı" value={employee.ehliyetClass || "-"} />
                                <DetailRow label="Ehliyet Bitiş" value={employee.ehliyetExpiry ? format(new Date(employee.ehliyetExpiry), "dd.MM.yyyy") : "-"} />
                                <DetailRow label="SRC Bitiş" value={employee.srcExpiry ? format(new Date(employee.srcExpiry), "dd.MM.yyyy") : "-"} />
                                <DetailRow label="Psikoteknik Bitiş" value={employee.psikoteknikExpiry ? format(new Date(employee.psikoteknikExpiry), "dd.MM.yyyy") : "-"} />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="profile" className="space-y-4">
                    <Card className="border-slate-200 shadow-sm max-w-4xl">
                        <CardHeader>
                            <CardTitle>Özlük Bilgileri</CardTitle>
                            <CardDescription>Personelin kimlik ve iletişim bilgilerini düzenleyin</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <EmployeeForm
                                branches={branches}
                                initialData={employee}
                                existingPositions={positions}
                                existingDepartments={departments}
                                activeTab="personal"
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="job" className="space-y-4">
                    <Card className="border-slate-200 shadow-sm max-w-4xl">
                        <CardHeader>
                            <CardTitle>İş Bilgileri</CardTitle>
                            <CardDescription>Şube, departman, maaş ve istihdam bilgilerini düzenleyin</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <EmployeeForm
                                branches={branches}
                                initialData={employee}
                                existingPositions={positions}
                                existingDepartments={departments}
                                activeTab="job"
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="leaves" className="space-y-4">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle>İzin Geçmişi</CardTitle>
                            <CardDescription>Personelin kullandığı izinler ve bakiye</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <LeaveHistory
                                employeeId={parseInt(employeeId)}
                                initialLeaves={employeeLeaves}
                                availableBalance={availableAnnualLeave}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="garnishments" className="space-y-4">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle>İcra Dosyaları</CardTitle>
                            <CardDescription>Bu personelin icra dosyaları ve kesintileri</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {employeeGarnishments.length > 0 ? (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {employeeGarnishments.map((garnishment: any) => (
                                        <Card key={garnishment.id} className="border-slate-200">
                                            <CardContent className="p-4 space-y-3">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="font-bold">Sıra {garnishment.priorityOrder}</Badge>
                                                            <span className="font-semibold text-slate-800">{garnishment.officeName}</span>
                                                        </div>
                                                        <p className="text-sm text-slate-500 mt-1">Dosya No: {garnishment.fileNumber}</p>
                                                    </div>
                                                    <Badge variant={garnishment.status === "active" ? "default" : "outline"}>
                                                        {garnishment.status === "active" ? "Aktif" : "Kapatıldı"}
                                                    </Badge>
                                                </div>
                                                <Separator />
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-slate-500">Toplam Borç:</span>
                                                        <p className="font-medium text-slate-700">{garnishment.totalAmount.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500">Kalan Borç:</span>
                                                        <p className="font-bold text-rose-600">{garnishment.remainingAmount.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</p>
                                                    </div>
                                                </div>
                                                {garnishment.iban && (
                                                    <p className="text-xs font-mono text-slate-500">IBAN: {garnishment.iban}</p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-slate-400 py-10">Bu personel için icra kaydı bulunmuyor.</p>
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
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle>İSG Evrakları</CardTitle>
                            <CardDescription>Personelin iş sağlığı ve güvenliği belgeleri</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <EmployeeISGHistory
                                employeeId={parseInt(employeeId)}
                                initialRecords={employeeISGRecords}
                                employees={[employee]}
                                documentTypes={isgDocumentTypes}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

function InfoItem({ icon: Icon, label, value, valueClassName }: { icon: any, label: string, value: string, valueClassName?: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-500">
                <Icon className="h-4 w-4" />
            </div>
            <div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className={`text-sm font-semibold text-slate-800 ${valueClassName || ""}`}>{value}</p>
            </div>
        </div>
    )
}

function QuickInfo({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <div className="flex items-center gap-3">
            <Icon className="h-4 w-4 text-slate-400 shrink-0" />
            <div className="min-w-0">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-sm font-medium text-slate-700 truncate">{value}</p>
            </div>
        </div>
    )
}

function DetailRow({ label, value, valueClassName }: { label: string, value: string, valueClassName?: string }) {
    return (
        <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
            <span className="text-sm text-slate-500">{label}</span>
            <span className={`text-sm font-medium text-slate-800 ${valueClassName || ""}`}>{value}</span>
        </div>
    )
}
