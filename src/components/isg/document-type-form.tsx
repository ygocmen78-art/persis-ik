"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { addDocumentType, updateDocumentType } from "@/actions/isg-document-types"
import { Plus, Edit } from "lucide-react"

interface DocumentTypeFormProps {
    initialData?: {
        id: number
        name: string
        validityMonths: number | null
        description: string | null
    }
}

export function DocumentTypeForm({ initialData }: DocumentTypeFormProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState(initialData?.name || "")
    const [validityMonths, setValidityMonths] = useState(initialData?.validityMonths?.toString() || "12")
    const [description, setDescription] = useState(initialData?.description || "")

    async function handleSubmit() {
        if (!name || !validityMonths) {
            toast.error("Lütfen tüm zorunlu alanları doldurun.")
            return
        }

        setLoading(true)

        try {
            const data = {
                name,
                validityMonths: parseInt(validityMonths),
                description: description || undefined,
            }

            const result = initialData
                ? await updateDocumentType(initialData.id, data)
                : await addDocumentType(data)

            if (result.success) {
                toast.success(result.message)
                setOpen(false)
                if (!initialData) {
                    setName("")
                    setValidityMonths("12")
                    setDescription("")
                }
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            toast.error("Hata oluştu")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {initialData ? (
                    <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                    </Button>
                ) : (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Yeni Evrak Türü
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? "Evrak Türünü Düzenle" : "Yeni Evrak Türü Ekle"}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <Label>Evrak Adı *</Label>
                        <Input
                            placeholder="Örn: İş Güvenliği Eğitimi"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div>
                        <Label>Geçerlilik Süresi (Ay) *</Label>
                        <Input
                            type="number"
                            placeholder="12"
                            value={validityMonths}
                            onChange={(e) => setValidityMonths(e.target.value)}
                            min="1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Evrakın kaç ay geçerli olacağını belirtin
                        </p>
                    </div>

                    <div>
                        <Label>Açıklama</Label>
                        <Textarea
                            placeholder="Evrak hakkında açıklama..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <Button onClick={handleSubmit} disabled={loading} className="w-full">
                        {loading ? "Kaydediliyor..." : initialData ? "Güncelle" : "Kaydet"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
