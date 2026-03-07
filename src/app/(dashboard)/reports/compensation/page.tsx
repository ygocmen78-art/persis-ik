import { getCompensationReport } from "@/actions/compensation-report"
import { CompensationReportTable } from "@/components/reports/compensation-table"

export default async function CompensationReportPage() {
    const data = await getCompensationReport()

    // Summary calculations
    const totalKidemNet = data.reduce((s, r) => s + r.kidemNet, 0)
    const totalIhbarNet = data.reduce((s, r) => s + r.ihbarNet, 0)
    const totalLeaveNet = data.reduce((s, r) => s + r.leavePayNet, 0)
    const grandTotal = data.reduce((s, r) => s + r.totalNet, 0)

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Tazminat ve İzin Alacağı Raporu</h2>
                <p className="text-muted-foreground">
                    Tüm aktif personellerin kıdem tazminatı, ihbar tazminatı ve yıllık izin alacağı hesaplamaları
                </p>
            </div>

            <CompensationReportTable
                data={data}
                totalKidemNet={totalKidemNet}
                totalIhbarNet={totalIhbarNet}
                totalLeaveNet={totalLeaveNet}
                grandTotal={grandTotal}
            />
        </div>
    )
}
