"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Printer, Loader2 } from "lucide-react"
import { getLeaveDetails } from "@/actions/leaves"
import { LeavePdfDocument } from "./leave-pdf-document"
import { toast } from "sonner"

export function PdfDownloadButton({ leaveId }: { leaveId: number }) {
    const [loading, setLoading] = useState(false)

    const handlePrint = async () => {
        try {
            setLoading(true)

            // 1. Fetch exact data needed for this specific leave
            const data = await getLeaveDetails(leaveId)
            if (!data || !data.employee) {
                toast.error("İzin veya personel detayları bulunamadı.")
                return
            }

            // Dynamic import to avoid SSR issues with react-pdf
            const { pdf } = await import('@react-pdf/renderer')

            // 2. Generate PDF blob
            const blob = await pdf(<LeavePdfDocument data={data} />).toBlob()

            // 3. Create URL and open for printing
            const url = URL.createObjectURL(blob)

            // Open in new tab which typically handles PDFs with a print button automatically
            // or we can try to trigger print directly if browser allows
            const printWindow = window.open(url, '_blank')

            if (printWindow) {
                // Focus the new window
                printWindow.focus()
            } else {
                toast.error("Popup engelleyici yazdırma penceresini engelledi.")
            }

            toast.success("İzin formu hazırlandı.")
        } catch (error) {
            console.error("PDF oluşturma hatası:", error)
            toast.error("PDF oluşturulurken bir hata oluştu.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            disabled={loading}
            className="flex items-center gap-2"
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
            <span>Yazdır</span>
        </Button>
    )
}
