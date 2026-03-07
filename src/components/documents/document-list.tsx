"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { File, MoreVertical, Download, Trash, Plus, Upload, Building2, FileText, Eye, FolderOpen, Printer, Mail } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useRef } from "react"
import { addDocument, deleteDocument } from "@/actions/documents"
import { documentCategories } from "@/lib/document-categories"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"

interface Branch {
    id: number
    name: string
}

interface Document {
    id: number
    title: string
    type: string | null
    category: string | null
    filePath: string
    fileName: string | null
    fileSize: number | null
    companyName: string | null
    relatedTo: string | null
    branchId: number | null
    branchName: string | null
    createdAt: string | null
}

interface DocumentListProps {
    data: Document[]
    branches: Branch[]
}

function formatFileSize(bytes: number | null): string {
    if (!bytes) return "-"
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getCategoryLabel(category: string | null): string {
    const cat = documentCategories.find(c => c.value === category)
    return cat?.label || "Diğer"
}

function getFileIcon(type: string | null) {
    const t = type?.toLowerCase()
    if (t === "pdf") return <FileText className="h-6 w-6 text-red-500" />
    if (t === "jpg" || t === "jpeg" || t === "png") return <File className="h-6 w-6 text-green-500" />
    if (t === "docx" || t === "doc") return <File className="h-6 w-6 text-blue-500" />
    if (t === "xlsx" || t === "xls") return <File className="h-6 w-6 text-emerald-500" />
    return <File className="h-6 w-6 text-gray-500" />
}

export function DocumentList({ data, branches }: DocumentListProps) {
    const [open, setOpen] = useState(false)
    const [title, setTitle] = useState("")
    const [category, setCategory] = useState("other")
    const [companyName, setCompanyName] = useState("")
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewOpen, setPreviewOpen] = useState(false)
    const [previewDoc, setPreviewDoc] = useState<Document | null>(null)

    // Email States
    const [emailOpen, setEmailOpen] = useState(false)
    const [emailDoc, setEmailDoc] = useState<Document | null>(null)
    const [emailRecipient, setEmailRecipient] = useState("")
    const [emailSubject, setEmailSubject] = useState("")
    const [emailMessage, setEmailMessage] = useState("")
    const [emailSending, setEmailSending] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    // Get unique company names
    const companies = Array.from(new Set(data.map(d => d.companyName).filter(Boolean))) as string[]

    // Group documents: General (no company) + specific companies
    const generalDocs = data.filter(d => !d.companyName)

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file)
            // Auto-fill title with filename without extension
            const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "")
            if (!title) {
                setTitle(nameWithoutExt)
            }
        }
    }

    async function handleAdd() {
        if (!title) return toast.error("Lütfen başlık giriniz.")
        if (!selectedFile) return toast.error("Lütfen dosya seçiniz.")

        setLoading(true)
        setUploading(true)

        try {
            // Upload file first
            const formData = new FormData()
            formData.append("file", selectedFile)

            const uploadResponse = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            })

            const uploadResult = await uploadResponse.json()

            if (!uploadResult.success && !uploadResult.filePath) {
                throw new Error(uploadResult.error || "Dosya yüklenemedi")
            }

            // Get file extension
            const extension = selectedFile.name.split('.').pop()?.toUpperCase() || "PDF"

            // Add document to database
            const result = await addDocument({
                title,
                type: extension,
                category,
                filePath: uploadResult.filePath,
                fileName: selectedFile.name,
                fileSize: selectedFile.size,
                companyName: companyName || undefined,
                relatedTo: "company",
            })

            if (result.success) {
                toast.success(result.message)
                setOpen(false)
                resetForm()
                router.refresh()
            } else {
                toast.error(result.message)
            }
        } catch (error: any) {
            toast.error(error.message || "Hata oluştu")
        } finally {
            setLoading(false)
            setUploading(false)
        }
    }

    function resetForm() {
        setTitle("")
        setCategory("other")
        setCompanyName("")
        setSelectedFile(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    // Email Functions
    function handleEmailClick(doc: Document) {
        // 1. Start download
        handleDownload(doc)

        // 2. Open mail client
        const subject = encodeURIComponent(`${doc.title} Hakkında`)
        const body = encodeURIComponent(`Merhaba,\n\nİlgili belge ektedir.\n\nİyi çalışmalar.`)

        setTimeout(() => {
            window.location.href = `mailto:?subject=${subject}&body=${body}`
            toast.success("Dosya indirildi ve posta istemcisi açıldı. Lütfen indirilen dosyayı e-postaya ekleyiniz.")
        }, 500)
    }

    async function handleDelete(id: number) {
        if (confirm("Bu dokümanı silmek istediğinize emin misiniz?")) {
            const result = await deleteDocument(id)
            if (result.success) {
                toast.success(result.message)
                router.refresh()
            } else {
                toast.error(result.message)
            }
        }
    }

    function handlePreview(doc: Document) {
        setPreviewDoc(doc)
        setPreviewOpen(true)
    }

    function handleDownload(doc: Document) {
        const link = document.createElement("a")
        link.href = doc.filePath
        link.download = doc.fileName || doc.title
        link.click()
    }

    function handlePrint(doc: Document) {
        const type = doc.type?.toLowerCase()
        if (type === 'pdf' || type === 'jpg' || type === 'jpeg' || type === 'png') {
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = doc.filePath;
            document.body.appendChild(iframe);

            iframe.onload = () => {
                try {
                    iframe.contentWindow?.focus();
                    iframe.contentWindow?.print();
                } catch (e) {
                    console.error("Print failed", e);
                    toast.error("Yazdırma penceresi açılamadı.");
                } finally {
                    // Clean up iframe after a delay to ensure print dialog initiated
                    setTimeout(() => {
                        document.body.removeChild(iframe);
                    }, 5000); // 5 seconds safe delay
                }
            }
        } else {
            toast.info("Bu dosya formatı doğrudan yazdırılamaz. Lütfen indirip yazdırınız.")
        }
    }

    function DocumentCard({ doc }: { doc: Document }) {
        return (
            <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <div className="flex items-center space-x-3">
                        {getFileIcon(doc.type)}
                        <div className="space-y-1">
                            <CardTitle className="text-sm font-medium leading-none">
                                {doc.title}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                    {getCategoryLabel(doc.category)}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    {doc.type}
                                </span>
                            </div>
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handlePreview(doc)}>
                                <Eye className="mr-2 h-4 w-4" /> Önizle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(doc)}>
                                <Download className="mr-2 h-4 w-4" /> İndir
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePrint(doc)}>
                                <Printer className="mr-2 h-4 w-4" /> Yazdır
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEmailClick(doc)}>
                                <Mail className="mr-2 h-4 w-4" /> Mail Gönder
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(doc.id)}>
                                <Trash className="mr-2 h-4 w-4" /> Sil
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>
                <CardContent>
                    <div className="space-y-1">
                        {doc.companyName && (
                            <div className="text-xs font-medium text-primary">
                                {doc.companyName}
                            </div>
                        )}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{formatFileSize(doc.fileSize)}</span>
                            <span>{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("tr-TR") : "-"}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {/* Add Document Button */}
            <div className="flex justify-end">
                <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm() }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Evrak Ekle
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Yeni Evrak Ekle</DialogTitle>
                            <DialogDescription>
                                Şirket evraklarını (ticari sicil, imza sirküleri vb.) buradan yükleyin.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            {/* File Upload */}
                            <div className="grid gap-2">
                                <Label>Dosya Seç</Label>
                                <div
                                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {selectedFile ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <FileText className="h-8 w-8 text-primary" />
                                            <div className="text-left">
                                                <p className="font-medium">{selectedFile.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatFileSize(selectedFile.size)}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <Upload className="h-8 w-8 text-muted-foreground" />
                                            <p className="text-sm text-muted-foreground">
                                                Dosya yüklemek için tıklayın
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                PDF, JPG, PNG, DOCX, XLSX
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx"
                                    onChange={handleFileChange}
                                />
                            </div>

                            {/* Title */}
                            <div className="grid gap-2">
                                <Label htmlFor="title">Evrak Başlığı</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Örn: 2024 Ticari Sicil Gazetesi"
                                />
                            </div>

                            {/* Category */}
                            <div className="grid gap-2">
                                <Label>Evrak Türü</Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Tür seçiniz" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {documentCategories.map((cat) => (
                                            <SelectItem key={cat.value} value={cat.value}>
                                                {cat.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Company */}
                            <div className="grid gap-2">
                                <Label>Şirket</Label>
                                <Input
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    placeholder="Örn: ABC Holding A.Ş."
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAdd} disabled={loading}>
                                {uploading ? "Yükleniyor..." : "Kaydet"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Documents Tabs */}
            <Tabs defaultValue={companies.length > 0 ? `company-${companies[0]}` : "general"} className="space-y-4">
                <TabsList className="flex-wrap h-auto gap-2 bg-transparent p-0">
                    <TabsTrigger
                        value="general"
                        className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-background"
                    >
                        <Building2 className="h-4 w-4" />
                        Genel ({generalDocs.length})
                    </TabsTrigger>

                    {companies.map((company, index) => {
                        const count = data.filter(d => d.companyName === company).length
                        return (
                            <TabsTrigger
                                key={index}
                                value={`company-${company}`}
                                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-background"
                            >
                                <Building2 className="h-4 w-4" />
                                {company} ({count})
                            </TabsTrigger>
                        )
                    })}
                </TabsList>

                <TabsContent value="general" className="mt-4">
                    {generalDocs.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {generalDocs.map((doc) => (
                                <DocumentCard key={doc.id} doc={doc} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg border-dashed bg-muted/20">
                            <FileText className="h-10 w-10 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium">Henüz genel evrak yüklenmemiş</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Sağ üstteki &quot;Evrak Ekle&quot; butonunu kullanarak yeni bir evrak yükleyebilirsiniz.
                            </p>
                        </div>
                    )}
                </TabsContent>

                {/* Specific Company Documents Content */}
                {companies.map((company, index) => (
                    <TabsContent key={index} value={`company-${company}`} className="mt-4">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {data.filter(d => d.companyName === company).map((doc) => (
                                <DocumentCard key={doc.id} doc={doc} />
                            ))}
                        </div>
                    </TabsContent>
                ))}
            </Tabs>

            {/* Preview Dialog */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-[95vw] sm:max-w-[95vw] w-[95vw] h-[95vh] flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="p-4 border-b">
                        <DialogTitle>{previewDoc?.title}</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto bg-muted/10 p-4">
                        {previewDoc && (
                            previewDoc.type?.toLowerCase() === "pdf" ? (
                                <iframe
                                    src={previewDoc.filePath}
                                    className="w-full h-full min-h-[75vh]"
                                    title={previewDoc.title}
                                />
                            ) : (
                                <div className="flex items-center justify-center min-h-[75vh]">
                                    <img
                                        src={previewDoc.filePath}
                                        alt={previewDoc.title}
                                        className="max-w-full max-h-full object-contain mx-auto shadow-lg"
                                    />
                                </div>
                            )
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
