"use client"

import React, { useMemo, useRef } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Search, Download } from "lucide-react"
import { format } from "date-fns"
import * as XLSX from "xlsx"

type LeaveBalanceData = {
    id: number;
    fullName: string;
    department: string;
    startDate: string;
    entitlement: number;
    used: number;
    carryover: number;
    remaining: number;
}

interface AnnualLeaveReportProps {
    data: LeaveBalanceData[]
}

// Tamamen React'tan koparılmış saf Vanilla CSS Gizleme Motoru!
const handlePureDOMSearch = (value: string) => {
    const searchStr = value.toLocaleLowerCase('tr-TR').trim()
    const rows = document.querySelectorAll<HTMLTableRowElement>("tr.emp-data-row")
    let visibleCount = 0

    rows.forEach(row => {
        const key = row.getAttribute("data-search") || ""
        if (key.includes(searchStr)) {
            row.style.display = "" // Göster
            visibleCount++
        } else {
            row.style.display = "none" // Gizle
        }
    })

    // Sadece rakam metnini dom elemanı üzerinden değiştir (React State Tüketmez)
    const countEl = document.getElementById("search-result-count")
    if (countEl) {
        countEl.innerText = visibleCount.toString()
    }
}

export function AnnualLeaveReport({ data }: AnnualLeaveReportProps) {
    const searchTimeout = useRef<NodeJS.Timeout | null>(null)

    // Sadece bir kere mount anında arama stringini hazırla
    const preProcessedData = useMemo(() => {
        return data.map(item => ({
            ...item,
            searchKey: `${item.fullName} ${item.department}`.toLocaleLowerCase('tr-TR')
        }))
    }, [data])

    const handleExport = () => {
        // Excel indirme işlemi sırasında güncel filtre neyse manuel tespit et
        const inputEl = document.getElementById("emp-search") as HTMLInputElement | null
        const currentSearch = inputEl ? inputEl.value.toLocaleLowerCase('tr-TR').trim() : ""

        const filteredForExport = currentSearch
            ? preProcessedData.filter(e => e.searchKey.includes(currentSearch))
            : preProcessedData

        const exportData = filteredForExport.map(emp => ({
            "Personel Adı": emp.fullName,
            "Departman": emp.department,
            "İşe Giriş Tarihi": emp.startDate !== "-" ? format(new Date(emp.startDate), "dd.MM.yyyy") : "-",
            "Hak Edilen (Gün)": emp.entitlement,
            "Kullanılan (Gün)": emp.used,
            "Devreden (Gün)": emp.carryover,
            "Kalan (Gün)": emp.remaining
        }))

        const worksheet = XLSX.utils.json_to_sheet(exportData)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Yillik_Izinler")
        XLSX.writeFile(workbook, `Yillik_Izin_Raporu_${format(new Date(), "dd_MM_yyyy")}.xlsx`)
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Yıllık İzin Raporu</CardTitle>
                        <CardDescription>Tüm personellerin güncel yıllık izin hakediş ve kullanım durumları.</CardDescription>
                    </div>
                    <Button onClick={handleExport} variant="excel" className="gap-2">
                        <Download className="h-4 w-4" />
                        Excel'e Aktar
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center mb-4">
                    <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="emp-search"
                            defaultValue=""
                            placeholder="Personel veya Departman ara..."
                            className="pl-8"
                            onInput={(e) => {
                                const val = e.currentTarget.value
                                if (searchTimeout.current) clearTimeout(searchTimeout.current)
                                searchTimeout.current = setTimeout(() => {
                                    handlePureDOMSearch(val)
                                }, 300)
                            }}
                        />
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Toplam <strong id="search-result-count">{data.length}</strong> personel bulundu
                    </div>
                </div>

                <div className="rounded-md border h-[600px] overflow-y-auto">
                    <Table>
                        <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                            <TableRow>
                                <TableHead>Personel</TableHead>
                                <TableHead>Departman</TableHead>
                                <TableHead>İşe Giriş Tarihi</TableHead>
                                <TableHead className="text-center font-bold">Hak Edilen</TableHead>
                                <TableHead className="text-center text-orange-600 font-bold">Kullanılan</TableHead>
                                <TableHead className="text-center text-muted-foreground">Devreden</TableHead>
                                <TableHead className="text-center text-green-600 font-bold text-base">Kalan</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {preProcessedData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                        Eşleşen personel bulunamadı.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                preProcessedData.map((emp) => (
                                    <TableRow
                                        key={emp.id}
                                        className="emp-data-row"
                                        data-search={emp.searchKey}
                                    >
                                        <TableCell className="font-medium">{emp.fullName}</TableCell>
                                        <TableCell>{emp.department}</TableCell>
                                        <TableCell>
                                            {emp.startDate !== "-"
                                                ? format(new Date(emp.startDate), "dd.MM.yyyy")
                                                : "-"}
                                        </TableCell>
                                        <TableCell className="text-center font-medium bg-slate-50 dark:bg-slate-900/50">
                                            {emp.entitlement}
                                        </TableCell>
                                        <TableCell className="text-center font-medium text-orange-600">
                                            {emp.used}
                                        </TableCell>
                                        <TableCell className="text-center text-muted-foreground">
                                            {emp.carryover}
                                        </TableCell>
                                        <TableCell className="text-center font-bold text-green-600 text-base bg-green-50 dark:bg-green-950/20">
                                            {emp.remaining}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
