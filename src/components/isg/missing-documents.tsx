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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { AlertTriangle, ChevronDown, ChevronRight, Search, FileWarning, Users, FileX } from "lucide-react"

interface MissingDoc {
    employeeId: number
    employeeName: string
    documentTypeId: number
    documentTypeName: string
}

interface MissingDocumentsProps {
    missingDocs: MissingDoc[]
}

interface GroupedEmployee {
    employeeId: number
    employeeName: string
    missingTypes: { documentTypeId: number; documentTypeName: string }[]
}

export function MissingDocuments({ missingDocs }: MissingDocumentsProps) {
    const [search, setSearch] = useState("")
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
    const [showAll, setShowAll] = useState(false)

    // Group missing docs by employee
    const grouped: GroupedEmployee[] = useMemo(() => {
        const map = new Map<number, GroupedEmployee>()

        for (const doc of missingDocs) {
            if (!map.has(doc.employeeId)) {
                map.set(doc.employeeId, {
                    employeeId: doc.employeeId,
                    employeeName: doc.employeeName,
                    missingTypes: [],
                })
            }
            map.get(doc.employeeId)!.missingTypes.push({
                documentTypeId: doc.documentTypeId,
                documentTypeName: doc.documentTypeName,
            })
        }

        return Array.from(map.values()).sort((a, b) =>
            a.employeeName.localeCompare(b.employeeName, "tr")
        )
    }, [missingDocs])

    // Filter by search
    const filtered = useMemo(() => {
        if (!search.trim()) return grouped
        const q = search.toLocaleLowerCase('tr-TR')
        return grouped.filter(
            (emp) =>
                emp.employeeName.toLocaleLowerCase('tr-TR').includes(q) ||
                emp.missingTypes.some((t) =>
                    t.documentTypeName.toLocaleLowerCase('tr-TR').includes(q)
                )
        )
    }, [grouped, search])

    // Pagination
    const PAGE_SIZE = 20
    const displayed = showAll ? filtered : filtered.slice(0, PAGE_SIZE)
    const hasMore = filtered.length > PAGE_SIZE && !showAll

    function toggleExpand(employeeId: number) {
        setExpandedIds((prev) => {
            const next = new Set(prev)
            if (next.has(employeeId)) {
                next.delete(employeeId)
            } else {
                next.add(employeeId)
            }
            return next
        })
    }

    function expandAll() {
        setExpandedIds(new Set(filtered.map((e) => e.employeeId)))
    }

    function collapseAll() {
        setExpandedIds(new Set())
    }

    if (missingDocs.length === 0) return null

    // Get unique document types for summary
    const uniqueDocTypes = useMemo(() => {
        const types = new Map<number, string>()
        for (const doc of missingDocs) {
            types.set(doc.documentTypeId, doc.documentTypeName)
        }
        return Array.from(types.values())
    }, [missingDocs])

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileWarning className="h-5 w-5 text-orange-500" />
                        <div>
                            <CardTitle className="text-lg">Eksik Evraklar</CardTitle>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                <span className="font-semibold text-orange-500">{missingDocs.length}</span> adet eksik evrak —{" "}
                                <span className="font-semibold">{grouped.length}</span> personel
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={expandAll}>
                            Tümünü Aç
                        </Button>
                        <Button variant="ghost" size="sm" onClick={collapseAll}>
                            Tümünü Kapat
                        </Button>
                    </div>
                </div>

                {/* Summary badges for document types */}
                <div className="flex flex-wrap gap-2 mt-3">
                    {uniqueDocTypes.map((typeName) => {
                        const count = missingDocs.filter(
                            (d) => d.documentTypeName === typeName
                        ).length
                        return (
                            <Badge
                                key={typeName}
                                variant="outline"
                                className="text-xs"
                            >
                                {typeName}: <span className="ml-1 font-bold text-orange-500">{count}</span> eksik
                            </Badge>
                        )
                    })}
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                {/* Search */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Personel veya evrak türü ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {/* Employee list */}
                <div className="border rounded-md divide-y">
                    {displayed.map((emp) => {
                        const isExpanded = expandedIds.has(emp.employeeId)
                        const allMissing = emp.missingTypes.length

                        return (
                            <Collapsible
                                key={emp.employeeId}
                                open={isExpanded}
                                onOpenChange={() => toggleExpand(emp.employeeId)}
                            >
                                <CollapsibleTrigger asChild>
                                    <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            {isExpanded ? (
                                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                            )}
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium text-sm">
                                                {emp.employeeName}
                                            </span>
                                        </div>
                                        <Badge
                                            variant={allMissing >= 4 ? "destructive" : "secondary"}
                                            className="text-xs"
                                        >
                                            <FileX className="h-3 w-3 mr-1" />
                                            {allMissing} eksik evrak
                                        </Badge>
                                    </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <div className="px-3 pb-3 pl-10">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="h-8 text-xs">Eksik Evrak Türü</TableHead>
                                                    <TableHead className="h-8 text-xs w-[100px]">Durum</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {emp.missingTypes.map((mt) => (
                                                    <TableRow key={mt.documentTypeId}>
                                                        <TableCell className="text-sm py-2">
                                                            {mt.documentTypeName}
                                                        </TableCell>
                                                        <TableCell className="py-2">
                                                            <Badge variant="destructive" className="text-xs flex w-fit items-center gap-1">
                                                                <AlertTriangle className="h-3 w-3" /> Eksik
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        )
                    })}

                    {filtered.length === 0 && (
                        <div className="p-6 text-center text-muted-foreground text-sm">
                            Aramayla eşleşen personel bulunamadı.
                        </div>
                    )}
                </div>

                {/* Show more */}
                {hasMore && (
                    <div className="flex justify-center mt-4">
                        <Button variant="outline" onClick={() => setShowAll(true)}>
                            Tümünü Göster ({filtered.length - PAGE_SIZE} personel daha)
                        </Button>
                    </div>
                )}

                {showAll && filtered.length > PAGE_SIZE && (
                    <div className="flex justify-center mt-4">
                        <Button variant="ghost" size="sm" onClick={() => setShowAll(false)}>
                            Daha az göster
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
