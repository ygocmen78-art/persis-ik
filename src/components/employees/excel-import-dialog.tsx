"use client"

import { useState, useRef } from "react"
import { Upload, FileSpreadsheet, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { importEmployees } from "@/actions/bulk-import"
import * as XLSX from "xlsx"

export function ExcelImportDialog() {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleDownloadTemplate = () => {
        const headers = ["Ad", "Soyad", "Çalışma Yeri (Şube)", "Şirket (SGK)", "TC", "Telefon", "Departman", "SGK Meslek", "Maaş", "IBAN", "İşe Giriş"];
        const data = [
            ["Ahmet", "Yılmaz", "Fabrika", "Zofunlar A.Ş.", "11111111111", "5551234567", "Üretim", "İşçi", 30000, "TR1234...", "2024-01-01"],
            ["Ayşe", "Demir", "Ofis", "Zet Lojistik", "22222222222", "5559876543", "Satış", "Temsilci", 25000, "TR5678...", "2024-02-15"]
        ];

        const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sablon");
        XLSX.writeFile(wb, "Personel_Yukleme_Sablonu.xlsx");
    }

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!fileInputRef.current?.files?.[0]) {
            toast.error("Lütfen bir dosya seçin.");
            return;
        }

        const file = fileInputRef.current.files[0];
        const formData = new FormData();
        formData.append("file", file);

        setIsLoading(true);

        try {
            const result = await importEmployees(formData);
            if (result.success) {
                toast.success(result.message);
                setOpen(false);
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Beklenmeyen bir hata oluştu.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    Excel İle Yükle
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Toplu Personel Yükleme</DialogTitle>
                    <DialogDescription>
                        Excel dosyası kullanarak birden fazla personeli tek seferde ekleyebilirsiniz.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Step 1: Download Template */}
                    <div className="bg-muted/50 p-4 rounded-lg flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="font-medium text-sm">1. Adım: Şablonu İndir</p>
                            <p className="text-xs text-muted-foreground">Doğru format için bu şablonu kullanın.</p>
                        </div>
                        <Button variant="secondary" size="sm" onClick={handleDownloadTemplate} className="gap-2">
                            <Download className="h-4 w-4" />
                            Şablon İndir
                        </Button>
                    </div>

                    {/* Step 2: Upload File */}
                    <form onSubmit={handleUpload} className="space-y-4">
                        <div className="space-y-2">
                            <Label>2. Adım: Dosyayı Yükle</Label>
                            <Input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx, .xls"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                                İptal
                            </Button>
                            <Button type="submit" disabled={isLoading} className="gap-2">
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Yükleniyor...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4" />
                                        Yükle Kaydet
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    )
}
