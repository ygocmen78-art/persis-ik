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
import { Plus, Search, Filter, X, Users, CalendarX2, FileWarning, UserRoundCheck, Download } from "lucide-react"
import Link from "next/link"

interface EmployeeListProps {
    data: any[]
    branches: any[]
}

const DebouncedSearchInput = React.memo(({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)
    const [localValue, setLocalValue] = React.useState(value)

    return (
        <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
                placeholder="Ara..."
                className="pl-9 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus-visible:ring-primary/30"
                value={localValue}
                onChange={(e) => {
                    const val = e.target.value
                    setLocalValue(val)
                    if (timeoutRef.current) clearTimeout(timeoutRef.current)
                    timeoutRef.current = setTimeout(() => {
                        onChange(val)
                    }, 300)
                }}
            />
            {localValue && (
                <button
                    onClick={() => {
                        setLocalValue("")
                        onChange("")
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    )
})
DebouncedSearchInput.displayName = "DebouncedSearchInput"

export function EmployeeList({ data, branches }: EmployeeListProps) {
    const [selectedBranch, setSelectedBranch] = React.useState<string>("all")
    const [selectedDepartment, setSelectedDepartment] = React.useState<string>("all")
    const [selectedStatus, setSelectedStatus] = React.useState<string>("active")
    const [searchTerm, setSearchTerm] = React.useState("")

    const departments = Array.from(new Set(data.map(e => e.department).filter(Boolean)))

    const stats = React.useMemo(() => {
        const total = data.length
        const active = data.filter(e => e.status === "active").length
        const onLeave = data.filter(e => e.status === "on_leave").length
        const terminated = data.filter(e => e.status === "passive" || e.status === "inactive").length
        const missingDocs = data.filter(e => {
            return e.status === "active" && (!e.ehliyetExpiry || !e.srcExpiry || !e.psikoteknikExpiry)
        }).length
        return { total, active, onLeave, terminated, missingDocs }
    }, [data])

    const filteredData = React.useMemo(() => {
        let result = data

        if (selectedStatus === "active") {
            result = result.filter(e => e.status === "active")
        } else if (selectedStatus === "on_leave") {
            result = result.filter(e => e.status === "on_leave")
        } else if (selectedStatus === "terminated") {
            result = result.filter(e => e.status === "passive" || e.status === "inactive")
        }

        if (selectedBranch && selectedBranch !== "all") {
            result = result.filter(e => e.sgkBranchId?.toString() === selectedBranch || e.branchId?.toString() === selectedBranch)
        }

        if (selectedDepartment && selectedDepartment !== "all") {
            result = result.filter(e => e.department === selectedDepartment)
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

                return fullName.includes(nQuery) ||
                    tc.includes(nQuery) ||
                    email.includes(nQuery) ||
                    dept.includes(nQuery) ||
                    pos.includes(nQuery) ||
                    phone.includes(nQuery) ||
                    branchName.includes(nQuery) ||
                    sgkBranchName.includes(nQuery)
            })
        }

        return result
    }, [data, selectedBranch, selectedDepartment, selectedStatus, searchTerm])

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

    const statusTabs = [
        { key: "all", label: "Tüm Personel", count: stats.total, active: selectedStatus === "all" },
        { key: "active", label: "Aktif", count: stats.active, active: selectedStatus === "active" },
        { key: "on_leave", label: "İzinli", count: stats.onLeave, active: selectedStatus === "on_leave" },
        { key: "terminated", label: "İşten Ayrılan", count: stats.terminated, active: selectedStatus === "terminated" },
    ]

    const statCards = [
        { icon: Users, label: "Aktif Çalışan", value: stats.active, color: "text-blue-600", bg: "bg-blue-50" },
        { icon: CalendarX2, label: "İzinli", value: stats.onLeave, color: "text-amber-600", bg: "bg-amber-50" },
        { icon: FileWarning, label: "Evrak Eksik", value: stats.missingDocs, color: "text-rose-600", bg: "bg-rose-50" },
        { icon: UserRoundCheck, label: "İşten Ayrılan", value: stats.terminated, color: "text-slate-600", bg: "bg-slate-100" },
    ]

    return (
        <div className="space-y-5">
            {/* Özet Kartları */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card) => (
                    <Card key={card.label} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className={`${card.bg} ${card.color} p-3 rounded-xl`}>
                                <card.icon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                                <p className="text-2xl font-bold text-slate-800">{card.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Üst Araç Çubuğu */}
            <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-4 space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                            {statusTabs.map((tab) => (
                                <Button
                                    key={tab.key}
                                    variant={tab.active ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSelectedStatus(tab.key)}
                                    className={tab.active ? "" : "border-slate-200 text-slate-600 hover:bg-slate-50"}
                                >
                                    {tab.label}
                                    <Badge variant="secondary" className={`ml-2 ${tab.active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                                        {tab.count}
                                    </Badge>
                                </Button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handleExport} className="border-slate-200 text-slate-700 hover:bg-slate-50">
                                <Download className="mr-2 h-4 w-4" /> Excel İndir
                            </Button>
                            <ExcelImportDialog />
                            <Link href="/employees/new">
                                <Button size="sm">
                                    <Plus className="mr-2 h-4 w-4" /> Yeni Personel
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                            <Filter className="h-4 w-4" />
                            <span>Filtreler:</span>
                        </div>

                        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                                <SelectTrigger className="w-full sm:w-[180px] bg-white border-slate-200">
                                    <SelectValue placeholder="Şube Seçiniz" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tüm Şubeler</SelectItem>
                                    {branches.map(b => (
                                        <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                <SelectTrigger className="w-full sm:w-[180px] bg-white border-slate-200">
                                    <SelectValue placeholder="Departman Seçiniz" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tüm Departmanlar</SelectItem>
                                    {departments.map(d => (
                                        <SelectItem key={d as string} value={d as string}>{d as string}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <DebouncedSearchInput value={searchTerm} onChange={setSearchTerm} />

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSelectedBranch("all")
                                    setSelectedDepartment("all")
                                    setSelectedStatus("active")
                                    setSearchTerm("")
                                }}
                                className="text-slate-500 hover:text-slate-700"
                            >
                                <X className="mr-2 h-4 w-4" /> Temizle
                            </Button>
                        </div>

                        <div className="ml-auto text-sm text-slate-500">
                            <span className="font-semibold text-slate-700">{filteredCount}</span> sonuç listeleniyor
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tablo */}
            <DataTable
                columns={columns}
                data={formattedData}
                onFilteredRowCountChange={setFilteredCount}
            />
        </div>
    )
}
