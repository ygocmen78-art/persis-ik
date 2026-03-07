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
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { terminateEmployee } from "@/actions/employees" // Make sure this path is correct
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const SGK_CODES = [
    { code: "03", label: "03 - İstifa (Belirsiz süreli iş sözleşmesinin işçi tarafından feshi)" },
    { code: "04", label: "04 - Belirsiz süreli iş sözleşmesinin işveren tarafından haklı sebep bildirilmeden feshi" },
    { code: "05", label: "05 - Belirli süreli iş sözleşmesinin sona ermesi" },
    { code: "08", label: "08 - Emeklilik (Yaşlılık) veya toptan ödeme nedeniyle" },
    { code: "10", label: "10 - Ölüm" },
    { code: "12", label: "12 - Askerlik" },
    { code: "13", label: "13 - Kadın işçinin evlenmesi" },
    { code: "17", label: "17 - İşyerinin kapanması" },
    { code: "18", label: "18 - İşin sona ermesi" },
    { code: "22", label: "22 - Diğer nedenler" },
    { code: "23", label: "23 - İşçi tarafından zorunlu nedenle fesih" },
    { code: "24", label: "24 - İşçi tarafından sağlık nedeniyle fesih" },
    { code: "25", label: "25 - İşçi tarafından işverenin ahlak ve iyi niyet kurallarına aykırı davranışı nedeni ile fesih" },
    { code: "34", label: "34 - İşyerinin devri, işin veya işyerinin niteliğinin değişmesi" },
    { code: "46", label: "46 - İşçinin işverenin güvenini kötüye kullanması, hırsızlık yapması" },
    { code: "48", label: "48 - İşçinin işverenden izin almaksızın devamsızlık yapması" },
    { code: "49", label: "49 - İşçinin yapmakla ödevli bulunduğu görevleri yapmamakta ısrar etmesi" },
]

interface TerminationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    employeeId: string
    employeeName: string
    onSuccess?: () => void
}

export function TerminationDialog({ open, onOpenChange, employeeId, employeeName, onSuccess }: TerminationDialogProps) {
    const [loading, setLoading] = useState(false)
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
    const [code, setCode] = useState<string>("")
    const [reason, setReason] = useState<string>("")

    const handleTerminate = async () => {
        if (!code) {
            toast.error("Lütfen bir çıkış kodu seçiniz.")
            return
        }
        if (!date) {
            toast.error("Lütfen çıkış tarihi seçiniz.")
            return
        }

        setLoading(true)
        try {
            const result = await terminateEmployee(parseInt(employeeId), {
                date: new Date(date),
                code: code,
                reason: reason || SGK_CODES.find(c => c.code === code)?.label || "Belirtilmedi"
            })

            if (result.success) {
                toast.success(result.message)
                onOpenChange(false)
                if (onSuccess) onSuccess()
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            toast.error("İşlem sırasında bir hata oluştu.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Personel İşten Çıkarma</DialogTitle>
                    <DialogDescription>
                        <span className="font-semibold text-foreground">{employeeName}</span> isimli personelin işten çıkış işlemini onaylıyor musunuz?
                        Bu işlem personeli pasif duruma getirecektir.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="date">Çıkış Tarihi</Label>
                        <Input
                            id="date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="code">SGK Çıkış Kodu</Label>
                        <Select value={code} onValueChange={(val) => {
                            setCode(val)
                            setReason(SGK_CODES.find(c => c.code === val)?.label || "")
                        }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Çıkış kodu seçiniz" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                {SGK_CODES.map((item) => (
                                    <SelectItem key={item.code} value={item.code}>
                                        {item.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="reason">Çıkış Açıklaması / Nedeni</Label>
                        <Textarea
                            id="reason"
                            placeholder="Örn: Performans düşüklüğü nedeniyle..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        İptal
                    </Button>
                    <Button variant="destructive" onClick={handleTerminate} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        İşten Çıkar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
