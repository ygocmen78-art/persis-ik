"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { addISGRecord } from "@/actions/isg"
import { Plus, Upload as UploadIcon, Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface ISGFormProps {
    employees: { id: number; firstName: string; lastName: string }[]
    documentTypes: { id: number; name: string; validityMonths: number | null }[]
    fixedEmployeeId?: number
    onSuccess?: () => void
}

export function ISGForm({ employees, documentTypes, fixedEmployeeId, onSuccess }: ISGFormProps) {
    const [open, setOpen] = useState(false)
    const [comboOpen, setComboOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [employeeId, setEmployeeId] = useState(fixedEmployeeId?.toString() || "")
    const [searchQuery, setSearchQuery] = useState("")
    const [documentTypeId, setDocumentTypeId] = useState("")
    const [documentDate, setDocumentDate] = useState("")
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            setFile(selectedFile)

            // Create preview for images
            if (selectedFile.type.startsWith('image/')) {
                const reader = new FileReader()
                reader.onloadend = () => {
                    setPreview(reader.result as string)
                }
                reader.readAsDataURL(selectedFile)
            } else {
                setPreview(null)
            }
        }
    }

    async function handleSubmit() {
        if (!employeeId || !documentTypeId || !documentDate || !file) {
            toast.error("Lütfen tüm alanları doldurun ve dosya seçin.")
            return
        }

        setLoading(true)

        try {
            // Upload file first
            const formData = new FormData()
            formData.append('file', file)

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            const uploadData = await uploadRes.json()

            if (!uploadData.success) {
                toast.error(uploadData.error || "Dosya yüklenemedi.")
                setLoading(false)
                return
            }

            // Create ISG record
            const result = await addISGRecord({
                employeeId: parseInt(employeeId),
                documentTypeId: parseInt(documentTypeId),
                documentDate,
                filePath: uploadData.filePath,
                fileType: uploadData.fileType,
            })

            if (result.success) {
                toast.success(result.message)
                setOpen(false)
                if (!fixedEmployeeId) setEmployeeId("")
                setDocumentTypeId("")
                setDocumentDate("")
                setFile(null)
                setPreview(null)
                if (onSuccess) onSuccess()
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
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Yeni Evrak Ekle
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>İSG Evrak Ekle</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    {!fixedEmployeeId && (
                        <div>
                            <Label className="block mb-2">Personel *</Label>
                            <Popover open={comboOpen} onOpenChange={setComboOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={comboOpen}
                                        className="w-full justify-between"
                                    >
                                        {employeeId
                                            ? (() => {
                                                const emp = employees.find((e) => e.id.toString() === employeeId);
                                                return emp ? `${emp.firstName} ${emp.lastName}` : "Personel seçin...";
                                            })()
                                            : "Personel seçin..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-[450px] p-0"
                                    align="start"
                                    onOpenAutoFocus={(e) => {
                                        // Focus the search input when the popover opens
                                        const input = document.getElementById('isg-employee-search');
                                        if (input) input.focus();
                                        e.preventDefault();
                                    }}
                                >
                                    <div className="p-2 border-b">
                                        <div className="relative">
                                            <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="isg-employee-search"
                                                placeholder="Personel ara..."
                                                className="pl-8 h-10 border-none shadow-none focus-visible:ring-0"
                                                autoComplete="off"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto p-1 bg-popover">
                                        {employees
                                            .filter(emp =>
                                                `${emp.firstName} ${emp.lastName}`.toLocaleLowerCase('tr').includes(searchQuery.toLocaleLowerCase('tr'))
                                            )
                                            .map((emp) => (
                                                <div
                                                    key={emp.id}
                                                    className={cn(
                                                        "flex items-center w-full px-2 py-2 text-sm rounded-sm cursor-pointer select-none outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
                                                        employeeId === emp.id.toString() && "bg-accent/50"
                                                    )}
                                                    onClick={() => {
                                                        setEmployeeId(emp.id.toString())
                                                        setComboOpen(false)
                                                        setSearchQuery("") // Reset search
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            employeeId === emp.id.toString() ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    <span className="flex-1 truncate">
                                                        {emp.firstName} {emp.lastName}
                                                    </span>
                                                </div>
                                            ))}
                                        {employees.filter(emp =>
                                            `${emp.firstName} ${emp.lastName}`.toLocaleLowerCase('tr').includes(searchQuery.toLocaleLowerCase('tr'))
                                        ).length === 0 && (
                                                <div className="p-4 text-sm text-center text-muted-foreground animate-in fade-in zoom-in-95 duration-200">
                                                    Personel bulunamadı.
                                                </div>
                                            )}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}

                    <div>
                        <Label>Evrak Türü *</Label>
                        <Select value={documentTypeId} onValueChange={setDocumentTypeId}>
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
                            value={documentDate}
                            onChange={(e) => setDocumentDate(e.target.value)}
                        />
                    </div>

                    <div>
                        <Label>Dosya (PDF/JPG/PNG) *</Label>
                        <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileChange}
                        />
                        {preview && (
                            <div className="mt-2">
                                <img src={preview} alt="Preview" className="max-h-32 rounded border" />
                            </div>
                        )}
                        {file && !preview && (
                            <div className="mt-2 text-sm text-muted-foreground">
                                📄 {file.name}
                            </div>
                        )}
                    </div>

                    <Button onClick={handleSubmit} disabled={loading} className="w-full">
                        {loading ? "Yükleniyor..." : "Kaydet"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
