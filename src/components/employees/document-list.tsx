"use client"

import { useState } from "react"
import { uploadEmployeeDocument, deleteEmployeeDocument } from "@/actions/documents"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { FileIcon, Download, Printer, Trash2, Eye, FileText, Upload } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addDocumentCategory } from "@/actions/document-categories"
import { DocumentPreview } from "../isg/document-preview"

export type DocumentCategory = {
    id: number
    name: string
}

type Document = {
    id: number
    title: string
    type: string | null
    category: string | null
    filePath: string
    fileName: string | null
    fileSize: number | null
    createdAt: string | null
}

export function DocumentList({
    employeeId,
    initialDocuments,
    initialCategories
}: {
    employeeId: number,
    initialDocuments: Document[],
    initialCategories: DocumentCategory[]
}) {
    const [documents, setDocuments] = useState<Document[]>(initialDocuments)
    const [categories, setCategories] = useState<DocumentCategory[]>(initialCategories)
    const [uploading, setUploading] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [title, setTitle] = useState("")
    const [category, setCategory] = useState("other")

    // Preview State
    const [previewOpen, setPreviewOpen] = useState(false)
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)

    // Custom Category State
    const [newCategoryName, setNewCategoryName] = useState("")
    const [addingCategory, setAddingCategory] = useState(false)

    async function handleAddCategory(e: React.FormEvent) {
        e.preventDefault()
        if (!newCategoryName.trim()) return

        setAddingCategory(true)
        try {
            const res = await addDocumentCategory(newCategoryName)
            if (res.success && res.category) {
                toast.success(res.message)
                setCategories((prev) => [...prev, res.category as DocumentCategory])
                setCategory(res.category.name) // Auto-select the newly added category
                setNewCategoryName("") // Clear input
            } else {
                toast.error(res.message)
            }
        } catch (err) {
            toast.error("Kategori eklenirken hata oluştu.")
        } finally {
            setAddingCategory(false)
        }
    }

    async function handleUpload(e: React.FormEvent) {
        e.preventDefault()
        if (!file || !title) return toast.error("Lütfen dosya ve evrak adı giriniz.")

        setUploading(true)
        const formData = new FormData()
        formData.append("file", file)
        formData.append("employeeId", employeeId.toString())
        formData.append("title", title)
        formData.append("category", category)

        try {
            const result = await uploadEmployeeDocument(formData)
            if (result.success) {
                toast.success(result.message)
                // Reset form
                setFile(null)
                setTitle("")
                setCategory("other")
                // Reset file input by finding it and setting value to empty
                const fileInput = document.getElementById("file-upload") as HTMLInputElement
                if (fileInput) fileInput.value = ""

                // Append new document to the top of the local state without reloading
                if (result.document) {
                    setDocuments((prev) => [result.document as Document, ...prev])
                }
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            toast.error("Yükleme sırasında hata oluştu.")
        } finally {
            setUploading(false)
        }
    }

    async function handleDelete(id: number) {
        if (!confirm("Bu evrakı silmek istediğinize emin misiniz?")) return

        try {
            const result = await deleteEmployeeDocument(id, employeeId)
            if (result.success) {
                toast.success(result.message)
                setDocuments(docs => docs.filter(d => d.id !== id))
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            toast.error("Silme başarısız.")
        }
    }

    function formatBytes(bytes: number | null) {
        if (!bytes) return "0 B"
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    // Opens a new window for printing the image/pdf directly
    const handlePrint = (filePath: string) => {
        const printWindow = window.open(filePath, '_blank');
        if (printWindow) {
            printWindow.onload = () => {
                printWindow.print();
            };
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Yeni Evrak Yükle</CardTitle>
                    <CardDescription>Personel dosyasına (Kimlik, Sözleşme, Rapor vb.) belge ekleyin.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpload} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 space-y-2">
                            <label className="text-sm font-medium">Evrak Adı (Örn: Kimlik Fotokopisi)</label>
                            <Input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Evrak başlığı..."
                                required
                            />
                        </div>
                        <div className="w-full md:w-48 space-y-2">
                            <label className="text-sm font-medium">Kategori</label>
                            <span className="flex flex-col gap-1 w-full">
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="id_card">Kimlik</SelectItem>
                                        <SelectItem value="contract">Sözleşme</SelectItem>
                                        <SelectItem value="diploma">Diploma / Sertifika</SelectItem>
                                        <SelectItem value="health">Sağlık Raporu</SelectItem>
                                        <SelectItem value="kvkk">KVKK Onay Metni</SelectItem>
                                        <SelectItem value="criminal_record">Sabıka Kaydı</SelectItem>
                                        <SelectItem value="residence">İkametgah</SelectItem>
                                        <SelectItem value="sgk_statement">SGK Hizmet Dökümü</SelectItem>
                                        <SelectItem value="family_status">Aile Durum Bildirimi</SelectItem>

                                        {/* DB Categories */}
                                        {categories.map((c) => (
                                            <SelectItem key={`db-${c.id}`} value={c.name}>{c.name}</SelectItem>
                                        ))}

                                        <SelectItem value="other">Diğer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </span>

                            {/* Inline Add Category */}
                            <div className="flex gap-2 mt-2">
                                <Input
                                    className="h-8 text-xs"
                                    placeholder="Yeni tür yazın..."
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    disabled={addingCategory}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            handleAddCategory(e)
                                        }
                                    }}
                                />
                                <Button
                                    type="button"
                                    onClick={handleAddCategory}
                                    disabled={addingCategory || !newCategoryName.trim()}
                                    className="h-8 px-2"
                                    variant="secondary"
                                >
                                    Ekle
                                </Button>
                            </div>
                        </div>
                        <div className="flex-1 space-y-2">
                            <label className="text-sm font-medium">Dosya Seçin</label>
                            <Input
                                id="file-upload"
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={e => setFile(e.target.files?.[0] || null)}
                                required
                            />
                        </div>
                        <Button type="submit" disabled={uploading} className="w-full md:w-auto">
                            {uploading ? "Yükleniyor..." : <><Upload className="w-4 h-4 mr-2" /> Yükle</>}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Yüklü Evraklar</CardTitle>
                </CardHeader>
                <CardContent>
                    {documents.length > 0 ? (
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Evrak Adı</TableHead>
                                        <TableHead>Kategori</TableHead>
                                        <TableHead>Tür & Boyut</TableHead>
                                        <TableHead>Yüklenme Tarihi</TableHead>
                                        <TableHead className="text-right">İşlemler</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {documents.map(doc => (
                                        <TableRow key={doc.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-blue-500" />
                                                    {doc.title}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {doc.category === 'id_card' ? 'Kimlik' :
                                                        doc.category === 'contract' ? 'Sözleşme' :
                                                            doc.category === 'diploma' ? 'Eğitim/Sertifika' :
                                                                doc.category === 'health' ? 'Sağlık Raporu' :
                                                                    doc.category === 'kvkk' ? 'KVKK Onay' :
                                                                        doc.category === 'criminal_record' ? 'Sabıka Kaydı' :
                                                                            doc.category === 'residence' ? 'İkametgah' :
                                                                                doc.category === 'sgk_statement' ? 'SGK Dökümü' :
                                                                                    doc.category === 'family_status' ? 'Aile Bildirimi' :
                                                                                        doc.category === 'other' ? 'Diğer' : doc.category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                <span className="uppercase font-semibold">{doc.type || "Bilinmiyor"}</span>
                                                <span className="mx-2">•</span>
                                                <span>{formatBytes(doc.fileSize)}</span>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {doc.createdAt ? format(new Date(doc.createdAt), "d MMM yyyy, HH:mm", { locale: tr }) : "-"}
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Önizle / Aç"
                                                    onClick={() => {
                                                        setSelectedDoc(doc)
                                                        setPreviewOpen(true)
                                                    }}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <a href={doc.filePath} download={doc.fileName || "evrak"}>
                                                    <Button variant="ghost" size="icon" title="İndir">
                                                        <Download className="w-4 h-4" />
                                                    </Button>
                                                </a>
                                                <Button variant="ghost" size="icon" title="Yazdır" onClick={() => handlePrint(doc.filePath)}>
                                                    <Printer className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" title="Sil" onClick={() => handleDelete(doc.id)}>
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-10 border rounded-md border-dashed">
                            <FileIcon className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                            <h3 className="text-lg font-medium text-muted-foreground">Henüz evrak yüklenmemiş</h3>
                            <p className="text-sm text-muted-foreground mt-1">Personelin özlük dosyasına ait taranmış evrakları buradan yükleyebilirsiniz.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {selectedDoc && (
                <DocumentPreview
                    open={previewOpen}
                    onOpenChange={setPreviewOpen}
                    filePath={selectedDoc.filePath}
                    fileType={selectedDoc.type === 'pdf' ? 'pdf' : 'image'}
                    title={selectedDoc.title}
                />
            )}
        </div>
    )
}
