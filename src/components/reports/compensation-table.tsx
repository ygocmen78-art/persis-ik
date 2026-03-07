"use client"

import { useState, useMemo } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Download, Landmark, AlertTriangle, Calendar, Banknote } from "lucide-react"

interface CompensationRow {
    id: number
    fullName: string
    department: string | null
    startDate: string | null
    grossSalary: number
    serviceYears: number
    serviceMonths: number
    serviceDays: number
    kidemGross: number
    kidemNet: number
    ihbarWeeks: number
    ihbarGross: number
    ihbarNet: number
    leaveEntitlement: number
    leaveUsed: number
    leaveRemaining: number
    leavePayGross: number
    leavePayNet: number
    totalNet: number
}

interface Props {
    data: CompensationRow[]
    totalKidemNet: number
    totalIhbarNet: number
    totalLeaveNet: number
    grandTotal: number
}

const fmt = (val: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 2 }).format(val)

const fmtShort = (val: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val)

export function CompensationReportTable({ data, totalKidemNet, totalIhbarNet, totalLeaveNet, grandTotal }: Props) {
    const [search, setSearch] = useState("")
    const [sortField, setSortField] = useState<"name" | "kidem" | "ihbar" | "leave" | "total">("name")
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

    const filtered = useMemo(() => {
        let rows = data
        if (search.trim()) {
            const q = search.toLocaleLowerCase('tr-TR')
            rows = rows.filter(r =>
                r.fullName.toLocaleLowerCase('tr-TR').includes(q) ||
                (r.department && r.department.toLocaleLowerCase('tr-TR').includes(q))
            )
        }

        rows = [...rows].sort((a, b) => {
            let cmp = 0
            switch (sortField) {
                case "name": cmp = a.fullName.localeCompare(b.fullName, "tr"); break
                case "kidem": cmp = a.kidemNet - b.kidemNet; break
                case "ihbar": cmp = a.ihbarNet - b.ihbarNet; break
                case "leave": cmp = a.leavePayNet - b.leavePayNet; break
                case "total": cmp = a.totalNet - b.totalNet; break
            }
            return sortDir === "asc" ? cmp : -cmp
        })

        return rows
    }, [data, search, sortField, sortDir])

    function toggleSort(field: typeof sortField) {
        if (sortField === field) {
            setSortDir(prev => prev === "asc" ? "desc" : "asc")
        } else {
            setSortField(field)
            setSortDir("desc")
        }
    }

    function sortIndicator(field: typeof sortField) {
        if (sortField !== field) return ""
        return sortDir === "asc" ? " ↑" : " ↓"
    }

    function exportExcel() {
        import("xlsx").then((XLSX) => {
            const today = new Date().toLocaleDateString("tr-TR")

            // Title row
            const titleRow = [`TAZMİNAT VE İZİN ALACAĞI RAPORU — ${today}`]

            // Empty spacer
            const spacer: string[] = []

            // Headers
            const headers = [
                "Personel", "Departman", "İşe Giriş Tarihi", "Brüt Maaş (₺)",
                "Hizmet Süresi", "Kıdem Tazminatı Brüt (₺)", "Kıdem Tazminatı Net (₺)",
                "İhbar Süresi", "İhbar Tazminatı Brüt (₺)", "İhbar Tazminatı Net (₺)",
                "İzin Hak Ediş (Gün)", "Kullanılan İzin (Gün)", "Kalan İzin (Gün)",
                "İzin Alacağı Brüt (₺)", "İzin Alacağı Net (₺)",
                "TOPLAM NET (₺)"
            ]

            // Data rows
            const rows = filtered.map(r => [
                r.fullName,
                r.department || "-",
                r.startDate ? new Date(r.startDate).toLocaleDateString("tr-TR") : "-",
                r.grossSalary,
                `${r.serviceYears} yıl ${r.serviceMonths} ay ${r.serviceDays} gün`,
                r.kidemGross,
                r.kidemNet,
                `${r.ihbarWeeks} hafta`,
                r.ihbarGross,
                r.ihbarNet,
                r.leaveEntitlement,
                r.leaveUsed,
                r.leaveRemaining,
                r.leavePayGross,
                r.leavePayNet,
                r.totalNet,
            ])

            // Totals row
            const totalsRow = [
                `TOPLAM (${filtered.length} Personel)`, "", "", "",
                "",
                filtered.reduce((s, r) => s + r.kidemGross, 0),
                filtered.reduce((s, r) => s + r.kidemNet, 0),
                "",
                filtered.reduce((s, r) => s + r.ihbarGross, 0),
                filtered.reduce((s, r) => s + r.ihbarNet, 0),
                filtered.reduce((s, r) => s + r.leaveEntitlement, 0),
                filtered.reduce((s, r) => s + r.leaveUsed, 0),
                filtered.reduce((s, r) => s + r.leaveRemaining, 0),
                filtered.reduce((s, r) => s + r.leavePayGross, 0),
                filtered.reduce((s, r) => s + r.leavePayNet, 0),
                filtered.reduce((s, r) => s + r.totalNet, 0),
            ]

            // Build sheet data
            const sheetData = [titleRow, spacer, headers, ...rows, spacer, totalsRow]

            const ws = XLSX.utils.aoa_to_sheet(sheetData)

            // Column widths
            ws["!cols"] = [
                { wch: 28 }, // Personel
                { wch: 16 }, // Departman
                { wch: 14 }, // İşe Giriş
                { wch: 14 }, // Brüt Maaş
                { wch: 22 }, // Hizmet Süresi
                { wch: 20 }, // Kıdem Brüt
                { wch: 20 }, // Kıdem Net
                { wch: 12 }, // İhbar Süre
                { wch: 20 }, // İhbar Brüt
                { wch: 20 }, // İhbar Net
                { wch: 14 }, // İzin Hak
                { wch: 14 }, // Kullanılan
                { wch: 14 }, // Kalan
                { wch: 20 }, // İzin Brüt
                { wch: 20 }, // İzin Net
                { wch: 20 }, // Toplam
            ]

            // Merge title row across all columns
            ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 15 } }]

            // Format numeric cells as numbers (rows start at index 3 = row 4 in sheet)
            const numericCols = [3, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15]
            for (let rowIdx = 3; rowIdx < 3 + rows.length; rowIdx++) {
                for (const colIdx of numericCols) {
                    const cellRef = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx })
                    if (ws[cellRef] && typeof ws[cellRef].v === "number") {
                        ws[cellRef].t = "n"
                        if ([3, 5, 6, 8, 9, 13, 14, 15].includes(colIdx)) {
                            ws[cellRef].z = '#,##0.00 "₺"'
                        }
                    }
                }
            }

            // Format totals row
            const totalsRowIdx = 3 + rows.length + 1
            for (const colIdx of numericCols) {
                const cellRef = XLSX.utils.encode_cell({ r: totalsRowIdx, c: colIdx })
                if (ws[cellRef] && typeof ws[cellRef].v === "number") {
                    ws[cellRef].t = "n"
                    if ([3, 5, 6, 8, 9, 13, 14, 15].includes(colIdx)) {
                        ws[cellRef].z = '#,##0.00 "₺"'
                    }
                }
            }

            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, "Tazminat Raporu")

            XLSX.writeFile(wb, `Tazminat_Raporu_${new Date().toISOString().slice(0, 10)}.xlsx`)
        })
    }

    return (
        <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Landmark className="h-4 w-4 text-blue-500" />
                            Kıdem Tazminatı
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{fmtShort(totalKidemNet)}</div>
                        <p className="text-xs text-muted-foreground mt-1">{data.length} personel</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            İhbar Tazminatı
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{fmtShort(totalIhbarNet)}</div>
                        <p className="text-xs text-muted-foreground mt-1">{data.length} personel</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-green-500" />
                            İzin Alacağı
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{fmtShort(totalLeaveNet)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {data.reduce((s, r) => s + r.leaveRemaining, 0)} gün toplam
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 dark:bg-slate-800 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <Banknote className="h-4 w-4" />
                            Genel Toplam
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{fmtShort(grandTotal)}</div>
                        <p className="text-xs text-slate-400 mt-1">Net ödenecek</p>
                    </CardContent>
                </Card>
            </div>

            {/* Search + Export */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Personel veya departman ara..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Button variant="excel" onClick={exportExcel}>
                    <Download className="h-4 w-4 mr-2" /> Excel İndir
                </Button>
            </div>

            {/* Table */}
            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort("name")}>
                                Personel{sortIndicator("name")}
                            </TableHead>
                            <TableHead className="whitespace-nowrap">Hizmet Süresi</TableHead>
                            <TableHead className="whitespace-nowrap">Brüt Maaş</TableHead>
                            <TableHead className="cursor-pointer select-none whitespace-nowrap text-right" onClick={() => toggleSort("kidem")}>
                                Kıdem (Net){sortIndicator("kidem")}
                            </TableHead>
                            <TableHead className="cursor-pointer select-none whitespace-nowrap text-right" onClick={() => toggleSort("ihbar")}>
                                İhbar (Net){sortIndicator("ihbar")}
                            </TableHead>
                            <TableHead className="whitespace-nowrap text-center">İzin Kalan</TableHead>
                            <TableHead className="cursor-pointer select-none whitespace-nowrap text-right" onClick={() => toggleSort("leave")}>
                                İzin Alacağı (Net){sortIndicator("leave")}
                            </TableHead>
                            <TableHead className="cursor-pointer select-none whitespace-nowrap text-right font-bold" onClick={() => toggleSort("total")}>
                                Toplam (Net){sortIndicator("total")}
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map(row => (
                            <TableRow key={row.id}>
                                <TableCell>
                                    <div className="font-medium text-sm">{row.fullName}</div>
                                    {row.department && (
                                        <div className="text-xs text-muted-foreground">{row.department}</div>
                                    )}
                                </TableCell>
                                <TableCell className="whitespace-nowrap text-sm">
                                    {row.startDate ? (
                                        <span>{row.serviceYears}y {row.serviceMonths}a {row.serviceDays}g</span>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-sm whitespace-nowrap">
                                    {fmt(row.grossSalary)}
                                </TableCell>
                                <TableCell className="text-right text-sm whitespace-nowrap">
                                    {row.kidemNet > 0 ? (
                                        <span className="text-blue-600 dark:text-blue-400 font-medium">{fmt(row.kidemNet)}</span>
                                    ) : (
                                        <Badge variant="outline" className="text-xs">1 yıl altı</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right text-sm whitespace-nowrap">
                                    <span className="text-orange-600 dark:text-orange-400 font-medium">{fmt(row.ihbarNet)}</span>
                                    <div className="text-xs text-muted-foreground">{row.ihbarWeeks} hft</div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant={row.leaveRemaining > 0 ? "default" : "outline"} className="text-xs">
                                        {row.leaveRemaining} gün
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right text-sm whitespace-nowrap">
                                    {row.leavePayNet > 0 ? (
                                        <span className="text-green-600 dark:text-green-400 font-medium">{fmt(row.leavePayNet)}</span>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right text-sm whitespace-nowrap font-bold">
                                    {fmt(row.totalNet)}
                                </TableCell>
                            </TableRow>
                        ))}

                        {/* Totals row */}
                        <TableRow className="bg-muted/50 font-bold border-t-2">
                            <TableCell colSpan={3} className="text-right text-sm">
                                TOPLAM ({filtered.length} personel)
                            </TableCell>
                            <TableCell className="text-right text-sm whitespace-nowrap text-blue-600 dark:text-blue-400">
                                {fmt(filtered.reduce((s, r) => s + r.kidemNet, 0))}
                            </TableCell>
                            <TableCell className="text-right text-sm whitespace-nowrap text-orange-600 dark:text-orange-400">
                                {fmt(filtered.reduce((s, r) => s + r.ihbarNet, 0))}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                                {filtered.reduce((s, r) => s + r.leaveRemaining, 0)} gün
                            </TableCell>
                            <TableCell className="text-right text-sm whitespace-nowrap text-green-600 dark:text-green-400">
                                {fmt(filtered.reduce((s, r) => s + r.leavePayNet, 0))}
                            </TableCell>
                            <TableCell className="text-right text-sm whitespace-nowrap">
                                {fmt(filtered.reduce((s, r) => s + r.totalNet, 0))}
                            </TableCell>
                        </TableRow>

                        {filtered.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                    Sonuç bulunamadı.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <p className="text-xs text-muted-foreground text-right">
                * Hesaplamalar bilgi amaçlıdır. Net tutarlar vergi dilimine ve yasal kesintilere göre değişebilir.
                Kıdem tazminatı tavanı: 65.213,78 ₺ (2026-1 dönemi tahmini)
            </p>
        </div>
    )
}
