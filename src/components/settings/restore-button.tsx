"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, Loader2, AlertTriangle } from "lucide-react"
import { restoreBackup } from "@/actions/backup"
import { toast } from "sonner"
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

export function RestoreButton() {
    const [isPending, setIsPending] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file)
            setShowConfirm(true)
        }
    }

    const handleRestore = async () => {
        if (!selectedFile) return

        setIsPending(true)
        const formData = new FormData()
        formData.append("file", selectedFile)

        try {
            const result = await restoreBackup(formData)
            if (result.success) {
                toast.success(result.message, { duration: 10000 })
                // Veritabanı değiştikten sonra sayfayı yenilemek en güvenlisi
                setTimeout(() => window.location.reload(), 2000)
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            toast.error("Geri yükleme sırasında beklenmedik bir hata oluştu.")
        } finally {
            setIsPending(false)
            setShowConfirm(false)
            setSelectedFile(null)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    return (
        <>
            <input
                type="file"
                accept=".db"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={isPending}
            />

            <Button
                variant="outline"
                disabled={isPending}
                onClick={() => fileInputRef.current?.click()}
            >
                {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Upload className="mr-2 h-4 w-4" />
                )}
                Yedekten Geri Yükle
            </Button>

            <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Veritabanını Geri Yükle?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            <b>{selectedFile?.name}</b> dosyası kullanılarak veritabanı geri yüklenecektir.
                            <br /><br />
                            Bu işlem <b>mevcut tüm verilerinizin üzerine yazacaktır</b> ve geri alınamaz.
                            Devam etmek istediğinize emin misiniz?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>İptal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault()
                                handleRestore()
                            }}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={isPending}
                        >
                            {isPending ? "Yükleniyor..." : "Evet, Geri Yükle"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
