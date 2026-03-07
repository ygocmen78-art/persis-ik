"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "sonner"
import { ChevronLeft, ChevronRight, Settings2, Download, Calendar } from "lucide-react"
import { setAttendanceStatus, setSundayPayRate, getAttendance, getAttendanceReport } from "@/actions/attendance"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

type AttendanceStatus = "present" | "annual_leave" | "sick_leave" | "sunday_work" | "sunday_leave_used" | "unpaid_leave" | "absent"

const STATUS_LABELS: Record<AttendanceStatus, string> = {
    present: "✓",
    annual_leave: "Yİ",
    sick_leave: "R",
    sunday_work: "PÇ",
    sunday_leave_used: "Pİ",
    unpaid_leave: "Ü",
    absent: "—",
}

const STATUS_FULL_LABELS: Record<AttendanceStatus, string> = {
    present: "Geldi",
    annual_leave: "Yıllık İzin",
    sick_leave: "Raporlu",
    sunday_work: "Pazar Çalışma",
    sunday_leave_used: "Pazar İzni Kullandı",
    unpaid_leave: "Ücretsiz İzin",
    absent: "Gelmedi",
}

const STATUS_COLORS: Record<AttendanceStatus, string> = {
    present: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700",
    annual_leave: "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700",
    sick_leave: "bg-red-500/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700",
    sunday_work: "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700",
    sunday_leave_used: "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700",
    unpaid_leave: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700",
    absent: "bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700",
}

const STATUS_CYCLE: AttendanceStatus[] = [
    "present", "annual_leave", "sick_leave", "sunday_work", "sunday_leave_used", "unpaid_leave", "absent"
]

const MONTH_NAMES = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
]

const DAY_NAMES = ["Pz", "Pt", "Sa", "Ça", "Pe", "Cu", "Ct"]

interface AttendanceGridProps {
    employees: any[]
    branches: any[]
    initialAttendance: any[]
    initialSundayPayRate: number
    initialMonth: number
    initialYear: number
}

