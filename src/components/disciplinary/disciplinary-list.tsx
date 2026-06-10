"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, Printer } from "lucide-react"
import { deleteDisciplinaryRecord } from "@/actions/disciplinary"
import { useRouter } from "next/navigation"

interface Record {
    id: number
    employeeFirstName: string | null
    employeeLastName: string | null
    violationType: string
    incidentDate: string
    description: string | null
    status: string | null
    createdAt: string | null
}

export function DisciplinaryList({ records }: { records: Record[] }) {
    const router = useRouter()
    const [deletingId, setDeletingId] = useState<number | null>(null)

    async function handleDelete(id: number) {
        if (!confirm("Bu tutanağı silmek istediğinizden emin misiniz?")) return
        setDeletingId(id)
        await deleteDisciplinaryRecord(id)
        setDeletingId(null)
        router.refresh()
    }

    function handlePrint(rec: Record) {
        const dateStr = rec.incidentDate ? new Date(rec.incidentDate).toLocaleDateString("tr-TR") : ""
        const today = new Date().toLocaleDateString("tr-TR")
        const fullName = `${rec.employeeFirstName || ""} ${rec.employeeLastName || ""}`.trim()
        const descContent = rec.description
            ? rec.description.replace(/\n/g, "<br/>")
            : "<br/>&nbsp;<br/>&nbsp;<br/>&nbsp;"

        const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8"/>
<title>Disiplin Tutanağı</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Times New Roman', serif; font-size: 12pt; color: #000; background: #fff; padding: 20mm 20mm; }
  .header { text-align: center; margin-bottom: 20px; border-bottom: 3px double #000; padding-bottom: 12px; }
  .header h1 { font-size: 18pt; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; }
  .header p { font-size: 10pt; margin-top: 4px; color: #555; }
  .section-title { font-size: 11pt; font-weight: bold; margin: 16px 0 6px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #000; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
  td { padding: 8px 12px; border: 1px solid #aaa; font-size: 11pt; vertical-align: top; }
  td.lbl { font-weight: bold; background: #f0f0f0; width: 220px; white-space: nowrap; }
  .notice-box { border: 2px solid #000; padding: 10px 14px; margin: 16px 0; font-size: 10pt; line-height: 1.6; background: #fffbe6; }
  .sign-row { display: flex; justify-content: space-between; margin-top: 50px; gap: 20px; }
  .sign-box { flex: 1; text-align: center; }
  .sign-line { border-top: 1px solid #000; margin-top: 50px; padding-top: 6px; font-size: 10pt; }
  .sign-name { font-weight: bold; font-size: 10pt; margin-top: 4px; }
  .footer { margin-top: 30px; font-size: 9pt; color: #777; text-align: center; border-top: 1px solid #ccc; padding-top: 8px; }
</style>
</head>
<body>
<div class="header">
  <h1>Disiplin Tutanağı</h1>
  <p>Tarih: ${today} &nbsp;|&nbsp; Tutanak No: DT-${rec.id}-${new Date().getFullYear()}</p>
</div>
<div class="section-title">Personel Bilgileri</div>
<table>
  <tr><td class="lbl">Ad Soyad</td><td>${fullName}</td></tr>
</table>
<div class="section-title">Olay Bilgileri</div>
<table>
  <tr><td class="lbl">İhlal Türü</td><td>${rec.violationType}</td></tr>
  <tr><td class="lbl">Olay Tarihi</td><td>${dateStr}</td></tr>
  <tr><td class="lbl">Olay Açıklaması</td><td>${descContent}</td></tr>
</table>
<div class="notice-box">
  <strong>Önemli Not:</strong> Bu tutanak, iş yerinde gerçekleşen disiplin ihlaline ilişkin resmi kayıt amacıyla düzenlenmiştir. İlgili personel, yukarıda belirtilen ihlal nedeniyle bilgilendirilmiştir.
</div>
<div class="sign-row">
  <div class="sign-box"><div class="sign-line"><div class="sign-name">İşveren / Yetkili</div><div>İmza</div></div></div>
  <div class="sign-box"><div class="sign-line"><div class="sign-name">${fullName}</div><div>(Personel İmzası)</div></div></div>
  <div class="sign-box"><div class="sign-line"><div class="sign-name">Tanık</div><div>İmza</div></div></div>
</div>
<div class="footer">Persis İK Yönetim Sistemi — Bu belge elektronik ortamda oluşturulmuştur.</div>
</body></html>`

        // Electron'da window.open yerine iframe ile yazdır
        const iframe = document.createElement("iframe")
        iframe.style.position = "fixed"
        iframe.style.top = "-9999px"
        iframe.style.left = "-9999px"
        iframe.style.width = "210mm"
        iframe.style.height = "297mm"
        document.body.appendChild(iframe)
        const doc = iframe.contentDocument || iframe.contentWindow?.document
        if (!doc) { document.body.removeChild(iframe); return }
        doc.open()
        doc.write(html)
        doc.close()
        setTimeout(() => {
            try {
                iframe.contentWindow?.focus()
                iframe.contentWindow?.print()
            } catch(e) {
                console.error("Print error:", e)
            }
            setTimeout(() => document.body.removeChild(iframe), 1000)
        }, 500)
    }

    if (records.length === 0) {
        return <p className="text-sm text-muted-foreground text-center py-8">Henüz disiplin tutanağı yok.</p>
    }

    return (
        <div className="space-y-3">
            {records.map(rec => (
                <div key={rec.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm">{rec.employeeFirstName} {rec.employeeLastName}</p>
                            <Badge variant="destructive" className="text-xs">Disiplin</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{rec.violationType}</p>
                        <p className="text-xs text-muted-foreground">
                            Tarih: {rec.incidentDate ? new Date(rec.incidentDate).toLocaleDateString("tr-TR") : "-"}
                        </p>
                        {rec.description && (
                            <p className="text-xs text-muted-foreground mt-1 italic">{rec.description}</p>
                        )}
                    </div>
                    <div className="flex gap-2 ml-4">
                        <Button size="sm" variant="outline" onClick={() => handlePrint(rec)}>
                            <Printer className="h-3 w-3 mr-1" /> Yazdır
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            disabled={deletingId === rec.id}
                            onClick={() => handleDelete(rec.id)}
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    )
}
