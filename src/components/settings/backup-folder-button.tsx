"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FolderOpen } from "lucide-react"
import { openBackupFolder } from "@/actions/backup"
import { toast } from "sonner"

export function BackupFolderButton() {
    const [isPending, setIsPending] = useState(false)

    const handleOpenFolder = async () => {
        setIsPending(true)
        try {
            const result = await openBackupFolder()
            if (result.success) {
                toast.success(result.message)
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            toast.error("Klasör açılamadı.")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Button
            variant="outline"
            disabled={isPending}
            onClick={handleOpenFolder}
        >
            <FolderOpen className="mr-2 h-4 w-4" />
            Otomatik Yedek Klasörünü Aç
        </Button>
    )
}