export function AttendanceGrid({
    employees,
    branches,
    initialAttendance,
    initialSundayPayRate,
    initialMonth,
    initialYear,
}: AttendanceGridProps) {
    const router = useRouter()
    const [month, setMonth] = React.useState(initialMonth)
    const [year, setYear] = React.useState(initialYear)
    const [selectedBranch, setSelectedBranch] = React.useState<string>("all")
    const [sundayPayRate, setSundayPayRateState] = React.useState(initialSundayPayRate)
    const [showSettings, setShowSettings] = React.useState(false)
    const [tempPayRate, setTempPayRate] = React.useState(initialSundayPayRate.toString())
    const [attendanceMap, setAttendanceMap] = React.useState<Record<string, AttendanceStatus>>({})
    const [searchTerm, setSearchTerm] = React.useState("")

    // Attendance map'i oluştur
    React.useEffect(() => {
        const map: Record<string, AttendanceStatus> = {}
        initialAttendance.forEach((r: any) => {
            map[`${r.employeeId}-${r.date}`] = r.status as AttendanceStatus
        })
        setAttendanceMap(map)
    }, [initialAttendance])

    // Ay değişiminde veri yükle
    const loadData = React.useCallback(async () => {
        const data = await getAttendance(null, year, month)
        const map: Record<string, AttendanceStatus> = {}
        data.forEach((r: any) => {
            map[`${r.employeeId}-${r.date}`] = r.status as AttendanceStatus
        })
        setAttendanceMap(map)
    }, [year, month])

    React.useEffect(() => {
        loadData()
    }, [loadData])

    // Ayın gün sayısı ve günler
    const daysInMonth = new Date(year, month, 0).getDate()
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

    // Filtreli personeller
    const filteredEmployees = React.useMemo(() => {
        let result = employees
        if (selectedBranch && selectedBranch !== "all") {
            result = result.filter(e => e.sgkBranchId?.toString() === selectedBranch || e.branchId?.toString() === selectedBranch)
        }
        if (searchTerm) {
            const q = searchTerm.toLowerCase()
            result = result.filter(e =>
                `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
                e.tcNumber?.includes(q)
            )
        }
        return result
    }, [employees, selectedBranch, searchTerm])

    // Gün bilgisi
    const getDayInfo = (day: number) => {
        const date = new Date(year, month - 1, day)
        const dayOfWeek = date.getDay() // 0=Pazar
        return { dayOfWeek, isSunday: dayOfWeek === 0, dayName: DAY_NAMES[dayOfWeek] }
    }

    // Efektif durumu getir (Hafta içi boşlar "present" kabul edilir)
    const getEffectiveStatus = (employeeId: number, day: number): AttendanceStatus | null => {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const key = `${employeeId}-${dateStr}`
        const status = attendanceMap[key]

        if (status) return status

        // Kayıt yoksa ve gün pazar değilse varsayılan olarak "present" (Geldi) döndür
        const info = getDayInfo(day)
        if (!info.isSunday) {
            return "present"
        }

        return null
    }

    // Hücre tıklama
    const handleCellClick = async (employeeId: number, day: number) => {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const key = `${employeeId}-${dateStr}`
        const currentSavedStatus = attendanceMap[key] // Veritabanındaki gerçek kayıt
        const effectiveStatus = getEffectiveStatus(employeeId, day)

        let nextStatus: AttendanceStatus | null

        if (!effectiveStatus) {
            // Tamamen boş (Pazar) -> Döngünün başı
            nextStatus = STATUS_CYCLE[0]
        } else {
            // Mevcut efektif durumun bir sonrakini bul
            const currentIndex = STATUS_CYCLE.indexOf(effectiveStatus)
            if (currentIndex === STATUS_CYCLE.length - 1) {
                // Döngü sonu, ancak hafta içiyse "boş" kalamayacağı için (otomatik geldi oluyor),
                // döngü başı yapmak mantıklı olabilir veya sunucudan silinirken "present" görünmeye devam eder.
                // İsteğe bağlı olarak, null atayıp sunucudan silebiliriz.
                nextStatus = null
            } else {
                nextStatus = STATUS_CYCLE[currentIndex + 1]
            }
        }

        // Eğer nextStatus varsayılan durum ise ve kaydedilmesine gerek yoksa optimizasyon yapılabilir,
        // ancak kullanıcının "açıkça" bu duruma geçtiğini sisteme kaydetmesi daha güvencelidir.
        // O yüzden her tıklamada kaydediyoruz.

        // Optimistic update
        const newMap = { ...attendanceMap }
        if (nextStatus) {
            newMap[key] = nextStatus
        } else {
            delete newMap[key]
        }
        setAttendanceMap(newMap)

        // Server'a kaydet
        await setAttendanceStatus(employeeId, dateStr, nextStatus)
    }

    // Pazar ücreti kaydet
    const handleSavePayRate = async () => {
        const amount = parseFloat(tempPayRate)
        if (isNaN(amount) || amount < 0) {
            toast.error("Geçerli bir tutar giriniz")
            return
        }
        await setSundayPayRate(amount)
        setSundayPayRateState(amount)
        setShowSettings(false)
        toast.success("Pazar ücreti güncellendi")
    }

    // Ay navigasyonu
    const prevMonth = () => {
        if (month === 1) { setMonth(12); setYear(y => y - 1) }
        else setMonth(m => m - 1)
    }
    const nextMonth = () => {
        if (month === 12) { setMonth(1); setYear(y => y + 1) }
        else setMonth(m => m + 1)
    }

    // Kişi bazlı özet hesapla
    const getEmployeeSummary = (employeeId: number) => {
        let sundayWorked = 0
        let sundayLeaveUsed = 0
        let presentDays = 0
        let annualLeave = 0
        let sickLeave = 0
        let unpaidLeave = 0
        let absent = 0

        for (let d = 1; d <= daysInMonth; d++) {
            const effectiveStatus = getEffectiveStatus(employeeId, d)
            const status = effectiveStatus
            if (status === "present") presentDays++
            else if (status === "sunday_work") sundayWorked++
            else if (status === "sunday_leave_used") sundayLeaveUsed++
            else if (status === "annual_leave") annualLeave++
            else if (status === "sick_leave") sickLeave++
            else if (status === "unpaid_leave") unpaidLeave++
            else if (status === "absent") absent++
        }

        const netSundayPay = Math.max(0, sundayWorked - sundayLeaveUsed) * sundayPayRate

        return { sundayWorked, sundayLeaveUsed, netSundayPay, presentDays, annualLeave, sickLeave, unpaidLeave, absent }
    }

    // Excel Export
    const handleExport = () => {
        import("xlsx").then((xlsx) => {
            const exportData = filteredEmployees.map(emp => {
                const summary = getEmployeeSummary(emp.id)
                const row: Record<string, any> = {
                    "Ad Soyad": `${emp.firstName} ${emp.lastName}`,
                    "TC No": emp.tcNumber || "",
                    "Şube": emp.sgkBranchName || "",
                }

                // Her gün için sütun
                for (let d = 1; d <= daysInMonth; d++) {
                    const status = getEffectiveStatus(emp.id, d)
                    row[`${d}`] = status ? STATUS_LABELS[status] : ""
                }

                row["Geldi"] = summary.presentDays
                row["Yıllık İzin"] = summary.annualLeave
                row["Rapor"] = summary.sickLeave
                row["Pazar Çalışma"] = summary.sundayWorked
                row["Pazar İzni"] = summary.sundayLeaveUsed
                row["Net Pazar Ücreti"] = summary.netSundayPay

                return row
            })

            // İstenen sütun isimlerini sırasıyla belirt
            const header = [
                "Ad Soyad", "TC No", "Şube",
                ...days.map(d => d.toString()),
                "Geldi", "Yıllık İzin", "Rapor", "Pazar Çalışma", "Pazar İzni", "Net Pazar Ücreti"
            ]

            const worksheet = xlsx.utils.json_to_sheet(exportData, { header })
            const workbook = xlsx.utils.book_new()
            xlsx.utils.book_append_sheet(workbook, worksheet, `Puantaj ${MONTH_NAMES[month - 1]} ${year}`)
            xlsx.writeFile(workbook, `Puantaj_${MONTH_NAMES[month - 1]}_${year}.xlsx`)
            toast.success("Excel dosyası indirildi")
        })
    }

    return (
        <div className="flex flex-col h-[calc(100vh-180px)]">
            {/* Üst Kontrol Çubuğu */}
            <div className="flex-shrink-0 space-y-3 pb-4 border-b border-border/50">
                {/* Ay Navigasyonu */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="icon" onClick={prevMonth}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-teal-600" />
                            <h3 className="text-xl font-bold">
                                {MONTH_NAMES[month - 1]} {year}
                            </h3>
                        </div>
                        <Button variant="outline" size="icon" onClick={nextMonth}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-sm px-3 py-1">
                            Pazar Ücreti: {sundayPayRate.toLocaleString('tr-TR')} ₺
                        </Badge>
                        <Button variant="outline" size="icon" onClick={() => { setTempPayRate(sundayPayRate.toString()); setShowSettings(true) }}>
                            <Settings2 className="h-4 w-4" />
                        </Button>
                        <Button variant="excel" onClick={handleExport}>
                            <Download className="h-4 w-4 mr-2" /> Excel İndir
                        </Button>
                    </div>
                </div>

                {/* Filtreler */}
                <div className="flex items-center gap-3">
                    <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Tüm Şubeler" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tüm Şubeler</SelectItem>
                            {branches.map((b: any) => (
                                <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Input
                        placeholder="Personel ara..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="max-w-xs"
                    />
                    <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
                        {STATUS_CYCLE.map(s => (
                            <span key={s} className={cn("px-2 py-0.5 rounded border text-xs font-medium", STATUS_COLORS[s])}>
                                {STATUS_LABELS[s]} {STATUS_FULL_LABELS[s]}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-auto mt-2">
                <TooltipProvider delayDuration={200}>
                    <table className="w-full border-collapse text-sm min-w-max">
                        <thead className="sticky top-0 z-10" style={{ backgroundColor: 'var(--background)' }}>
                            <tr>
                                <th className="text-left py-2 px-3 font-semibold border-b border-r border-border min-w-[200px] sticky left-0 z-20" style={{ backgroundColor: 'var(--background)' }}>
                                    Personel
                                </th>
                                {days.map(day => {
                                    const info = getDayInfo(day)
                                    return (
                                        <th
                                            key={day}
                                            className={cn(
                                                "text-center py-1 px-1 border-b border-border min-w-[38px] text-xs",
                                                info.isSunday && "bg-red-50 dark:bg-red-950/30"
                                            )}
                                        >
                                            <div className={cn("font-medium", info.isSunday && "text-red-600 dark:text-red-400")}>
                                                {day}
                                            </div>
                                            <div className={cn("text-[10px] text-muted-foreground", info.isSunday && "text-red-500")}>
                                                {info.dayName}
                                            </div>
                                        </th>
                                    )
                                })}
                                <th className="text-center py-2 px-2 border-b border-l border-border min-w-[50px] text-xs font-semibold text-emerald-600">Geldi</th>
                                <th className="text-center py-2 px-2 border-b border-border min-w-[50px] text-xs font-semibold text-blue-600">PÇ</th>
                                <th className="text-center py-2 px-2 border-b border-border min-w-[50px] text-xs font-semibold text-orange-600">Pİ</th>
                                <th className="text-center py-2 px-2 border-b border-border min-w-[80px] text-xs font-semibold text-teal-600">Pazar ₺</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployees.map((emp, idx) => {
                                const summary = getEmployeeSummary(emp.id)
                                return (
                                    <tr key={emp.id} className={cn(
                                        "hover:bg-muted/50 transition-colors",
                                        idx % 2 === 0 && "bg-muted/20"
                                    )}>
                                        <td className="py-1.5 px-3 border-b border-r border-border font-medium sticky left-0 z-10" style={{ backgroundColor: 'var(--background)' }}>
                                            <div className="flex flex-col">
                                                <span className="text-sm">{emp.firstName} {emp.lastName}</span>
                                                <span className="text-[10px] text-muted-foreground">{emp.department || ""}</span>
                                            </div>
                                        </td>
                                        {days.map(day => {
                                            const status = getEffectiveStatus(emp.id, day)
                                            const info = getDayInfo(day)
                                            const tooltipText = `${day} ${MONTH_NAMES[month - 1]} - ${status ? STATUS_FULL_LABELS[status] : "Boş (tıkla)"}`

                                            // Tooltip Component'i yerine native title kullanıyoruz (Performans iyileştirmesi)
                                            return (
                                                <td
                                                    key={day}
                                                    className={cn(
                                                        "text-center py-1 px-0.5 border-b border-border cursor-pointer select-none transition-all",
                                                        info.isSunday && !status && "bg-red-50/50 dark:bg-red-950/20",
                                                    )}
                                                    onClick={() => handleCellClick(emp.id, day)}
                                                    title={tooltipText}
                                                >
                                                    <div className={cn(
                                                        "w-8 h-7 mx-auto rounded flex items-center justify-center text-xs font-bold transition-all",
                                                        status ? STATUS_COLORS[status] + " border" : "hover:bg-muted"
                                                    )}>
                                                        {status ? STATUS_LABELS[status] : ""}
                                                    </div>
                                                </td>
                                            )
                                        })}
                                        {/* Özet sütunları */}
                                        <td className="text-center py-1 px-2 border-b border-l border-border font-semibold text-emerald-600">{summary.presentDays}</td>
                                        <td className="text-center py-1 px-2 border-b border-border font-semibold text-blue-600">{summary.sundayWorked}</td>
                                        <td className="text-center py-1 px-2 border-b border-border font-semibold text-orange-600">{summary.sundayLeaveUsed}</td>
                                        <td className="text-center py-1 px-2 border-b border-border font-bold text-teal-600">
                                            {summary.netSundayPay > 0 ? `${summary.netSundayPay.toLocaleString('tr-TR')} ₺` : "—"}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </TooltipProvider>
            </div>

            {/* Alt Toplam Çubuğu */}
            <div className="flex-shrink-0 pt-3 border-t border-border/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">{filteredEmployees.length} personel</span>
                    </div>
                    <div className="flex items-center gap-4">
                        {(() => {
                            let totalSundayPay = 0
                            let totalSundayWork = 0
                            let totalSundayLeave = 0
                            filteredEmployees.forEach(emp => {
                                const s = getEmployeeSummary(emp.id)
                                totalSundayPay += s.netSundayPay
                                totalSundayWork += s.sundayWorked
                                totalSundayLeave += s.sundayLeaveUsed
                            })
                            return (
                                <>
                                    <Badge variant="secondary" className="text-sm">
                                        Toplam Pazar Çalışma: <span className="font-bold ml-1">{totalSundayWork}</span>
                                    </Badge>
                                    <Badge variant="secondary" className="text-sm">
                                        Kullanılan Pazar İzni: <span className="font-bold ml-1">{totalSundayLeave}</span>
                                    </Badge>
                                    <Badge className="text-sm bg-teal-600 hover:bg-teal-700">
                                        Toplam Pazar Ücreti: <span className="font-bold ml-1">{totalSundayPay.toLocaleString('tr-TR')} ₺</span>
                                    </Badge>
                                </>
                            )
                        })()}
                    </div>
                </div>
            </div>

            {/* Pazar Ücreti Ayar Dialog */}
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Pazar Çalışma Ücreti Ayarı</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium">Günlük Pazar Ücreti (₺)</label>
                            <Input
                                type="number"
                                value={tempPayRate}
                                onChange={e => setTempPayRate(e.target.value)}
                                className="mt-1"
                                placeholder="500"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Her Pazar çalışması için ödenecek ücret. Pazar izni kullanılan günler düşülür.
                            </p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3 text-sm">
                            <h4 className="font-medium mb-2">Hesaplama Mantığı:</h4>
                            <p className="text-muted-foreground">
                                Net Pazar Ücreti = (Pazar Çalışma Sayısı − Kullanılan Pazar İzni) × Günlük Ücret
                            </p>
                            <p className="text-muted-foreground mt-1">
                                Örn: 4 Pazar çalıştı, 1 Pazar iznini kullandı → 3 × {tempPayRate} ₺ = {(3 * parseFloat(tempPayRate || "0")).toLocaleString('tr-TR')} ₺
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSettings(false)}>İptal</Button>
                        <Button onClick={handleSavePayRate}>Kaydet</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
