"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { FileText, Trash, Printer, Eye, Pencil } from "lucide-react"
import { format, differenceInDays } from "date-fns"
import { tr } from "date-fns/locale"
import { deleteISGRecord, updateISGRecord } from "@/actions/isg"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { DocumentPreview } from "./document-preview"


interface DocumentCardProps {
    document: {
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
    }
    employees: { id: number; firstName: string; lastName: string }[]
    documentTypes: { id: number; name: string; validityMonths: number | null }[]
}

export function DocumentCard({ document, employees, documentTypes }: DocumentCardProps) {
    const [previewOpen, setPreviewOpen] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [editLoading, setEditLoading] = useState(false)

    // Handle auto-open if hash matches
    useEffect(() => {
        if (typeof window !== 'undefined' && window.location.hash === `#record-${document.id}`) {
            setTimeout(() => {
                setEditOpen(true);
                const element = window.document.getElementById(`record-${document.id}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 500);
        }
    }, [document.id]);

    // Edit form state
    const [editEmployeeId, setEditEmployeeId] = useState(document.employeeId.toString())
    const [editDocumentTypeId, setEditDocumentTypeId] = useState(document.documentTypeId.toString())
    const [editDocumentDate, setEditDocumentDate] = useState(
        document.documentDate ? document.documentDate.split("T")[0] : ""
    )
    const [editFile, setEditFile] = useState<File | null>(null)

    const getStatus = () => {
        if (!document.expiryDate) return { label: "Geçerli", variant: "default" as const }

        const today = new Date()
        const expiry = new Date(document.expiryDate)
        const daysUntilExpiry = differenceInDays(expiry, today)

        if (daysUntilExpiry < 0) {
            return { label: "Süresi Dolmuş", variant: "destructive" as const }
        } else if (daysUntilExpiry <= 30) {
            return { label: `${daysUntilExpiry} Gün Kaldı`, variant: "warning" as const }
        } else {
            return { label: "Geçerli", variant: "default" as const }
        }
    }

    async function handleDelete() {
        if (!confirm("Bu evrakı silmek istediğinize emin misiniz?")) return

        const result = await deleteISGRecord(document.id)
        if (result.success) {
            toast.success(result.message)
        } else {
            toast.error(result.message)
        }
    }

    function handlePrint() {
        if (document.filePath) {
            const printWindow = window.open(document.filePath, '_blank')
            printWindow?.addEventListener('load', () => {
                printWindow.print()
            })
        }
    }

    function handleEditOpen() {
        // Reset form to current values
        setEditEmployeeId(document.employeeId.toString())
        setEditDocumentTypeId(document.documentTypeId.toString())
        setEditDocumentDate(document.documentDate ? document.documentDate.split("T")[0] : "")
        setEditFile(null)
        setEditOpen(true)
    }

    async function handleEditSubmit() {
        if (!editEmployeeId || !editDocumentTypeId || !editDocumentDate) {
            toast.error("Lütfen tüm alanları doldurun.")
            return
        }

        setEditLoading(true)

        try {
            let filePath: string | undefined
            let fileType: string | undefined

            // If a new file was selected, upload it
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

            const result = await updateISGRecord(document.id, {
                employeeId: parseInt(editEmployeeId),
                documentTypeId: parseInt(editDocumentTypeId),
                documentDate: editDocumentDate,
                filePath,
                fileType,
            })

            if (result.success) {
                toast.success(result.message)
                setEditOpen(false)
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            toast.error("Hata oluştu")
        } finally {
            setEditLoading(false)
        }
    }

    const status = getStatus()

    return (
        <>
            <Card id={`record-${document.id}`} className="hover:shadow-md transition-shadow cursor-pointer" onDoubleClick={() => setPreviewOpen(true)}>
                <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                        {/* Thumbnail */}
                        <div className="flex-shrink-0">
                            {document.fileType === 'image' && document.filePath ? (
                                <img
                                    src={document.filePath}
                                    alt="Thumbnail"
                                    className="w-32 h-32 object-cover rounded border"
                                />
                            ) : document.fileType === 'pdf' && document.filePath ? (
                                <div className="w-32 h-32 rounded border border-gray-300 dark:border-gray-700 overflow-hidden bg-white relative shadow-sm">
                                    <div className="absolute inset-0" style={{ transform: 'scale(0.15)', transformOrigin: 'top left', width: '666%', height: '666%' }}>
                                        <iframe
                                            src={`${document.filePath}#page=1&view=Fit&toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0`}
                                            className="w-full h-full pointer-events-none"
                                            style={{
                                                border: 'none'
                                            }}
                                            title="PDF Preview"
                                        />
                                    </div>
                                    <div className="absolute bottom-1 right-1 bg-red-600 text-white text-[9px] px-1.5 py-0.5 rounded font-bold shadow-sm z-10">
                                        PDF
                                    </div>
                                </div>
                            ) : (
                                <div className="w-32 h-32 bg-muted rounded border flex items-center justify-center">
                                    <FileText className="h-12 w-12 text-muted-foreground" />
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{document.documentTypeName}</h3>
                            <p className="text-sm text-muted-foreground">
                                {document.employeeName} {document.employeeSurname}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant={status.variant}>{status.label}</Badge>
                                {document.expiryDate && (
                                    <span className="text-xs text-muted-foreground">
                                        Bitiş: {format(new Date(document.expiryDate), 'dd MMM yyyy', { locale: tr })}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setPreviewOpen(true)}>
                                <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleEditOpen}>
                                <Pencil className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handlePrint}>
                                <Printer className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleDelete}>
                                <Trash className="h-4 w-4 text-red-600" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Preview Dialog */}
            <DocumentPreview
                open={previewOpen}
                onOpenChange={setPreviewOpen}
                filePath={document.filePath}
                fileType={document.fileType}
                title={document.documentTypeName || "Evrak"}
            />

            {/* Edit Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>İSG Evrak Düzenle</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Personel *</Label>
                            <Select value={editEmployeeId} onValueChange={setEditEmployeeId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Personel seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees.map((emp) => (
                                        <SelectItem key={emp.id} value={emp.id.toString()}>
                                            {emp.firstName} {emp.lastName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

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
        </>
    )
}
