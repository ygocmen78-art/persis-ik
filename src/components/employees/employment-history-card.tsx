import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { History } from "lucide-react"

interface HistoryRecord {
    id: number
    branchName: string | null
    department: string | null
    position: string | null
    startDate: string | null
    endDate: string | null
    terminationReason: string | null
    sgkExitCode: string | null
    salary: number | null
}

export function EmploymentHistoryCard({ records }: { records: HistoryRecord[] }) {
    if (records.length === 0) return null

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <History className="h-4 w-4" />
                    İstihdam Geçmişi
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {records.map((r, i) => (
                        <div key={r.id} className="border rounded-lg p-3 bg-muted/30 text-sm">
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold">{r.branchName || "—"}</span>
                                <Badge variant="outline" className="text-xs">
                                    {r.startDate ? new Date(r.startDate).toLocaleDateString("tr-TR") : "?"} — {r.endDate ? new Date(r.endDate).toLocaleDateString("tr-TR") : "?"}
                                </Badge>
                            </div>
                            <div className="text-muted-foreground text-xs space-y-0.5">
                                {r.department && <div>Departman: <span className="text-foreground">{r.department}</span></div>}
                                {r.position && <div>Pozisyon: <span className="text-foreground">{r.position}</span></div>}
                                {r.salary && <div>Maaş: <span className="text-foreground">{r.salary.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</span></div>}
                                {r.terminationReason && <div>Çıkış Nedeni: <span className="text-foreground">{r.terminationReason}</span></div>}
                                {r.sgkExitCode && <div>SGK Çıkış Kodu: <span className="text-foreground">{r.sgkExitCode}</span></div>}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
