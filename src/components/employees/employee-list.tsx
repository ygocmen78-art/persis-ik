"use client"

import * as React from "react"
import { DataTable } from "@/components/employees/data-table"
import { columns, Employee } from "@/components/employees/columns"
import { ExcelImportDialog } from "@/components/employees/excel-import-dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Search, X, Users, CalendarX2, FileWarning, UserRoundMinus, ChevronRight, Filter, Calendar, Briefcase, Building2, UserCog } from "lucide-react"
import Link from "next/link"

interface EmployeeListProps {
    data: any[]
    branches: any[]
}

export function EmployeeList({ data, branches }: EmployeeListProps) {
    const [selectedBranch, setSelectedBranch] = React.useState<string>("all")
    const [selectedDepartment, setSelectedDepartment] = React.useState<string>("all")
    const [selectedPosition, setSelectedPosition] = React.useState<string>("all")
    const [selectedStatus, setSelectedStatus] = React.useState<string>("all")
    const [searchTerm, setSearchTerm] = React.useState("")
    const [startDateFrom, setStartDateFrom] = React.useState<string>("")
    const [startDateTo, setStartDateTo] = React.useState<string>("")

    const departments = Array.from(new Set(data.map(e => e.department).filter(Boolean))).sort()
    const positions = Array.from(new Set(data.map(e => e.position).filter(Boolean))).sort()

    const stats = React.useMemo(() => {
        const total = data.length
        const active = data.filter(e => e.status === "active").length
        const onLeave = data.filter(e => e.status === "on_leave").length
        const terminated = data.filter(e => e.status === "passive" || e.status === "inactive").length
        const missingDocs = data.filter(e => e.status === "active" && (!e.ehliyetExpiry || !e.srcExpiry || !e.psikoteknikExpiry)).length
        return { total, active, onLeave, terminated, missingDocs }
    }, [data])

    const filteredData = React.useMemo(() => {
        let result = data

        if (selectedStatus !== "all") {
            result = result.filter(e => e.status === selectedStatus)
        }

        if (selectedBranch && selectedBranch !== "all") {
            result = result.filter(e => e.sgkBranchId?.toString() === selectedBranch || e.branchId?.toString() === selectedBranch)
        }

        if (selectedDepartment && selectedDepartment !== "all") {
            result = result.filter(e => e.department === selectedDepartment)
        }

        if (selectedPosition && selectedPosition !== "all") {
            result = result.filter(e => e.position === selectedPosition)
        }

        if (startDateFrom) {
            result = result.filter(e => e.startDate && new Date(e.startDate) >= new Date(startDateFrom))
        }
        if (startDateTo) {
            result = result.filter(e => e.startDate && new Date(e.startDate) <= new Date(startDateTo))
        }

        if (searchTerm) {
            const nQuery = searchTerm.toLocaleLowerCase('tr-TR').trim().replace(/\s+/g, ' ')
            result = result.filter(e => {
                const fullName = `${e.firstName || ""} ${e.lastName || ""}`.toLocaleLowerCase('tr-TR').trim().replace(/\s+/g, ' ')
                const tc = (e.tcNumber || "")
                const email = (e.email || "").toLocaleLowerCase('tr-TR')
                const dept = (e.department || "").toLocaleLowerCase('tr-TR')
                const pos = (e.position || "").toLocaleLowerCase('tr-TR')
                const phone = (e.phone || "")
                const branchName = (e.branchName || "").toLocaleLowerCase('tr-TR')
                const sgkBranchName = (e.sgkBranchName || "").toLocaleLowerCase('tr-TR')

                return fullName.includes(nQuery) || tc.includes(nQuery) || email.includes(nQuery) ||
                    dept.includes(nQuery) || pos.includes(nQuery) || phone.includes(nQuery) ||
                    branchName.includes(nQuery) || sgkBranchName.includes(nQuery)
            })
        }

        return result
    }, [data, selectedBranch, selectedDepartment, selectedPosition, selectedStatus, searchTerm, startDateFrom, startDateTo])

    const [filteredCount, setFilteredCount] = React.useState(0)

    React.useEffect(() => {
        setFilteredCount(filteredData.length)
    }, [filteredData])

    const formattedData: Employee[] = filteredData.map(e => ({
        id: e.id.toString(),
        name: `${e.firstName} ${e.lastName}`,
        email: e.email || "",
        department: e.department || "-",
        position: e.position || "-",
        status: e.status as "active" | "inactive" | "on_leave" | "passive",
        gender: e.gender as "male" | "female",
        birthDate: e.birthDate || undefined,
        startDate: e.startDate || undefined,
        terminationDate: e.terminationDate || undefined,
        avatarUrl: e.avatarUrl || undefined,
        branchName: e.branchName || "Şube Yok",
        sgkBranchName: e.sgkBranchName || "Şube Yok",
        salary: e.salary,
        tcNumber: e.tcNumber,
        phone: e.phone,
        iban: e.iban
    }))

    const handleExport = () => {
        import("xlsx").then((xlsx) => {
            const exportData = filteredData.map(e => ({
                "Ad Soyad": `${e.firstName} ${e.lastName}`,
                "TC No": e.tcNumber || "",
                "Telefon": e.phone || "",
                "Departman": e.department || "",
                "Pozisyon": e.position || "",
                "SGK Şube": e.sgkBranchName || "",
                "Maaş": e.salary || 0,
                "İşe Giriş": e.startDate ? new Date(e.startDate).toLocaleDateString('tr-TR') : "",
                "Çıkış Tarihi": e.terminationDate ? new Date(e.terminationDate).toLocaleDateString('tr-TR') : "",
                "IBAN": e.iban || "",
                "Durum": e.status === "active" ? "Aktif" : (e.status === "passive" ? "Pasif (Çıkış)" : "İzinli")
            }))

            const worksheet = xlsx.utils.json_to_sheet(exportData)
            const workbook = xlsx.utils.book_new()
            xlsx.utils.book_append_sheet(workbook, worksheet, "Personel Listesi")
            xlsx.writeFile(workbook, `Personel_Listesi_${new Date().toLocaleDateString('tr-TR')}.xlsx`)
        })
    }

    const clearFilters = () => {
        setSelectedBranch("all")
        setSelectedDepartment("all")
        setSelectedPosition("all")
        setSelectedStatus("all")
        setSearchTerm("")
        setStartDateFrom("")
        setStartDateTo("")
    }

    const activeFiltersCount = [
        selectedBranch !== "all",
        selectedDepartment !== "all",
        selectedPosition !== "all",
        selectedStatus !== "all",
        startDateFrom !== "" || startDateTo !== ""
    ].filter(Boolean).length

    const statCards = [
        { icon: Users, label: "Aktif Çalışan", value: stats.active, color: "bg-blue-500", light: "bg-blue-50", text: "text-blue-600", trend: `+${stats.active}` },
        { icon: CalendarX2, label: "İzinli", value: stats.onLeave, color: "bg-amber-500", light: "bg-amber-50", text: "text-amber-600" },
        { icon: FileWarning, label: "Evrak Eksik", value: stats.missingDocs, color: "bg-rose-500", light: "bg-rose-50", text: "text-rose-600" },
        { icon: UserRoundMinus, label: "İşten Ayrılan", value: stats.terminated, color: "bg-violet-500", light: "bg-violet-50", text: "text-violet-600" },
    ]

    const statusOptions = [
        { value: "all", label: "Tümü" },
        { value: "active", label: "Aktif" },
        { value: "on_leave", label: "İzinli" },
        { value: "passive", label: "Pasif" },
        { value: "inactive", label: "Çıkış" },
    ]

    return (
        <div className="space-y-3">
            {/* Başlık + aksiyon butonları */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Users className="h-6 w-6 text-primary" />
                        Personel Listesi
                    </h2>
                    <p className="text-sm text-slate-500">Tüm çalışanlarınızı buradan yönetebilirsiniz.</p>
                </div>
                <div className="flex items-center gap-2">
                    <ExcelImportDialog />
                    <Link href="/employees/new">
                        <Button size="sm">
                            <Plus className="mr-2 h-4 w-4" /> Yeni Personel
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Özet Kartları - Kompakt */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {statCards.map((card) => (
                    <Card key={card.label} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
                        if (card.label === "Aktif Çalışan") setSelectedStatus("active")
                        else if (card.label === "İzinli") setSelectedStatus("on_leave")
                        else if (card.label === "Evrak Eksik") { setSelectedStatus("active") }
                        else if (card.label === "İşten Ayrılan") setSelectedStatus("passive")
                    }}>
                        <CardContent className="p-3 flex items-center gap-3">
                            <div className={`${card.light} ${card.text} p-2.5 rounded-lg shrink-0`}>
                                <card.icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-slate-500 font-medium truncate">{card.label}</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-xl font-bold text-slate-800">{card.value}</p>
                                    {card.trend && <span className="text-xs text-emerald-600 font-medium">{card.trend}</span>}
                                </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-300 ml-auto shrink-0" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filtre Paneli */}
            <Card className="border-slate-200 shadow-sm bg-gradient-to-b from-blue-50/50 to-white">
                <CardContent className="p-3 space-y-3">
                    {/* Arama çubuğu */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Personel, TC, telefon, pozisyon veya departman ara..."
                            className="pl-9 pr-9 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus-visible:ring-primary/30 h-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Filtre satırı */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 items-end">
                        <FilterBox icon={UserCog} label="Durum" value={selectedStatus} onChange={setSelectedStatus}>
                            {statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </FilterBox>

                        <FilterBox icon={Building2} label="Şube" value={selectedBranch} onChange={setSelectedBranch}>
                            <SelectItem value="all">Tümü</SelectItem>
                            {branches.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
                        </FilterBox>

                        <FilterBox icon={Briefcase} label="Departman" value={selectedDepartment} onChange={setSelectedDepartment}>
                            <SelectItem value="all">Tümü</SelectItem>
                            {departments.map(d => <SelectItem key={d as string} value={d as string}>{d as string}</SelectItem>)}
                        </FilterBox>

                        <FilterBox icon={UserCog} label="Pozisyon" value={selectedPosition} onChange={setSelectedPosition}>
                            <SelectItem value="all">Tümü</SelectItem>
                            {positions.map(p => <SelectItem key={p as string} value={p as string}>{p as string}</SelectItem>)}
                        </FilterBox>

                        <div className="lg:col-span-2 space-y-1">
                            <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-amber-500" />
                                İşe Giriş Tarihi
                            </label>
                            <div className="flex items-center gap-2">
                                <Input type="date" value={startDateFrom} onChange={(e) => setStartDateFrom(e.target.value)} className="h-9 text-xs bg-white border-slate-200" />
                                <span className="text-slate-400 text-xs">-</span>
                                <Input type="date" value={startDateTo} onChange={(e) => setStartDateTo(e.target.value)} className="h-9 text-xs bg-white border-slate-200" />
                            </div>
                        </div>
                    </div>

                    {/* Alt bar */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 font-normal">
                                <Filter className="h-3 w-3 mr-1" />
                                {activeFiltersCount} aktif filtre
                            </Badge>
                            {activeFiltersCount > 0 && (
                                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 px-2 text-slate-500 hover:text-rose-600">
                                    <X className="h-3.5 w-3.5 mr-1" /> Temizle
                                </Button>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500"><span className="font-semibold text-slate-700">{filteredCount}</span> sonuç</span>
                            <Button variant="outline" size="sm" onClick={handleExport} className="h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-white">
                                Excel'e Aktar
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tablo */}
            <DataTable
                columns={columns}
                data={formattedData}
                onFilteredRowCountChange={setFilteredCount}
                defaultPageSize={15}
            />
        </div>
    )
}

function FilterBox({ icon: Icon, label, value, onChange, children }: { icon: any, label: string, value: string, onChange: (val: string) => void, children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-primary" />
                {label}
            </label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="h-9 bg-white border-slate-200 text-sm text-slate-700 focus:ring-primary/20">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {children}
                </SelectContent>
            </Select>
        </div>
    )
}
