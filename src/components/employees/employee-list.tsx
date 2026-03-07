"use strict";
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
import { Plus } from "lucide-react"
import Link from "next/link"

interface EmployeeListProps {
    data: any[]
    branches: any[]
}

const DebouncedSearchInput = React.memo(({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)
    const [localValue, setLocalValue] = React.useState(value)

    return (
        <Input
            placeholder="Personel, TC, Departman veya Pozisyon ara..."
            className="max-w-sm bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
            value={localValue}
            onChange={(e) => {
                const val = e.target.value
                setLocalValue(val) // Local state update is fast, doesn't trigger table

                if (timeoutRef.current) clearTimeout(timeoutRef.current)
                timeoutRef.current = setTimeout(() => {
                    onChange(val) // Triggers parent heavy state update after 300ms
                }, 300)
            }}
        />
    )
})
DebouncedSearchInput.displayName = "DebouncedSearchInput"

export function EmployeeList({ data, branches }: EmployeeListProps) {
    const [selectedBranch, setSelectedBranch] = React.useState<string>("all")
    const [selectedDepartment, setSelectedDepartment] = React.useState<string>("all")
    const [showTerminated, setShowTerminated] = React.useState(false)
    const [searchTerm, setSearchTerm] = React.useState("")

    // Extract unique departments for filter
    const departments = Array.from(new Set(data.map(e => e.department).filter(Boolean)))

    const filteredData = React.useMemo(() => {
        let result = data

        // Toggle Terminated Filter
        if (showTerminated) {
            result = result.filter(e => e.status === "passive" || e.status === "inactive")
        } else {
            result = result.filter(e => e.status !== "passive" && e.status !== "inactive")
        }

        if (selectedBranch && selectedBranch !== "all") {
            result = result.filter(e => e.sgkBranchId?.toString() === selectedBranch || e.branchId?.toString() === selectedBranch)
        }

        if (selectedDepartment && selectedDepartment !== "all") {
            result = result.filter(e => e.department === selectedDepartment)
        }

        // Filter by Search Query (Name, TC, etc.) for Export consistency
        if (searchTerm) {
            const nQuery = searchTerm.toLocaleLowerCase('tr-TR').trim().replace(/\s+/g, ' ')
            result = result.filter(e => {
                const fullName = `${e.firstName || ""} ${e.lastName || ""}`.toLocaleLowerCase('tr-TR').trim().replace(/\s+/g, ' ')
                const tc = (e.tcNumber || "")
                const email = (e.email || "").toLocaleLowerCase('tr-TR')
                const dept = (e.department || "").toLocaleLowerCase('tr-TR')
                const pos = (e.position || "").toLocaleLowerCase('tr-TR')

                return fullName.includes(nQuery) ||
                    tc.includes(nQuery) ||
                    email.includes(nQuery) ||
                    dept.includes(nQuery) ||
                    pos.includes(nQuery)
            })
        }

        return result
    }, [data, selectedBranch, selectedDepartment, showTerminated, searchTerm])

    const [filteredCount, setFilteredCount] = React.useState(0)

    React.useEffect(() => {
        setFilteredCount(filteredData.length)
    }, [filteredData])

    // Map DB data to columns format
    const formattedData: Employee[] = filteredData.map(e => ({
        id: e.id.toString(),
        name: `${e.firstName} ${e.lastName}`,
        email: e.email || "",
        department: e.department || "-",
        position: e.position || "-",
        status: e.status as "active" | "inactive" | "on_leave",
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

    return (
        <div className="flex flex-col h-[calc(100vh-140px)]">
            {/* Fixed top section - filters */}
            <div className="flex-shrink-0 pb-3 border-b border-border/50">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto items-center">
                        <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                            <SelectTrigger className="w-[180px]">
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
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Departman Seçiniz" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tüm Departmanlar</SelectItem>
                                {departments.map(d => (
                                    <SelectItem key={d as string} value={d as string}>{d as string}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button
                            variant={showTerminated ? "destructive" : "outline"}
                            onClick={() => setShowTerminated(!showTerminated)}
                            className="gap-2"
                        >
                            {showTerminated ? "Aktif Personeli Göster" : "İşten Ayrılanları Göster"}
                        </Button>

                        <div className="ml-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20">
                            {filteredCount} Kişi
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="excel" onClick={handleExport}>
                            📊 Excel İndir
                        </Button>
                        <ExcelImportDialog />
                        <Link href="/employees/new">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Yeni Personel
                            </Button>
                        </Link>
                    </div>
                </div>
                <div className="flex items-center pt-3">
                    <DebouncedSearchInput
                        value={searchTerm}
                        onChange={(val) => setSearchTerm(val)}
                    />
                </div>
            </div>

            {/* Scrollable table section */}
            <div className="flex-1 overflow-y-auto mt-2">
                <DataTable
                    columns={columns}
                    data={formattedData}
                    onFilteredRowCountChange={setFilteredCount}
                />
            </div>
        </div>
    )
}
