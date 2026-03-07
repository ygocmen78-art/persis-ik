"use client"

import { useState } from "react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { FileText, Trash2, Calendar, AlertCircle, Eye, Pencil, Printer } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { deleteISGRecord, updateISGRecord } from "@/actions/isg"
import { toast } from "sonner"
import { ISGForm } from "./isg-form"
import { DocumentPreview } from "./document-preview"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface ISGRecord {
    id: number
    employeeId: number
    employeeName: string | null
    employeeSurname: string | null
    documentTypeId: number
    documentTypeName: string | null
    documentDate: string | null
    expiryDate: string | null
    filePath: string | null
    fileType: string | null
    notificationStatus: string | null
}

interface EmployeeISGHistoryProps {
    employeeId: number
    initialRecords: ISGRecord[]
    employees: any[]
    documentTypes: any[]
}

export function EmployeeISGHistory({
    employeeId,
    initialRecords,
    employees,
    documentTypes,
}: EmployeeISGHistoryProps) {
    const [records, setRecords] = useState<ISGRecord[]>(initialRecords)
    const [isDeleting, setIsDeleting] = useState<number | null>(null)
    const [previewOpen, setPreviewOpen] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [editLoading, setEditLoading] = useState(false)
    const [selectedRecord, setSelectedRecord] = useState<ISGRecord | null>(null)

    // Edit form state
    const [editDocumentTypeId, setEditDocumentTypeId] = useState("")
    const [editDocumentDate, setEditDocumentDate] = useState("")
    const [editFile, setEditFile] = useState<File | null>(null)

    const handleDelete = async () => {
        if (!isDeleting) return

        const result = await deleteISGRecord(isDeleting)
        if (result.success) {
            toast.success("İSG kaydı silindi.")
            setRecords(prev => prev.filter(r => r.id !== isDeleting))
        } else {
            toast.error(result.message)
        }
        setIsDeleting(null)
    }

    const handlePrint = (record: ISGRecord) => {
        if (record.filePath) {
            const printWindow = window.open(record.filePath, '_blank')
            printWindow?.addEventListener('load', () => {
                printWindow.print()
            })
        }
    }

    const handleEditOpen = (record: ISGRecord) => {
        setSelectedRecord(record)
        setEditDocumentTypeId(record.documentTypeId.toString())
        setEditDocumentDate(record.documentDate ? record.documentDate.split("T")[0] : "")
        setEditFile(null)
        setEditOpen(true)
    }

    const handleEditSubmit = async () => {
        if (!selectedRecord || !editDocumentTypeId || !editDocumentDate) {
            toast.error("Lütfen tüm alanları doldurun.")
            return
        }

        setEditLoading(true)

        try {
            let filePath: string | undefined
            let fileType: string | undefined

            if (editFile) {
                const formData = new FormData()
                formData.append('file', editFile)

                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                })

                const uploadData = await uploadRes.json()

                if (!uploadData.success) {
                    toast.error(uploadData.error || "Dosya yüklenemedi.")
                    setEditLoading(false)
                    return
                }

                filePath = uploadData.filePath
                fileType = uploadData.fileType
            }

            const result = await updateISGRecord(selectedRecord.id, {
                employeeId: employeeId,
                documentTypeId: parseInt(editDocumentTypeId),
                documentDate: editDocumentDate,
                filePath,
                fileType,
            })

            if (result.success) {
                toast.success(result.message)
                window.location.reload() // Or update state if possible
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            toast.error("Hata oluştu")
        } finally {
            setEditLoading(false)
        }
    }

    const today = new Date()

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">İSG Evrak Geçmişi</h4>
                <ISGForm
                    employees={employees}
                    documentTypes={documentTypes}
                    fixedEmployeeId={employeeId}
                    onSuccess={() => {
                        // Refresh logic would ideally happen via revalidatePath, 
                        // but for immediate UI feedback we'd need a way to refetch or update state.
                        // For now, it will show on next page load or via revalidatePath if on same page.
                        window.location.reload()
                    }}
                />
            </div>

            {records.length > 0 ? (
                <div className="grid gap-3">
                    {records.map((record) => {
                        const expiry = record.expiryDate ? new Date(record.expiryDate) : null
                        const isExpired = expiry && expiry < today
                        const isExpiringSoon = expiry && !isExpired && (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24) < 30

                        return (
                            <div
                                key={record.id}
                                className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-slate-900 group hover:border-blue-200 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "p-2 rounded-lg",
                                        isExpired ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                                    )}>
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                                            {record.documentTypeName}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                Veriliş: {record.documentDate ? format(new Date(record.documentDate), "d MMMM yyyy", { locale: tr }) : "-"}
                                            </span>
                                            <span className={cn(
                                                "flex items-center gap-1",
                                                isExpired ? "text-red-600 font-bold" : isExpiringSoon ? "text-amber-600 font-bold" : ""
                                            )}>
                                                <AlertCircle className="h-3 w-3" />
                                                Geçerlilik: {record.expiryDate ? format(new Date(record.expiryDate), "d MMMM yyyy", { locale: tr }) : "-"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 mr-2 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                            onClick={() => {
                                                setSelectedRecord(record)
                                                setPreviewOpen(true)
                                            }}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-amber-600 hover:bg-amber-50"
                                            onClick={() => handleEditOpen(record)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-600 hover:bg-slate-100"
                                            onClick={() => handlePrint(record)}
                                        >
                                            <Printer className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        {isExpired ? (
                                            <Badge variant="destructive" className="h-5 text-[10px] uppercase font-bold">Süresi Doldu</Badge>
                                        ) : isExpiringSoon ? (
                                            <Badge variant="secondary" className="h-5 bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 uppercase text-[10px] font-bold">Yaklaşıyor</Badge>
                                        ) : (
                                            <Badge variant="outline" className="h-5 border-green-200 text-green-700 bg-green-50 uppercase text-[10px] font-bold">Geçerli</Badge>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-slate-400 hover:text-red-600 transition-colors"
                                            onClick={() => setIsDeleting(record.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="text-center py-12 border rounded-xl bg-slate-50/50 border-dashed">
                    <FileText className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">Bu personelin henüz İSG belgesi bulunmuyor.</p>
                </div>
            )}

            <AlertDialog open={!!isDeleting} onOpenChange={(open) => !open && setIsDeleting(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>İSG Kaydını Sil</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu İSG evrak kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
                            Sil
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Preview Dialog */}
            {selectedRecord && (
                <DocumentPreview
                    open={previewOpen}
                    onOpenChange={setPreviewOpen}
                    filePath={selectedRecord.filePath}
                    fileType={selectedRecord.fileType}
                    title={selectedRecord.documentTypeName || "Evrak"}
                />
            )}

            {/* Edit Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>İSG Evrak Düzenle</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Evrak Türü *</Label>
                            <Select value={editDocumentTypeId} onValueChange={setEditDocumentTypeId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Evrak türü seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    {documentTypes.map((dt) => (
                                        <SelectItem key={dt.id} value={dt.id.toString()}>
                                            {dt.name} ({dt.validityMonths || 12} ay)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Evrak Tarihi *</Label>
                            <Input
                                type="date"
                                value={editDocumentDate}
                                onChange={(e) => setEditDocumentDate(e.target.value)}
                            />
                        </div>

                        <div>
                            <Label>Dosya Değiştir (İsteğe Bağlı)</Label>
                            <Input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Yeni dosya seçilmezse mevcut dosya korunur.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)}>İptal</Button>
                        <Button onClick={handleEditSubmit} disabled={editLoading}>
                            {editLoading ? "Kaydediliyor..." : "Güncelle"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ")
}
