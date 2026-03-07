"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { FileText, Download, Loader2, AlertCircle } from "lucide-react"
import { getGarnishmentResponseData } from "@/actions/garnishments"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useEffect } from "react"

interface GarnishmentResponseDialogProps {
    garnishmentId: number
    employeeName: string
}

export function GarnishmentResponseDialog({ garnishmentId, employeeName }: GarnishmentResponseDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [type, setType] = useState<"queue" | "deduction" | "termination">("deduction")
    const [responseData, setResponseData] = useState<any>(null)
    const [fetching, setFetching] = useState(false)

    useEffect(() => {
        if (open) {
            fetchData()
        } else {
            setResponseData(null)
        }
    }, [open])

    const fetchData = async () => {
        setFetching(true)
        try {
            const data = await getGarnishmentResponseData(garnishmentId)
            setResponseData(data)
        } catch (error) {
            console.error(error)
            toast.error("Veriler alınırken hata oluştu")
        } finally {
            setFetching(false)
        }
    }

    const handleGenerate = async () => {
        if (!responseData) {
            toast.error("Veri yüklenmedi")
            return
        }
        setLoading(true)
        try {
            const { garnishment, employee, companyName, priorGarnishments } = responseData
            const today = new Date().toLocaleDateString('tr-TR')

            // Template Placeholders Replacement
            let title = ""
            let content = ""

            // Common Header
            const header =
                `<div style="text-align: center; font-weight: bold; margin-bottom: 20px;">` +
                `T.C.<br>${garnishment.officeName.toUpperCase()} MÜDÜRLÜĞÜNE` +
                `</div>` +
                `<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">` +
                `<tr><td style="width: 150px;">Dosya No</td><td style="width: 20px;">:</td><td>${garnishment.fileNumber}</td></tr>` +
                `<tr><td>Konu</td><td>:</td><td>Maaş Haczi</td></tr>` +
                `<tr><td>Borçlu T.C. Kimlik No</td><td>:</td><td>${employee.tcNumber}</td></tr>` +
                `<tr><td>Borçlu Ad Soyad</td><td>:</td><td>${employee.firstName.toUpperCase()} ${employee.lastName.toUpperCase()}</td></tr>` +
                `</table>`;

            if (type === "deduction") {
                title = "Maaş Haczi Kesinti Başlangıcı"
                const salary = employee.salary ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(employee.salary) : "Belirtilmemiş"

                content = `${header}` +
                    `<p>Yukarıda numarası verilen dosya ile aleyhine icra takibine girişilmiş bulunan dosyanız borçlusu ${employee.firstName.toUpperCase()} ${employee.lastName.toUpperCase()}'nın maaş haczi için şirketimize müzekkere yazılmıştır.</p>` +
                    `<p>Borçlu şirketimizden ${salary} NET maaş almakta olup, talimatınız gereği olarak 1/4'ü maaşından kesilerek icra dosyasına gönderilmek üzere İcra Dairesinin banka hesabına yatırılacaktır.</p>` +
                    `<p>Bilgi edinilmesini arz ederiz. ${today}</p>` +
                    `<div style="margin-top: 40px; text-align: right; font-weight: bold;">${companyName}<br>(İmza)</div>`
            }
            else if (type === "queue") {
                title = "Maaş Haczi Sırada Olduğuna Dair"
                const salary = employee.salary ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(employee.salary) : "Belirtilmemiş"

                const priorFilesHtml = priorGarnishments.length > 0
                    ? `<ul style="list-style-type: none; padding-left: 40px;">${priorGarnishments.map((g: any) => `<li style="margin-bottom: 5px;">-${g.officeName.toUpperCase()} ${g.fileNumber} E. Sayılı,</li>`).join("")}</ul>`
                    : "Bulunmamaktadır"

                content = `${header}` +
                    `<p>Yukarıda numarası verilen dosya ile aleyhine icra takibine girişilmiş bulunan dosyanız borçlusu ${employee.firstName.toUpperCase()} ${employee.lastName.toUpperCase()}'nın maaş haczi için şirketimize müzekkere yazılmıştır.</p>` +
                    `<p>Borçlu şirketimizden ${salary} NET maaş almakta olup, tarafımıza daha önceden bildirilen aşağıdaki dosyalar gereği kesinti yapılmaktadır. Bu dosya borçları kapandıktan sonra sırasıyla dosyanıza kesinti yapılacaktır.</p>` +
                    priorFilesHtml +
                    `<p style="margin-top: 20px;">İİK 83.maddesi "Birden fazla haciz var ise sıraya konur. Sırada önce olan haczin kesintisi bitmedikçe sonraki haciz için kesintiye geçilmez" hükmüne amirdir. Bilgi edinilmesini arz ve talep ederiz. ${today}</p>` +
                    `<div style="margin-top: 40px; text-align: right; font-weight: bold;">${companyName}<br>(İmza)</div>`
            }
            else if (type === "termination") {
                title = "Personel İşten Ayrıldı"
                const termDate = employee.terminationDate ? new Date(employee.terminationDate).toLocaleDateString('tr-TR') : "Tarih Belirsiz"

                content = `${header}` +
                    `<p>Yukarıda numarası verilen dosya ile aleyhine icra takibine girişilmiş bulunan dosyanız borçlusu ${employee.firstName.toUpperCase()} ${employee.lastName.toUpperCase()} şirketimizden ${termDate} tarihinde işten ayrılmıştır.</p>` +
                    `<p>Bu doğrultuda gerekli işlemlerin yapılmasını saygılarımla arz ve talep ederim. ${today}</p>` +
                    `<div style="margin-top: 40px; text-align: right; font-weight: bold;">${companyName}<br>(İmza)</div>`
            }

            // Wrap in HTML for better Word compatibility
            const htmlContent = `
                <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                <head><meta charset='utf-8'><title>${title}</title>
                <style>
                    body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; }
                    p { margin-bottom: 10px; text-align: justify; }
                    table td { vertical-align: top; padding: 2px 0; }
                </style>
                </head>
                <body>
                ${content}
                </body>
                </html>
            `;

            const element = document.createElement("a");
            const file = new Blob(['\ufeff', htmlContent], { type: 'application/msword;charset=utf-8' });
            element.href = URL.createObjectURL(file);
            element.download = `${employee.firstName}_${employee.lastName}_Icra_Cevap_${type}.doc`;
            document.body.appendChild(element); // Required for this to work in FireFox
            element.click();

            toast.success("Dosya oluşturuldu")
            setOpen(false)
        } catch (error) {
            console.error(error)
            toast.error("Dosya oluşturulurken hata oluştu")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Cevap Yaz
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>İcra Cevabı Oluştur</DialogTitle>
                    <DialogDescription>
                        {employeeName} için UYAP uyumlu cevap yazısı taslağı oluşturun.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {fetching ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : responseData && !responseData.employee.salary && type !== "termination" ? (
                        <Alert variant="destructive" className="bg-destructive/10">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Maaş Bilgisi Eksik!</AlertTitle>
                            <AlertDescription>
                                Personel kartında <strong>net maaş bilgisi girilmemiş.</strong> Yazıda maaş alanı <strong>"Belirtilmemiş"</strong> olarak görünecektir.
                                Doğru bir yazı için lütfen önce personel kartından maaş bilgisini güncelleyin.
                            </AlertDescription>
                        </Alert>
                    ) : null}

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Cevap Türü</label>
                        <Select value={type} onValueChange={(val: any) => setType(val)} disabled={fetching}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="deduction">Kesinti Başlayacak (1/4)</SelectItem>
                                <SelectItem value="queue">Sırada (Önceki Dosyalar Var)</SelectItem>
                                <SelectItem value="termination">Personel İşten Ayrıldı</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleGenerate} disabled={loading || fetching || (!responseData && open)}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Download className="mr-2 h-4 w-4" />
                        Dosyayı İndir (.doc)
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
